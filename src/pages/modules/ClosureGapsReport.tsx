import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ClosureGap {
  id: string;
  cashier_id: string;
  cashier_email: string;
  cashier_role: string;
  closing_date: string;
  gap_usd: number;
  gap_cdf: number;
  transferred_usd: number;
  transferred_cdf: number;
  expected_balance_usd: number;
  expected_balance_cdf: number;
  notes: string;
}

interface CashierStats {
  cashier_id: string;
  cashier_email: string;
  cashier_role: string;
  total_closures: number;
  total_gap_usd: number;
  total_gap_cdf: number;
  avg_gap_usd: number;
  avg_gap_cdf: number;
  closures_with_gaps: number;
  gap_percentage: number;
}

const ClosureGapsReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [closures, setClosures] = useState<ClosureGap[]>([]);
  const [cashierStats, setCashierStats] = useState<CashierStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedCashier, setSelectedCashier] = useState('all');

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const monthDate = new Date(selectedMonth + '-01');
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      // Récupérer les clôtures du mois
      const { data: closuresData, error: closuresError } = await supabase
        .from('closing_transfers')
        .select('*')
        .gte('closing_date', startDate)
        .lte('closing_date', endDate)
        .order('closing_date', { ascending: false });

      if (closuresError) throw closuresError;

      // Récupérer les emails des caissiers
      const cashierIds = [...new Set(closuresData?.map(c => c.cashier_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', cashierIds);

      const closuresWithEmails: ClosureGap[] = closuresData?.map(closure => {
        const profile = profilesData?.find(p => p.id === closure.cashier_id);
        return {
          ...closure,
          cashier_email: profile?.email || 'Inconnu',
        };
      }) || [];

      setClosures(closuresWithEmails);

      // Calculer les statistiques par caissier
      const statsMap = new Map<string, CashierStats>();

      closuresWithEmails.forEach(closure => {
        const key = closure.cashier_id;
        
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            cashier_id: closure.cashier_id,
            cashier_email: closure.cashier_email,
            cashier_role: closure.cashier_role,
            total_closures: 0,
            total_gap_usd: 0,
            total_gap_cdf: 0,
            avg_gap_usd: 0,
            avg_gap_cdf: 0,
            closures_with_gaps: 0,
            gap_percentage: 0,
          });
        }

        const stats = statsMap.get(key)!;
        stats.total_closures++;
        stats.total_gap_usd += Math.abs(Number(closure.gap_usd || 0));
        stats.total_gap_cdf += Math.abs(Number(closure.gap_cdf || 0));
        
        if (closure.gap_usd !== 0 || closure.gap_cdf !== 0) {
          stats.closures_with_gaps++;
        }
      });

      // Calculer les moyennes et pourcentages
      statsMap.forEach(stats => {
        stats.avg_gap_usd = stats.total_gap_usd / stats.total_closures;
        stats.avg_gap_cdf = stats.total_gap_cdf / stats.total_closures;
        stats.gap_percentage = (stats.closures_with_gaps / stats.total_closures) * 100;
      });

      const statsArray = Array.from(statsMap.values())
        .sort((a, b) => b.total_gap_usd - a.total_gap_usd);

      setCashierStats(statsArray);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les données',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Caissier', 'Rôle', 'Total Clôtures', 'Clôtures avec Écarts', '% Écarts', 'Total Écart USD', 'Total Écart CDF', 'Moy. Écart USD', 'Moy. Écart CDF'];
    const rows = cashierStats.map(stat => [
      stat.cashier_email,
      stat.cashier_role,
      stat.total_closures,
      stat.closures_with_gaps,
      stat.gap_percentage.toFixed(2) + '%',
      stat.total_gap_usd.toFixed(2),
      stat.total_gap_cdf.toFixed(2),
      stat.avg_gap_usd.toFixed(2),
      stat.avg_gap_cdf.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_ecarts_${selectedMonth}.csv`;
    link.click();
  };

  const filteredClosures = selectedCashier === 'all' 
    ? closures 
    : closures.filter(c => c.cashier_id === selectedCashier);

  // Générer les options de mois (12 derniers mois)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: fr }),
    };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rapport des Écarts de Clôture</h1>
        <p className="text-muted-foreground">
          Analyse mensuelle des écarts de clôture par caissier
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Période</CardTitle>
          <CardDescription>Sélectionnez le mois à analyser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="month">Mois</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques par caissier */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Caissier</CardTitle>
          <CardDescription>
            Classement des caissiers selon le montant total des écarts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cashierStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune clôture trouvée pour ce mois
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rang</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="text-center">Clôtures</TableHead>
                    <TableHead className="text-center">Avec Écarts</TableHead>
                    <TableHead className="text-center">% Écarts</TableHead>
                    <TableHead className="text-right">Total Écart USD</TableHead>
                    <TableHead className="text-right">Total Écart CDF</TableHead>
                    <TableHead className="text-right">Moy. USD</TableHead>
                    <TableHead className="text-right">Moy. CDF</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashierStats.map((stat, index) => {
                    const hasIssues = stat.gap_percentage > 20 || stat.avg_gap_usd > 50;
                    return (
                      <TableRow key={stat.cashier_id} className={hasIssues ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{stat.cashier_email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{stat.cashier_role}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{stat.total_closures}</TableCell>
                        <TableCell className="text-center font-medium">
                          {stat.closures_with_gaps}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={stat.gap_percentage > 20 ? 'destructive' : 'secondary'}>
                            {stat.gap_percentage.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${stat.total_gap_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stat.total_gap_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${stat.avg_gap_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {stat.avg_gap_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                        </TableCell>
                        <TableCell className="text-center">
                          {hasIssues ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              À surveiller
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600">
                              Normal
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails des clôtures */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des Clôtures</CardTitle>
          <CardDescription>
            Liste complète des clôtures avec écarts
          </CardDescription>
          <div className="pt-4">
            <Label htmlFor="cashierFilter">Filtrer par caissier</Label>
            <Select value={selectedCashier} onValueChange={setSelectedCashier}>
              <SelectTrigger id="cashierFilter" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les caissiers</SelectItem>
                {cashierStats.map((stat) => (
                  <SelectItem key={stat.cashier_id} value={stat.cashier_id}>
                    {stat.cashier_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClosures.filter(c => c.gap_usd !== 0 || c.gap_cdf !== 0).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun écart détecté pour cette sélection
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead className="text-right">Écart USD</TableHead>
                    <TableHead className="text-right">Écart CDF</TableHead>
                    <TableHead className="text-right">Transféré USD</TableHead>
                    <TableHead className="text-right">Transféré CDF</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClosures
                    .filter(c => c.gap_usd !== 0 || c.gap_cdf !== 0)
                    .map((closure) => (
                      <TableRow key={closure.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(closure.closing_date), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>{closure.cashier_email}</TableCell>
                        <TableCell className="text-right">
                          <span className={Number(closure.gap_usd) !== 0 ? 'font-medium text-destructive' : ''}>
                            {Number(closure.gap_usd) > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <TrendingUp className="h-4 w-4" />
                                ${Math.abs(Number(closure.gap_usd)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : Number(closure.gap_usd) < 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <TrendingDown className="h-4 w-4" />
                                -${Math.abs(Number(closure.gap_usd)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              '-'
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={Number(closure.gap_cdf) !== 0 ? 'font-medium text-destructive' : ''}>
                            {Number(closure.gap_cdf) > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {Math.abs(Number(closure.gap_cdf)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                              </span>
                            ) : Number(closure.gap_cdf) < 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <TrendingDown className="h-4 w-4" />
                                -{Math.abs(Number(closure.gap_cdf)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                              </span>
                            ) : (
                              '-'
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(closure.transferred_usd).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(closure.transferred_cdf).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {closure.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClosureGapsReport;

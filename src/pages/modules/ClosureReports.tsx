import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, FileText, AlertTriangle, Eye, Calendar } from 'lucide-react';
import { ClosureDetailDialog } from '@/components/comptabilite/ClosureDetailDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClosureTransfer {
  id: string;
  cashier_id: string;
  cashier_role: string;
  closing_date: string;
  opening_balance_usd: number;
  opening_balance_cdf: number;
  closing_balance_usd: number;
  closing_balance_cdf: number;
  transferred_usd: number;
  transferred_cdf: number;
  expected_balance_usd: number;
  expected_balance_cdf: number;
  gap_usd: number;
  gap_cdf: number;
  notes: string | null;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

const ClosureReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [closures, setClosures] = useState<ClosureTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClosure, setSelectedClosure] = useState<ClosureTransfer | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [cashierFilter, setCashierFilter] = useState<string>('all');
  const [gapsOnlyFilter, setGapsOnlyFilter] = useState(false);

  const fetchClosures = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      let query = supabase
        .from('closing_transfers')
        .select('*')
        .order('closing_date', { ascending: false });

      // Appliquer le filtre de période
      if (periodFilter !== 'all') {
        const today = new Date();
        let startDate: Date;

        switch (periodFilter) {
          case 'today':
            startDate = new Date(today.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(today.setDate(today.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(today.setMonth(today.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('closing_date', startDate.toISOString().split('T')[0]);
      }

      // Appliquer le filtre de caissier
      if (cashierFilter !== 'all') {
        query = query.eq('cashier_role', cashierFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Récupérer les profils des caissiers
      const cashierIds = [...new Set(data?.map(c => c.cashier_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', cashierIds);

      // Mapper les profils aux clôtures
      const closuresWithProfiles = data?.map(closure => ({
        ...closure,
        profiles: profiles?.find(p => p.id === closure.cashier_id) || null,
      })) || [];

      let filteredData = closuresWithProfiles;

      // Appliquer le filtre d'écarts
      if (gapsOnlyFilter) {
        filteredData = filteredData.filter((c) => c.gap_usd !== 0 || c.gap_cdf !== 0);
      }

      setClosures(filteredData as any);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les clôtures',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClosures();
  }, [user, periodFilter, cashierFilter, gapsOnlyFilter]);

  const handleViewDetails = (closure: ClosureTransfer) => {
    setSelectedClosure(closure);
    setShowDetailDialog(true);
  };

  // Calcul des statistiques
  const totalTransferredUsd = closures.reduce((sum, c) => sum + Number(c.transferred_usd), 0);
  const totalTransferredCdf = closures.reduce((sum, c) => sum + Number(c.transferred_cdf), 0);
  const closuresWithGaps = closures.filter((c) => c.gap_usd !== 0 || c.gap_cdf !== 0).length;

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
        <h1 className="text-3xl font-bold">Rapports de Clôture</h1>
        <p className="text-muted-foreground">
          Consultez les clôtures de journée des caissiers et les montants transférés
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transféré (USD)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalTransferredUsd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Montant total en USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transféré (CDF)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTransferredCdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
            </div>
            <p className="text-xs text-muted-foreground">Montant total en CDF</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clôtures avec Écarts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closuresWithGaps}</div>
            <p className="text-xs text-muted-foreground">
              Sur {closures.length} clôture{closures.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Filtrez les clôtures selon vos critères</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Caissier</label>
              <Select value={cashierFilter} onValueChange={setCashierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les caissiers</SelectItem>
                  <SelectItem value="caissier">Caissier</SelectItem>
                  <SelectItem value="caissier1">Caissier 1</SelectItem>
                  <SelectItem value="caissier2">Caissier 2</SelectItem>
                  <SelectItem value="caissier3">Caissier 3</SelectItem>
                  <SelectItem value="caissier4">Caissier 4</SelectItem>
                  <SelectItem value="caissier5">Caissier 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={gapsOnlyFilter ? 'gaps' : 'all'}
                onValueChange={(v) => setGapsOnlyFilter(v === 'gaps')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les clôtures</SelectItem>
                  <SelectItem value="gaps">Avec écarts seulement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setPeriodFilter('all');
                  setCashierFilter('all');
                  setGapsOnlyFilter(false);
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des clôtures */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clôtures</CardTitle>
          <CardDescription>
            {closures.length} clôture{closures.length > 1 ? 's' : ''} trouvée{closures.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {closures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune clôture trouvée avec les filtres sélectionnés
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead className="text-right">Ouverture USD</TableHead>
                    <TableHead className="text-right">Ouverture CDF</TableHead>
                    <TableHead className="text-right">Transféré USD</TableHead>
                    <TableHead className="text-right">Transféré CDF</TableHead>
                    <TableHead className="text-center">Écarts</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closures.map((closure) => {
                    const hasGap = closure.gap_usd !== 0 || closure.gap_cdf !== 0;
                    return (
                      <TableRow key={closure.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(closure.closing_date).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {closure.profiles?.full_name || closure.profiles?.email || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {closure.cashier_role}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${closure.opening_balance_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          {closure.opening_balance_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${closure.transferred_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {closure.transferred_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                        </TableCell>
                        <TableCell className="text-center">
                          {hasGap ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Écart
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600">
                              ✓ OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(closure)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
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

      {/* Dialog de détails */}
      {selectedClosure && (
        <ClosureDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          closure={selectedClosure}
        />
      )}
    </div>
  );
};

export default ClosureReports;

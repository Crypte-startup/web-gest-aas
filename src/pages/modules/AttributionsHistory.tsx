import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttributionDetails {
  caissier_id: string;
  caissier_email: string;
  caissier_role: string;
  currency: string;
  amount: number;
  entry_id_in: string;
  entry_id_out: string;
  resp_compta_balance_before: number;
}

interface Attribution {
  id: string;
  created_at: string;
  action_type: string;
  details: AttributionDetails | any;
  user_email: string;
}

interface Cashier {
  user_id: string;
  email: string;
}

const AttributionsHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [filteredAttributions, setFilteredAttributions] = useState<Attribution[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtres
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState('all');

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [dateDebut, dateFin, selectedCashier, selectedCurrency, attributions]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Récupérer les logs d'attribution
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action_type', 'ATTRIBUTION_SOLDE_OUVERTURE')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      setAttributions(logsData || []);

      // Récupérer la liste des caissiers
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .or('role.eq.caissier,role.eq.caissier1,role.eq.caissier2,role.eq.caissier3,role.eq.caissier4,role.eq.caissier5');

      const userIds = rolesData?.map(r => r.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const cashiersWithEmails = profilesData?.map(profile => ({
        user_id: profile.id,
        email: profile.email || 'Email inconnu',
      })) || [];

      setCashiers(cashiersWithEmails);
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

  const applyFilters = () => {
    let filtered = [...attributions];

    // Filtre par date de début
    if (dateDebut) {
      filtered = filtered.filter(a => 
        new Date(a.created_at) >= new Date(dateDebut)
      );
    }

    // Filtre par date de fin
    if (dateFin) {
      filtered = filtered.filter(a => 
        new Date(a.created_at) <= new Date(dateFin + 'T23:59:59')
      );
    }

    // Filtre par caissier
    if (selectedCashier !== 'all') {
      filtered = filtered.filter(a => 
        a.details?.caissier_id === selectedCashier
      );
    }

    // Filtre par devise
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(a => 
        a.details?.currency === selectedCurrency
      );
    }

    setFilteredAttributions(filtered);
  };

  const resetFilters = () => {
    setDateDebut('');
    setDateFin('');
    setSelectedCashier('all');
    setSelectedCurrency('all');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Superviseur', 'Caissier', 'Rôle', 'Devise', 'Montant', 'Solde Avant', 'Entry ID'];
    const rows = filteredAttributions.map(a => [
      format(new Date(a.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      a.user_email,
      a.details?.caissier_email || '',
      a.details?.caissier_role || '',
      a.details?.currency || '',
      a.details?.amount || 0,
      a.details?.resp_compta_balance_before || 0,
      a.details?.entry_id_in || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attributions_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  // Calculs statistiques
  const stats = {
    total: filteredAttributions.length,
    totalUSD: filteredAttributions
      .filter(a => a.details?.currency === 'USD')
      .reduce((sum, a) => sum + (a.details?.amount || 0), 0),
    totalCDF: filteredAttributions
      .filter(a => a.details?.currency === 'CDF')
      .reduce((sum, a) => sum + (a.details?.amount || 0), 0),
  };

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
        <h1 className="text-3xl font-bold">Historique des Attributions</h1>
        <p className="text-muted-foreground">
          Historique complet des soldes d'ouverture attribués aux caissiers
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total USD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total CDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCDF.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
          <CardDescription>Affinez votre recherche</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier">Caissier</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger id="cashier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les caissiers</SelectItem>
                  {cashiers.map((cashier) => (
                    <SelectItem key={cashier.user_id} value={cashier.user_id}>
                      {cashier.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les devises</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CDF">CDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Attributions ({filteredAttributions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAttributions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune attribution trouvée avec ces filtres
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Superviseur</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Solde Avant</TableHead>
                    <TableHead>Entry ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttributions.map((attribution) => (
                    <TableRow key={attribution.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(attribution.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>{attribution.user_email}</TableCell>
                      <TableCell>{attribution.details?.caissier_email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{attribution.details?.caissier_role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={attribution.details?.currency === 'USD' ? 'default' : 'secondary'}>
                          {attribution.details?.currency}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {attribution.details?.amount?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {attribution.details?.resp_compta_balance_before?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {attribution.details?.entry_id_in}
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

export default AttributionsHistory;

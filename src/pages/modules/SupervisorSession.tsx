import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, TrendingUp, Loader2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface OpeningBalanceFormData {
  caissier_id: string;
  currency: 'USD' | 'CDF';
  amount: number;
}

interface Cashier {
  user_id: string;
  email: string;
  role: string;
}

interface Transfer {
  id: string;
  entry_id: string;
  currency: string;
  amount: number;
  client_name: string;
  motif: string;
  created_at: string;
  created_by: string;
  creator_email?: string;
}

const SupervisorSession = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<OpeningBalanceFormData>({
    defaultValues: {
      caissier_id: '',
      currency: 'USD',
      amount: 0,
    }
  });

  const selectedCurrency = watch('currency');

  const fetchCashiers = async () => {
    try {
      // Récupérer tous les caissiers
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .or('role.eq.caissier,role.eq.caissier1,role.eq.caissier2,role.eq.caissier3,role.eq.caissier4,role.eq.caissier5');

      if (rolesError) throw rolesError;

      // Récupérer les emails des caissiers
      const userIds = rolesData?.map(r => r.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const cashiersWithEmails = rolesData?.map(role => {
        const profile = profilesData?.find(p => p.id === role.user_id);
        return {
          user_id: role.user_id,
          email: profile?.email || 'Email inconnu',
          role: role.role,
        };
      }) || [];

      setCashiers(cashiersWithEmails);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les caissiers',
      });
    }
  };

  const fetchTransfers = async () => {
    try {
      // Récupérer les transferts reçus (RECETTE) sans account_owner (créés par les caissiers)
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('entry_kind', 'RECETTE')
        .eq('status', 'VALIDE')
        .like('entry_id', 'TRF-%')
        .is('account_owner', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Récupérer les emails des créateurs
      const creatorIds = [...new Set(data?.map(t => t.created_by).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', creatorIds);

      const transfersWithEmails = data?.map(transfer => {
        const profile = profilesData?.find(p => p.id === transfer.created_by);
        return {
          ...transfer,
          creator_email: profile?.email || 'Inconnu',
        };
      }) || [];

      setTransfers(transfersWithEmails);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les transferts',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCashiers(), fetchTransfers()]);
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const onSubmit = async (data: OpeningBalanceFormData) => {
    if (!user || !data.caissier_id) return;

    if (data.amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le montant doit être supérieur à 0',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedCashier = cashiers.find(c => c.user_id === data.caissier_id);

      // Upsert le solde d'ouverture (mettre à jour s'il existe, sinon créer)
      const { error: balanceError } = await supabase
        .from('starting_balances')
        .upsert({
          user_id: data.caissier_id,
          currency: data.currency,
          amount: data.amount,
          account: selectedCashier?.role || 'caissier',
        }, {
          onConflict: 'user_id,currency,account'
        });

      if (balanceError) throw balanceError;

      // Créer une transaction RECETTE dans le ledger pour que le montant apparaisse dans le solde du caissier
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          entry_id: `OPENING-${Date.now()}`,
          entry_kind: 'RECETTE',
          currency: data.currency,
          amount: data.amount,
          account_owner: data.caissier_id,
          created_by: user?.id,
          motif: 'Solde d\'ouverture attribué par superviseur',
          status: 'APPROUVE'
        });

      if (ledgerError) throw ledgerError;

      toast({
        title: 'Succès',
        description: `Solde d'ouverture de ${data.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${data.currency} attribué au caissier`,
      });

      reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible d\'attribuer le solde d\'ouverture',
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-3xl font-bold">Gestion des Sessions Caissiers</h1>
        <p className="text-muted-foreground">
          Attribuez des soldes d'ouverture et suivez les transferts des caissiers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Attribuer un solde d'ouverture
            </CardTitle>
            <CardDescription>
              Donnez un solde de départ à un caissier pour la journée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caissier">Caissier</Label>
                <Select
                  value={watch('caissier_id')}
                  onValueChange={(value) => setValue('caissier_id', value)}
                >
                  <SelectTrigger id="caissier">
                    <SelectValue placeholder="Sélectionner un caissier" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map((cashier) => (
                      <SelectItem key={cashier.user_id} value={cashier.user_id}>
                        {cashier.email} ({cashier.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!watch('caissier_id') && (
                  <p className="text-sm text-destructive">Veuillez sélectionner un caissier</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setValue('currency', value as 'USD' | 'CDF')}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="CDF">CDF (FC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount', {
                    required: 'Le montant est requis',
                    min: { value: 0.01, message: 'Le montant doit être supérieur à 0' },
                  })}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting || !watch('caissier_id')}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Attribuer le solde
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Caissiers
            </CardTitle>
            <CardDescription>Liste des caissiers actifs</CardDescription>
          </CardHeader>
          <CardContent>
            {cashiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun caissier trouvé</p>
            ) : (
              <div className="space-y-2">
                {cashiers.map((cashier) => (
                  <div
                    key={cashier.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{cashier.email}</p>
                      <p className="text-xs text-muted-foreground">{cashier.role}</p>
                    </div>
                    <Badge variant="secondary">{cashier.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transferts reçus des caissiers
          </CardTitle>
          <CardDescription>
            Historique des transferts effectués par les caissiers en fin de journée
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun transfert reçu</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>ID Transfert</TableHead>
                  <TableHead>Caissier</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      {new Date(transfer.created_at).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{transfer.entry_id}</TableCell>
                    <TableCell>{transfer.creator_email}</TableCell>
                    <TableCell className="font-medium">
                      {Number(transfer.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transfer.currency === 'USD' ? 'default' : 'secondary'}>
                        {transfer.currency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transfer.motif}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorSession;

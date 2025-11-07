import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Wallet, Send, Loader2, CalendarCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ClosureSummaryDialog } from '@/components/comptabilite/ClosureSummaryDialog';

interface TransferFormData {
  currency: 'USD' | 'CDF';
  amount: number;
}

interface Balance {
  usd: number;
  cdf: number;
}

interface StartingBalance {
  usd: number;
  cdf: number;
}

const Session = () => {
  const { user } = useAuth();
  const { roles } = useUserRole(user?.id);
  const { toast } = useToast();
  const [balance, setBalance] = useState<Balance>({ usd: 0, cdf: 0 });
  const [startingBalance, setStartingBalance] = useState<StartingBalance>({ usd: 0, cdf: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosedToday, setIsClosedToday] = useState(false);
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [closureData, setClosureData] = useState<{
    todayRecettes: { usd: number; cdf: number };
    todayDepenses: { usd: number; cdf: number };
    expectedBalance: { usd: number; cdf: number };
    gaps: { usd: number; cdf: number };
  } | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransferFormData>({
    defaultValues: {
      currency: 'USD',
      amount: 0,
    }
  });

  const selectedCurrency = watch('currency');

  const fetchBalance = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Récupérer TOUTES les transactions VALIDES du caissier
      const { data: transactions, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('account_owner', user.id)
        .eq('status', 'VALIDE');

      if (error) throw error;

      let usdBalance = 0;
      let cdfBalance = 0;
      let startingUsd = 0;
      let startingCdf = 0;

      transactions?.forEach((t) => {
        const amount = Number(t.amount);
        
        // Calculer le solde total
        if (t.entry_kind === 'RECETTE') {
          if (t.currency === 'USD') {
            usdBalance += amount;
            // Si c'est un solde d'ouverture, le compter séparément
            if (t.entry_id?.startsWith('OPENING-') && t.motif?.includes('ouverture')) {
              startingUsd += amount;
            }
          } else {
            cdfBalance += amount;
            if (t.entry_id?.startsWith('OPENING-') && t.motif?.includes('ouverture')) {
              startingCdf += amount;
            }
          }
        } else if (t.entry_kind === 'DEPENSE') {
          if (t.currency === 'USD') {
            usdBalance -= amount;
          } else {
            cdfBalance -= amount;
          }
        }
      });

      setBalance({ usd: usdBalance, cdf: cdfBalance });
      setStartingBalance({ usd: startingUsd, cdf: startingCdf });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger le solde',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkTodayClosure = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('closing_transfers')
        .select('id')
        .eq('cashier_id', user.id)
        .eq('closing_date', today)
        .maybeSingle();

      if (error) throw error;
      setIsClosedToday(!!data);
    } catch (error: any) {
      console.error('Error checking closure:', error);
    }
  };

  const fetchTodayTransactions = async () => {
    if (!user) return { recettes: { usd: 0, cdf: 0 }, depenses: { usd: 0, cdf: 0 } };

    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from('ledger')
        .select('*')
        .or(`created_by.eq.${user.id},account_owner.eq.${user.id}`)
        .gte('created_at', today)
        .lt('created_at', tomorrow);

      if (error) throw error;

      let recettesUsd = 0;
      let recettesCdf = 0;
      let depensesUsd = 0;
      let depensesCdf = 0;

      transactions?.forEach((t) => {
        if (t.entry_kind === 'RECETTE') {
          if (t.currency === 'USD') {
            recettesUsd += Number(t.amount);
          } else {
            recettesCdf += Number(t.amount);
          }
        } else if (t.entry_kind === 'DEPENSE') {
          if (t.currency === 'USD') {
            depensesUsd += Number(t.amount);
          } else {
            depensesCdf += Number(t.amount);
          }
        }
      });

      return {
        recettes: { usd: recettesUsd, cdf: recettesCdf },
        depenses: { usd: depensesUsd, cdf: depensesCdf },
      };
    } catch (error: any) {
      console.error('Error fetching today transactions:', error);
      return { recettes: { usd: 0, cdf: 0 }, depenses: { usd: 0, cdf: 0 } };
    }
  };

  const handleClosureDayClick = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // 1. Vérifier qu'aucune clôture n'existe déjà aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { data: existingClosure } = await supabase
        .from('closing_transfers')
        .select('id')
        .eq('cashier_id', user.id)
        .eq('closing_date', today)
        .maybeSingle();

      if (existingClosure) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous avez déjà clôturé votre journée',
        });
        setIsClosedToday(true);
        return;
      }

      // 2. Récupérer les transactions du jour
      const { recettes, depenses } = await fetchTodayTransactions();

      // 3. Calculer le solde attendu
      const expectedBalanceUsd = startingBalance.usd + recettes.usd - depenses.usd;
      const expectedBalanceCdf = startingBalance.cdf + recettes.cdf - depenses.cdf;

      // 4. Calculer les écarts
      const gapUsd = balance.usd - expectedBalanceUsd;
      const gapCdf = balance.cdf - expectedBalanceCdf;

      // 5. Préparer les données et ouvrir le dialogue
      setClosureData({
        todayRecettes: recettes,
        todayDepenses: depenses,
        expectedBalance: { usd: expectedBalanceUsd, cdf: expectedBalanceCdf },
        gaps: { usd: gapUsd, cdf: gapCdf },
      });

      setShowClosureDialog(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de préparer la clôture',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmClosure = async (notes: string) => {
    if (!user || !closureData) return;

    try {
      setIsSubmitting(true);
      const cashierRole = roles.find((r) => r.startsWith('caissier')) || 'caissier';
      const transferId = `CLOSURE-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];

      // 1. Créer les transactions de transfert vers resp_compta (si solde > 0)
      const transfers = [];

      if (balance.usd > 0) {
        // Dépense pour le caissier
        transfers.push(
          supabase.from('ledger').insert({
            entry_id: `${transferId}-USD-OUT`,
            entry_kind: 'DEPENSE',
            currency: 'USD',
            amount: balance.usd,
            client_name: 'Clôture de journée - Transfert au Responsable Comptabilité',
            motif: `Clôture journée du ${new Date().toLocaleDateString('fr-FR')}`,
            created_by: user.id,
            account_owner: user.id,
            status: 'VALIDE',
          })
        );

        // Recette pour resp_compta
        transfers.push(
          supabase.from('ledger').insert({
            entry_id: `${transferId}-USD-IN`,
            entry_kind: 'RECETTE',
            currency: 'USD',
            amount: balance.usd,
            client_name: `Clôture depuis ${cashierRole}`,
            motif: `Réception clôture journée ${cashierRole} - ${new Date().toLocaleDateString('fr-FR')}`,
            created_by: user.id,
            status: 'VALIDE',
          })
        );
      }

      if (balance.cdf > 0) {
        // Dépense pour le caissier
        transfers.push(
          supabase.from('ledger').insert({
            entry_id: `${transferId}-CDF-OUT`,
            entry_kind: 'DEPENSE',
            currency: 'CDF',
            amount: balance.cdf,
            client_name: 'Clôture de journée - Transfert au Responsable Comptabilité',
            motif: `Clôture journée du ${new Date().toLocaleDateString('fr-FR')}`,
            created_by: user.id,
            account_owner: user.id,
            status: 'VALIDE',
          })
        );

        // Recette pour resp_compta
        transfers.push(
          supabase.from('ledger').insert({
            entry_id: `${transferId}-CDF-IN`,
            entry_kind: 'RECETTE',
            currency: 'CDF',
            amount: balance.cdf,
            client_name: `Clôture depuis ${cashierRole}`,
            motif: `Réception clôture journée ${cashierRole} - ${new Date().toLocaleDateString('fr-FR')}`,
            created_by: user.id,
            status: 'VALIDE',
          })
        );
      }

      // Exécuter tous les transferts
      await Promise.all(transfers);

      // 2. Créer l'enregistrement de clôture
      const { error: closureError } = await supabase.from('closing_transfers').insert({
        cashier_id: user.id,
        cashier_role: cashierRole,
        closing_date: today,
        opening_balance_usd: startingBalance.usd,
        opening_balance_cdf: startingBalance.cdf,
        closing_balance_usd: balance.usd,
        closing_balance_cdf: balance.cdf,
        transferred_usd: balance.usd,
        transferred_cdf: balance.cdf,
        expected_balance_usd: closureData.expectedBalance.usd,
        expected_balance_cdf: closureData.expectedBalance.cdf,
        gap_usd: closureData.gaps.usd,
        gap_cdf: closureData.gaps.cdf,
        notes: notes || null,
        created_by: user.id,
      });

      if (closureError) throw closureError;

      // 3. Afficher toast de succès
      const hasGap = closureData.gaps.usd !== 0 || closureData.gaps.cdf !== 0;
      toast({
        title: 'Clôture réussie',
        description: hasGap
          ? `Clôture effectuée avec écart détecté. Montants transférés: $${balance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD / ${balance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF`
          : `Clôture effectuée sans écart. Montants transférés: $${balance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD / ${balance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF`,
        variant: hasGap ? 'destructive' : 'default',
      });

      // 4. Fermer le dialogue et rafraîchir
      setShowClosureDialog(false);
      setIsClosedToday(true);
      await fetchBalance();
      await checkTodayClosure();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de clôturer la journée',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    checkTodayClosure();
  }, [user]);

  const onSubmit = async (data: TransferFormData) => {
    if (!user) return;

    const currentBalance = data.currency === 'USD' ? balance.usd : balance.cdf;

    if (data.amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le montant doit être supérieur à 0',
      });
      return;
    }

    if (data.amount > currentBalance) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Solde insuffisant',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Générer un ID unique pour le transfert
      const transferId = `TRF-${Date.now()}`;
      const cashierRole = roles.find(r => r.startsWith('caissier')) || 'caissier';

      // 1. Créer une DEPENSE pour le caissier (sortie d'argent)
      const { error: depenseError } = await supabase
        .from('ledger')
        .insert({
          entry_id: `${transferId}-OUT`,
          entry_kind: 'DEPENSE',
          currency: data.currency,
          amount: data.amount,
          client_name: 'Transfert au Superviseur',
          motif: `Transfert de solde au Responsable Comptabilité - ${new Date().toLocaleDateString('fr-FR')}`,
          created_by: user.id,
          account_owner: user.id,
          status: 'VALIDE',
        });

      if (depenseError) throw depenseError;

      // 2. Créer une RECETTE pour le compte comptable (entrée d'argent)
      const { error: recetteError } = await supabase
        .from('ledger')
        .insert({
          entry_id: `${transferId}-IN`,
          entry_kind: 'RECETTE',
          currency: data.currency,
          amount: data.amount,
          client_name: `Transfert depuis ${cashierRole}`,
          motif: `Réception de solde depuis ${cashierRole} - ${new Date().toLocaleDateString('fr-FR')}`,
          created_by: user.id,
          status: 'VALIDE',
        });

      if (recetteError) throw recetteError;

      toast({
        title: 'Succès',
        description: `Transfert de ${data.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${data.currency} effectué avec succès`,
      });

      // Réinitialiser le formulaire et rafraîchir le solde
      setValue('amount', 0);
      fetchBalance();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible d\'effectuer le transfert',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxAmount = selectedCurrency === 'USD' ? balance.usd : balance.cdf;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Caissier</h1>
          <p className="text-muted-foreground">
            Gérez vos soldes et effectuez des transferts au superviseur
          </p>
        </div>
        {isClosedToday && (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Journée clôturée
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde USD</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${balance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Solde disponible en USD
            </p>
            {startingBalance.usd > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Solde d'ouverture: ${startingBalance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde CDF</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
            </div>
            <p className="text-xs text-muted-foreground">
              Solde disponible en CDF
            </p>
            {startingBalance.cdf > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Solde d'ouverture: {startingBalance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Transfert au Superviseur
          </CardTitle>
          <CardDescription>
            Transférer vos soldes au Responsable Comptabilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="amount">
                Montant (Max: {maxAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {selectedCurrency})
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', {
                  required: 'Le montant est requis',
                  min: { value: 0.01, message: 'Le montant doit être supérieur à 0' },
                  max: { value: maxAmount, message: 'Solde insuffisant' },
                })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setValue('amount', maxAmount)}
                disabled={maxAmount <= 0}
              >
                Tout transférer
              </Button>
              <Button type="submit" disabled={isSubmitting || maxAmount <= 0}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Transférer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bouton de clôture de journée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Clôture de journée
          </CardTitle>
          <CardDescription>
            Transférer tous vos soldes au Responsable Comptabilité et clôturer votre journée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isClosedToday ? (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Vous avez déjà clôturé votre journée aujourd'hui. La clôture sera à nouveau disponible demain.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Cette action transférera la totalité de vos soldes (USD: ${balance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} / CDF: {balance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC) au Responsable Comptabilité et génèrera un rapport de clôture.
                </p>
                <Button
                  onClick={handleClosureDayClick}
                  disabled={isLoading || isClosedToday || (balance.usd === 0 && balance.cdf === 0)}
                  className="w-full"
                  variant="default"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Clôturer la journée
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de clôture */}
      {closureData && (
        <ClosureSummaryDialog
          open={showClosureDialog}
          onOpenChange={setShowClosureDialog}
          openingBalance={startingBalance}
          currentBalance={balance}
          expectedBalance={closureData.expectedBalance}
          todayRecettes={closureData.todayRecettes}
          todayDepenses={closureData.todayDepenses}
          gaps={closureData.gaps}
          onConfirm={handleConfirmClosure}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default Session;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Wallet, Send, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

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
      
      // Récupérer les soldes d'ouverture
      const { data: startingBalances, error: startingError } = await supabase
        .from('starting_balances')
        .select('*')
        .eq('user_id', user.id);

      if (startingError) throw startingError;

      let startingUsd = 0;
      let startingCdf = 0;

      startingBalances?.forEach((sb) => {
        if (sb.currency === 'USD') {
          startingUsd += Number(sb.amount);
        } else if (sb.currency === 'CDF') {
          startingCdf += Number(sb.amount);
        }
      });

      setStartingBalance({ usd: startingUsd, cdf: startingCdf });
      
      // Récupérer toutes les transactions validées du caissier
      const { data: transactions, error } = await supabase
        .from('ledger')
        .select('*')
        .or(`created_by.eq.${user.id},account_owner.eq.${user.id}`)
        .eq('status', 'VALIDE');

      if (error) throw error;

      let usdBalance = startingUsd;
      let cdfBalance = startingCdf;

      transactions?.forEach((t) => {
        if (t.entry_kind === 'RECETTE') {
          if (t.currency === 'USD') {
            usdBalance += Number(t.amount);
          } else {
            cdfBalance += Number(t.amount);
          }
        } else if (t.entry_kind === 'DEPENSE') {
          if (t.currency === 'USD') {
            usdBalance -= Number(t.amount);
          } else {
            cdfBalance -= Number(t.amount);
          }
        }
      });

      setBalance({ usd: usdBalance, cdf: cdfBalance });
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

  useEffect(() => {
    fetchBalance();
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
      <div>
        <h1 className="text-3xl font-bold">Session Caissier</h1>
        <p className="text-muted-foreground">
          Gérez vos soldes et effectuez des transferts au superviseur
        </p>
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
    </div>
  );
};

export default Session;

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, DollarSign } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Balance {
  usd: number;
  cdf: number;
}

const CloseDayForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<Balance>({ usd: 0, cdf: 0 });
  const [startingBalance, setStartingBalance] = useState<Balance>({ usd: 0, cdf: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchBalances();
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['caissier', 'caissier1', 'caissier2', 'caissier3', 'caissier4', 'caissier5'])
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchBalances = async () => {
    if (!user) return;

    try {
      // Récupérer le solde d'ouverture
      const { data: startBalances } = await supabase
        .from('starting_balances')
        .select('*')
        .eq('user_id', user.id);

      const usdStart = startBalances?.find(b => b.currency === 'USD')?.amount || 0;
      const cdfStart = startBalances?.find(b => b.currency === 'CDF')?.amount || 0;
      
      setStartingBalance({ usd: usdStart, cdf: cdfStart });

      // Récupérer toutes les transactions du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: transactions } = await supabase
        .from('ledger')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'VALIDE')
        .gte('created_at', today.toISOString());

      // Calculer le solde actuel
      let usdBalance = usdStart;
      let cdfBalance = cdfStart;

      transactions?.forEach(t => {
        const amount = t.amount;
        if (t.currency === 'USD') {
          if (t.entry_kind === 'RECETTE') {
            usdBalance += amount;
          } else if (t.entry_kind === 'DEPENSE') {
            usdBalance -= amount;
          }
        } else if (t.currency === 'CDF') {
          if (t.entry_kind === 'RECETTE') {
            cdfBalance += amount;
          } else if (t.entry_kind === 'DEPENSE') {
            cdfBalance -= amount;
          }
        }
      });

      setCurrentBalance({ usd: usdBalance, cdf: cdfBalance });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      });
    }
  };

  const generateEntryId = async () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const { data: existingTransactions } = await supabase
      .from('ledger')
      .select('entry_id')
      .like('entry_id', `ACHAM-${dateStr}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let counter = 1;
    if (existingTransactions && existingTransactions.length > 0) {
      const lastId = existingTransactions[0].entry_id;
      const lastCounter = parseInt(lastId.split('-')[2]);
      counter = lastCounter + 1;
    }

    return `ACHAM-${dateStr}-${counter.toString().padStart(3, '0')}`;
  };

  const handleCloseDay = async () => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('Non authentifié');

      // Créer les transactions de retour à la comptabilité
      const transactions = [];

      if (currentBalance.usd > 0) {
        const entryIdUsd = await generateEntryId();
        transactions.push({
          entry_id: entryIdUsd,
          entry_kind: 'DEPENSE',
          currency: 'USD',
          amount: currentBalance.usd,
          client_name: 'Retour Comptabilité',
          motif: `Clôture de caisse - Retour du solde journalier`,
          created_by: user.id,
          status: 'VALIDE',
        });
      }

      if (currentBalance.cdf > 0) {
        const entryIdCdf = await generateEntryId();
        await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai pour éviter les doublons
        transactions.push({
          entry_id: entryIdCdf,
          entry_kind: 'DEPENSE',
          currency: 'CDF',
          amount: currentBalance.cdf,
          client_name: 'Retour Comptabilité',
          motif: `Clôture de caisse - Retour du solde journalier`,
          created_by: user.id,
          status: 'VALIDE',
        });
      }

      if (transactions.length > 0) {
        const { error: ledgerError } = await supabase
          .from('ledger')
          .insert(transactions);

        if (ledgerError) throw ledgerError;
      }

      // Réinitialiser les soldes d'ouverture
      const { error: balanceError } = await supabase
        .from('starting_balances')
        .update({ amount: 0 })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      toast({
        title: 'Succès',
        description: 'Clôture de caisse effectuée avec succès. Votre solde a été retourné à la comptabilité.',
      });

      setDialogOpen(false);
      fetchBalances();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Solde de Caisse
          </CardTitle>
          <CardDescription>
            Votre solde actuel et options de clôture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Solde USD</p>
              <p className="text-2xl font-bold">${currentBalance.usd.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ouverture: ${startingBalance.usd.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Solde CDF</p>
              <p className="text-2xl font-bold">{currentBalance.cdf.toFixed(2)} FC</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ouverture: {startingBalance.cdf.toFixed(2)} FC
              </p>
            </div>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            variant="destructive"
            className="w-full"
            disabled={currentBalance.usd === 0 && currentBalance.cdf === 0}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Clôturer la Caisse
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            La clôture enverra votre solde à la comptabilité et réinitialisera votre compte
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la Clôture de Caisse</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Vous êtes sur le point de clôturer votre caisse.</p>
              <div className="bg-muted p-3 rounded-md mt-2">
                <p className="font-semibold mb-2">Solde à retourner:</p>
                <p>USD: ${currentBalance.usd.toFixed(2)}</p>
                <p>CDF: {currentBalance.cdf.toFixed(2)} FC</p>
              </div>
              <p className="text-destructive font-medium mt-2">
                Cette action créera des transactions de retour et réinitialisera votre solde à zéro.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseDay}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Clôture...' : 'Confirmer la Clôture'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CloseDayForm;

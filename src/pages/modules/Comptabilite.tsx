import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, TrendingDown, Wallet, Plus, BookOpen, CheckCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import TransactionForm from '@/components/comptabilite/TransactionForm';
import JournalList from '@/components/comptabilite/JournalList';
import ApprovalList from '@/components/comptabilite/ApprovalList';
import CashierOperations from '@/components/comptabilite/CashierOperations';
import OpeningBalanceForm from '@/components/comptabilite/OpeningBalanceForm';
import CloseDayForm from '@/components/comptabilite/CloseDayForm';

const Comptabilite = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { roles } = useUserRole(user?.id);
  const [balances, setBalances] = useState({
    usd: 0,
    cdf: 0,
    recettesUsd: 0,
    recettesCdf: 0,
    depensesUsd: 0,
    depensesCdf: 0,
  });

  const isRespCompta = roles.includes('resp_compta') || roles.includes('admin');
  const isCashier = roles.some(r => ['caissier', 'caissier1', 'caissier2', 'caissier3', 'caissier4', 'caissier5'].includes(r));

  const fetchBalances = async () => {
    try {
      const { data: transactions } = await supabase
        .from('ledger')
        .select('amount, currency, entry_kind, status')
        .eq('status', 'VALIDE');

      if (transactions) {
        let usd = 0;
        let cdf = 0;
        let recettesUsd = 0;
        let recettesCdf = 0;
        let depensesUsd = 0;
        let depensesCdf = 0;

        transactions.forEach((t) => {
          if (t.entry_kind === 'RECETTE') {
            if (t.currency === 'USD') {
              recettesUsd += t.amount;
              usd += t.amount;
            } else {
              recettesCdf += t.amount;
              cdf += t.amount;
            }
          } else if (t.entry_kind === 'DEPENSE') {
            if (t.currency === 'USD') {
              depensesUsd += t.amount;
              usd -= t.amount;
            } else {
              depensesCdf += t.amount;
              cdf -= t.amount;
            }
          }
        });

        setBalances({ usd, cdf, recettesUsd, recettesCdf, depensesUsd, depensesCdf });
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchBalances();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comptabilité</h1>
          <p className="text-muted-foreground">
            {isCashier ? 'Gestion de votre caisse' : 'Gestion des recettes, dépenses et soldes comptables'}
          </p>
        </div>
        {!isCashier && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle transaction
          </Button>
        )}
      </div>

      {isCashier ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opérations de caisse</CardTitle>
              <CardDescription>
                Gérez vos recettes, dépenses et clôture de journée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setIsFormOpen(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle transaction
              </Button>
            </CardContent>
          </Card>
          <div className="max-w-2xl mx-auto">
            <CloseDayForm />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solde USD</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${balances.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Solde actuel en USD
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solde CDF</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {balances.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                </div>
                <p className="text-xs text-muted-foreground">
                  Solde actuel en CDF
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recettes USD</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${balances.recettesUsd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total des recettes USD
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recettes CDF</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {balances.recettesCdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                </div>
                <p className="text-xs text-muted-foreground">
                  Total des recettes CDF
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dépenses USD</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${balances.depensesUsd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total des dépenses USD
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dépenses CDF</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {balances.depensesCdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                </div>
                <p className="text-xs text-muted-foreground">
                  Total des dépenses CDF
                </p>
              </CardContent>
            </Card>
          </div>

          {isRespCompta && (
            <div className="max-w-2xl mx-auto">
              <OpeningBalanceForm />
            </div>
          )}

          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Gestion comptable
          </CardTitle>
          <CardDescription>
            Journal des transactions et approbation des reçus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="journal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="journal">
                <BookOpen className="h-4 w-4 mr-2" />
                Journal
              </TabsTrigger>
              <TabsTrigger value="cashiers">
                <Users className="h-4 w-4 mr-2" />
                Opérations Caissiers
              </TabsTrigger>
              <TabsTrigger value="approval">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approbation
              </TabsTrigger>
            </TabsList>
            <TabsContent value="journal" className="mt-4">
              <JournalList />
            </TabsContent>
            <TabsContent value="cashiers" className="mt-4">
              <CashierOperations />
            </TabsContent>
            <TabsContent value="approval" className="mt-4">
              <ApprovalList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle transaction</DialogTitle>
            <DialogDescription>
              Saisir une nouvelle recette ou dépense
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comptabilite;

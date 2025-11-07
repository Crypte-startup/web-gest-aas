import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, TrendingDown, Wallet, Plus, BookOpen, CheckCircle, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TransactionForm from '@/components/comptabilite/TransactionForm';
import JournalList from '@/components/comptabilite/JournalList';
import ApprovalList from '@/components/comptabilite/ApprovalList';
import { DashboardAnalytics } from '@/components/comptabilite/DashboardAnalytics';
import { useAuth } from '@/hooks/useAuth';


const Comptabilite = () => {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [balances, setBalances] = useState({
    usd: 0,
    cdf: 0,
    recettesUsd: 0,
    recettesCdf: 0,
    depensesUsd: 0,
    depensesCdf: 0,
  });

  const fetchBalances = async () => {
    if (!user) return;
    
    try {
      const { data: transactions } = await supabase
        .from('ledger')
        .select('amount, currency, entry_kind, status')
        .eq('status', 'VALIDE')
        .eq('account_owner', user.id);

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
    if (user) {
      fetchBalances();
    }
  }, [user]);

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
            Gestion des recettes, dépenses et soldes comptables
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle transaction
        </Button>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Gestion comptable
          </CardTitle>
          <CardDescription>
            Tableau de bord, journal des transactions et approbation des reçus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Tableau de bord
              </TabsTrigger>
              <TabsTrigger value="journal">
                <BookOpen className="h-4 w-4 mr-2" />
                Journal
              </TabsTrigger>
              <TabsTrigger value="approval">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approbation
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-4">
              <DashboardAnalytics />
            </TabsContent>
            <TabsContent value="journal" className="mt-4">
              <JournalList />
            </TabsContent>
            <TabsContent value="approval" className="mt-4">
              <ApprovalList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, TrendingDown, Wallet, Plus, BookOpen, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TransactionForm from '@/components/comptabilite/TransactionForm';
import JournalList from '@/components/comptabilite/JournalList';
import ApprovalList from '@/components/comptabilite/ApprovalList';

const Comptabilite = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [balances, setBalances] = useState({
    usd: 0,
    cdf: 0,
    recettes: 0,
    depenses: 0,
  });

  const fetchBalances = async () => {
    try {
      const { data: transactions } = await supabase
        .from('ledger')
        .select('amount, currency, entry_kind, status')
        .eq('status', 'VALIDE');

      if (transactions) {
        let usd = 0;
        let cdf = 0;
        let recettes = 0;
        let depenses = 0;

        transactions.forEach((t) => {
          if (t.entry_kind === 'RECETTE') {
            recettes += t.amount;
            if (t.currency === 'USD') usd += t.amount;
            else cdf += t.amount;
          } else if (t.entry_kind === 'DEPENSE') {
            depenses += t.amount;
            if (t.currency === 'USD') usd -= t.amount;
            else cdf -= t.amount;
          }
        });

        setBalances({ usd, cdf, recettes, depenses });
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
            Gestion des recettes, dépenses et soldes comptables
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle transaction
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Recettes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${balances.recettes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total des recettes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${balances.depenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total des dépenses
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
            Journal des transactions et approbation des reçus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="journal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="journal">
                <BookOpen className="h-4 w-4 mr-2" />
                Journal
              </TabsTrigger>
              <TabsTrigger value="approval">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approbation
              </TabsTrigger>
            </TabsList>
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

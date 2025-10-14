import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Printer, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
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

interface Transaction {
  id: string;
  entry_id: string;
  entry_kind: string;
  client_name: string | null;
  motif: string | null;
  currency: string;
  amount: number;
  status: string;
  created_at: string;
  created_by: string;
}

interface CashierData {
  userId: string;
  role: string;
  email: string;
  transactions: Transaction[];
}

const CashierOperations = () => {
  const [cashiersData, setCashiersData] = useState<CashierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  const fetchCashierOperations = async () => {
    try {
      // Récupérer tous les utilisateurs avec rôles caissier
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['caissier', 'caissier1', 'caissier2', 'caissier3', 'caissier4', 'caissier5']);

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setIsLoading(false);
        return;
      }

      // Récupérer les profils des caissiers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userRoles.map(ur => ur.user_id));

      if (profilesError) throw profilesError;

      // Récupérer toutes les transactions des caissiers
      const { data: transactions, error: transactionsError } = await supabase
        .from('ledger')
        .select('*')
        .in('created_by', userRoles.map(ur => ur.user_id))
        .eq('status', 'VALIDE')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Grouper les données par caissier
      const groupedData: CashierData[] = userRoles.map(userRole => {
        const profile = profiles?.find(p => p.id === userRole.user_id);
        const userTransactions = transactions?.filter(t => t.created_by === userRole.user_id) || [];

        return {
          userId: userRole.user_id,
          role: userRole.role,
          email: profile?.email || 'Email inconnu',
          transactions: userTransactions,
        };
      });

      // Filtrer les caissiers qui ont des transactions
      setCashiersData(groupedData.filter(cd => cd.transactions.length > 0));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les opérations des caissiers',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierOperations();

    // Subscribe to changes
    const channel = supabase
      .channel('cashier_operations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ledger',
        },
        () => {
          fetchCashierOperations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTypeBadge = (type: string) => {
    if (type === 'RECETTE') {
      return <Badge className="bg-green-600">Recette</Badge>;
    } else if (type === 'DEPENSE') {
      return <Badge className="bg-red-600">Dépense</Badge>;
    } else {
      return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      caissier: 'Caissier',
      caissier1: 'Caissier 1',
      caissier2: 'Caissier 2',
      caissier3: 'Caissier 3',
      caissier4: 'Caissier 4',
      caissier5: 'Caissier 5',
    };
    return labels[role] || role;
  };

  const handlePrintCashier = (cashierData: CashierData) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Journal - ${getRoleLabel(cashierData.role)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .cashier-info { text-align: center; margin-bottom: 20px; font-size: 16px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .print-date { text-align: right; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Journal des Opérations</h1>
          <div class="cashier-info">${getRoleLabel(cashierData.role)} - ${cashierData.email}</div>
          <div class="print-date">Date d'impression: ${new Date().toLocaleDateString('fr-FR')}</div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Client</th>
                <th>Motif</th>
                <th>Devise</th>
                <th class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${cashierData.transactions.map(t => `
                <tr>
                  <td>${t.entry_id}</td>
                  <td>${new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>${t.entry_kind}</td>
                  <td>${t.client_name || '-'}</td>
                  <td>${t.motif || '-'}</td>
                  <td>${t.currency}</td>
                  <td class="text-right">${t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const { error } = await supabase
        .from('ledger')
        .delete()
        .eq('id', transactionToDelete);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Transaction supprimée avec succès',
      });

      fetchCashierOperations();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la transaction',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const confirmDelete = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (cashiersData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune opération de caissier disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cashiersData.map((cashierData) => (
        <Card key={cashierData.userId}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{getRoleLabel(cashierData.role)}</span>
                <Badge variant="outline">{cashierData.email}</Badge>
              </div>
              <Button onClick={() => handlePrintCashier(cashierData)} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    {isAdmin && <TableHead className="text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashierData.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">{transaction.entry_id}</TableCell>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{getTypeBadge(transaction.entry_kind)}</TableCell>
                      <TableCell>{transaction.client_name || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.motif || '-'}</TableCell>
                      <TableCell>{transaction.currency}</TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.amount.toLocaleString('fr-FR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CashierOperations;

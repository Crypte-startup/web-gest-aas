import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Printer } from 'lucide-react';

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
}

const JournalList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('status', 'VALIDE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger le journal',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to changes in ledger table
    const channel = supabase
      .channel('ledger_validated_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ledger',
          filter: 'status=eq.VALIDE',
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ENREGISTRE: 'secondary',
      VALIDE: 'default',
      REJETE: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'RECETTE') {
      return <Badge className="bg-green-600">Recette</Badge>;
    } else if (type === 'DEPENSE') {
      return <Badge className="bg-red-600">Dépense</Badge>;
    } else {
      return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Journal Comptable</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .print-date { text-align: right; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Journal Comptable</h1>
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
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${t.entry_id}</td>
                  <td>${new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>${t.entry_kind}</td>
                  <td>${t.client_name || '-'}</td>
                  <td>${t.motif || '-'}</td>
                  <td>${t.currency}</td>
                  <td class="text-right">${t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${t.status}</td>
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune transaction validée dans le journal
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Imprimer le journal
        </Button>
      </div>
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
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
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
              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};

export default JournalList;

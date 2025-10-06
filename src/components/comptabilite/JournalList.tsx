import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
        .eq('entry_kind', 'COMPTABILITE')
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
    return type === 'RECETTE' ? (
      <Badge className="bg-green-600">Recette</Badge>
    ) : (
      <Badge className="bg-red-600">Dépense</Badge>
    );
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
        Aucune transaction dans le journal
      </div>
    );
  }

  return (
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
  );
};

export default JournalList;

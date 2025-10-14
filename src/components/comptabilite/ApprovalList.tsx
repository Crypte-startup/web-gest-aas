import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

interface Receipt {
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

const ApprovalList = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .in('entry_kind', ['LOGISTIQUE', 'RECETTE', 'DEPENSE'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les reçus',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();

    // Subscribe to changes in ledger table
    const channel = supabase
      .channel('ledger_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ledger',
        },
        () => {
          fetchReceipts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ledger')
        .update({ status: 'VALIDE' as Database['public']['Enums']['entry_status'] })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Le reçu a été validé',
      });

      fetchReceipts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de valider le reçu',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ledger')
        .update({ status: 'REJETE' as Database['public']['Enums']['entry_status'] })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Le reçu a été rejeté',
      });

      fetchReceipts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de rejeter le reçu',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ENREGISTRE: 'secondary',
      VALIDE: 'default',
      REJETE: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun reçu à approuver
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-mono text-sm">{receipt.entry_id}</TableCell>
              <TableCell>{new Date(receipt.created_at).toLocaleDateString('fr-FR')}</TableCell>
              <TableCell>
                <Badge variant="outline">{receipt.entry_kind}</Badge>
              </TableCell>
              <TableCell>{receipt.client_name || '-'}</TableCell>
              <TableCell className="max-w-xs truncate">{receipt.motif || '-'}</TableCell>
              <TableCell>{receipt.currency}</TableCell>
              <TableCell className="text-right font-medium">
                {receipt.amount.toLocaleString('fr-FR', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </TableCell>
              <TableCell>{getStatusBadge(receipt.status)}</TableCell>
              <TableCell className="text-right">
                {receipt.status === 'ENREGISTRE' && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleApprove(receipt.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleReject(receipt.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApprovalList;

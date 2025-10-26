import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, FileText, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
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
      setFilteredReceipts(data || []);
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

  useEffect(() => {
    filterByDate();
  }, [receipts, startDate, endDate]);

  const filterByDate = () => {
    if (!startDate && !endDate) {
      setFilteredReceipts(receipts);
      return;
    }

    const filtered = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.created_at);
      const receiptDateOnly = new Date(receiptDate.getFullYear(), receiptDate.getMonth(), receiptDate.getDate());
      
      if (startDate && endDate) {
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return receiptDateOnly >= start && receiptDateOnly <= end;
      } else if (startDate) {
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        return receiptDateOnly >= start;
      } else if (endDate) {
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return receiptDateOnly <= end;
      }
      return true;
    });

    setFilteredReceipts(filtered);
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

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

  const handlePrintTransaction = (receipt: Receipt) => {
    const printContent = `
      <html>
        <head>
          <title>Opération ${receipt.entry_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { max-width: 150px; margin-bottom: 10px; }
            .company-info { font-size: 12px; line-height: 1.6; }
            h1 { color: #2c5f2d; margin: 20px 0; }
            .transaction { border: 2px solid #2c5f2d; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; font-size: 11px; line-height: 1.5; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" alt="Logo" class="logo" />
            <div class="company-info">
              <strong>RCCM :</strong> CD/LSI/RCCM/24-B-745<br/>
              <strong>ID.NAT :</strong> 05-H4901-N70222J<br/>
              <strong>NIF :</strong> A2434893E<br/>
              <strong>TELEPHONE :</strong> +243 82 569 21 21<br/>
              <strong>MAIL :</strong> info@amarachamsarl.com
            </div>
          </div>
          
          <div class="transaction">
            <h1>Opération Enregistrée</h1>
            <div class="field"><span class="label">ID:</span> ${receipt.entry_id}</div>
            <div class="field"><span class="label">Type:</span> ${receipt.entry_kind}</div>
            <div class="field"><span class="label">Client:</span> ${receipt.client_name || '-'}</div>
            <div class="field"><span class="label">Motif:</span> ${receipt.motif || '-'}</div>
            <div class="field"><span class="label">Devise:</span> ${receipt.currency}</div>
            <div class="field"><span class="label">Montant:</span> ${receipt.amount.toLocaleString()} ${receipt.currency}</div>
            <div class="field"><span class="label">Statut:</span> ${receipt.status}</div>
            <div class="field"><span class="label">Date:</span> ${new Date(receipt.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
          
          <div class="footer">
            <strong>ADRESSE :</strong> 1144 avenue maître mawanga<br/>
            Quartier Ile du golf, Commune de Likasi, Haut Katanga,<br/>
            République Démocratique du Congo
          </div>
          
          <button onclick="window.print()">Imprimer</button>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
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
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Date de début</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: fr }) : <span>Sélectionner</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Date de fin</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: fr }) : <span>Sélectionner</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {(startDate || endDate) && (
          <Button variant="outline" onClick={resetFilters}>
            Réinitialiser
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground self-center">
          {filteredReceipts.length} opération(s)
        </div>
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReceipts.map((receipt) => (
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
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintTransaction(receipt)}
                    title="Imprimer cette opération"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  {receipt.status === 'ENREGISTRE' && (
                    <>
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
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};

export default ApprovalList;

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Printer, Trash2, FileText, CalendarIcon } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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
}

const JournalList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserRole(user?.id);
  const canManage = isAdmin || hasRole('resp_compta');

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

  useEffect(() => {
    filterTransactionsByPeriod();
  }, [transactions, periodFilter, startDate, endDate]);

  const filterTransactionsByPeriod = () => {
    let filtered = transactions;

    // Filtrer par période prédéfinie si sélectionnée
    if (periodFilter !== 'all' && periodFilter !== 'custom') {
      const now = new Date();
      let periodStartDate: Date;
      let periodEndDate: Date;

      switch (periodFilter) {
        case 'daily':
          periodStartDate = startOfDay(now);
          periodEndDate = endOfDay(now);
          break;
        case 'weekly':
          periodStartDate = startOfWeek(now, { weekStartsOn: 1 });
          periodEndDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'monthly':
          periodStartDate = startOfMonth(now);
          periodEndDate = endOfMonth(now);
          break;
        case 'yearly':
          periodStartDate = startOfYear(now);
          periodEndDate = endOfYear(now);
          break;
        default:
          periodStartDate = new Date(0);
          periodEndDate = new Date();
      }

      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= periodStartDate && transactionDate <= periodEndDate;
      });
    }

    // Filtrer par dates personnalisées
    if (periodFilter === 'custom' && (startDate || endDate)) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.created_at);
        const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        
        if (startDate && endDate) {
          const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return transactionDateOnly >= start && transactionDateOnly <= end;
        } else if (startDate) {
          const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          return transactionDateOnly >= start;
        } else if (endDate) {
          const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return transactionDateOnly <= end;
        }
        return true;
      });
    }

    setFilteredTransactions(filtered);
  };

  const resetCustomDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

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

      fetchTransactions();
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

  const handlePrintTransaction = (transaction: Transaction) => {
    const printContent = `
      <html>
        <head>
          <title>Transaction ${transaction.entry_id}</title>
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
            <h1>Transaction Comptable</h1>
            <div class="field"><span class="label">ID:</span> ${transaction.entry_id}</div>
            <div class="field"><span class="label">Type:</span> ${transaction.entry_kind}</div>
            <div class="field"><span class="label">Client:</span> ${transaction.client_name || '-'}</div>
            <div class="field"><span class="label">Motif:</span> ${transaction.motif || '-'}</div>
            <div class="field"><span class="label">Devise:</span> ${transaction.currency}</div>
            <div class="field"><span class="label">Montant:</span> ${transaction.amount.toLocaleString()} ${transaction.currency}</div>
            <div class="field"><span class="label">Statut:</span> ${transaction.status}</div>
            <div class="field"><span class="label">Date:</span> ${new Date(transaction.created_at).toLocaleDateString('fr-FR')}</div>
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

  const handlePrint = () => {
    const getPeriodLabel = () => {
      switch (periodFilter) {
        case 'daily': return 'Journalier';
        case 'weekly': return 'Hebdomadaire';
        case 'monthly': return 'Mensuel';
        case 'yearly': return 'Annuel';
        default: return 'Complet';
      }
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Journal Comptable - ${getPeriodLabel()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .period { text-align: center; margin-bottom: 20px; font-size: 16px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .print-date { text-align: right; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Journal Comptable</h1>
          <div class="period">Période: ${getPeriodLabel()}</div>
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
              ${filteredTransactions.map(t => `
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
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Période</label>
          <Select value={periodFilter} onValueChange={(value) => {
            setPeriodFilter(value);
            if (value !== 'custom') {
              resetCustomDates();
            }
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner la période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="daily">Journalier</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="yearly">Annuel</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periodFilter === 'custom' && (
          <>
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
              <Button variant="outline" onClick={resetCustomDates} className="self-end">
                Réinitialiser
              </Button>
            )}
          </>
        )}

        <div className="ml-auto flex gap-2 self-end">
          <div className="text-sm text-muted-foreground self-center">
            {filteredTransactions.length} transaction(s)
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
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
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((transaction) => (
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
              <TableCell className="text-center">
                <div className="flex gap-1 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintTransaction(transaction)}
                    title="Imprimer cette transaction"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

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

export default JournalList;

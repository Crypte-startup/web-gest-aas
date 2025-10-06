import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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

interface ReceiptListProps {
  receipts: any[];
  onEdit: (receipt: any) => void;
  onDelete: () => void;
}

const ReceiptList = ({ receipts, onEdit, onDelete }: ReceiptListProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      ENREGISTRE: { label: 'Enregistré', variant: 'secondary' },
      VALIDE: { label: 'Validé', variant: 'default' },
      APPROUVE: { label: 'Approuvé', variant: 'default' },
      PENDING_RESP: { label: 'En attente resp.', variant: 'outline' },
      PENDING_ADMIN: { label: 'En attente admin', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('ledger')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Le reçu a été supprimé',
      });

      onDelete();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le reçu',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrint = (receipt: any) => {
    const printContent = `
      <html>
        <head>
          <title>Reçu Logistique - ${receipt.entry_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c5f2d; margin-bottom: 20px; }
            .receipt { border: 2px solid #2c5f2d; padding: 30px; border-radius: 8px; max-width: 600px; }
            .field { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
            .label { font-weight: bold; color: #2c5f2d; display: block; margin-bottom: 5px; }
            .value { font-size: 16px; }
            .header { text-align: center; margin-bottom: 30px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>REÇU LOGISTIQUE</h1>
            </div>
            <div class="field">
              <span class="label">ID d'entrée</span>
              <span class="value">${receipt.entry_id}</span>
            </div>
            <div class="field">
              <span class="label">Motif</span>
              <span class="value">${receipt.motif || 'N/A'}</span>
            </div>
            <div class="field">
              <span class="label">Montant</span>
              <span class="value">${receipt.amount} ${receipt.currency}</span>
            </div>
            <div class="field">
              <span class="label">Statut</span>
              <span class="value">${receipt.status}</span>
            </div>
            <div class="field">
              <span class="label">Date de création</span>
              <span class="value">${format(new Date(receipt.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
            </div>
            <div class="footer">
              Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </div>
          </div>
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

  if (receipts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun reçu logistique pour le moment
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID entrée</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Devise</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">{receipt.entry_id}</TableCell>
                <TableCell className="max-w-xs truncate">{receipt.motif || 'N/A'}</TableCell>
                <TableCell>{receipt.currency}</TableCell>
                <TableCell className="text-right font-mono">
                  {Number(receipt.amount).toFixed(2)}
                </TableCell>
                <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                <TableCell>
                  {format(new Date(receipt.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrint(receipt)}
                      title="Imprimer"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(receipt)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(receipt.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce reçu ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReceiptList;
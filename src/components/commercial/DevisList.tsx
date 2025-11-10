import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Printer, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import DevisForm from './DevisForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { numberToWords } from '@/lib/numberToWords';

interface Devis {
  id: string;
  client_name: string;
  devise: string;
  montant: number;
  motif?: string;
  created_at: string;
}

interface DevisItem {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
}

const DevisList = () => {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  const { settings } = useCompanySettings();

  const fetchDevis = async () => {
    const { data, error } = await supabase
      .from('devis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les devis',
        variant: 'destructive',
      });
      return;
    }

    setDevisList(data || []);
  };

  useEffect(() => {
    fetchDevis();
  }, []);

  const handleEdit = (devis: Devis) => {
    setSelectedDevis(devis);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedDevis(undefined);
    setIsFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('devis')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le devis',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Succès',
      description: 'Devis supprimé avec succès',
    });

    setDeleteId(null);
    fetchDevis();
  };

  const handlePrint = async (devis: Devis) => {
    // Fetch devis items
    const { data: items, error } = await supabase
      .from('devis_items')
      .select('*')
      .eq('devis_id', devis.id);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les articles',
        variant: 'destructive',
      });
      return;
    }

    const montantEnLettres = numberToWords(devis.montant, devis.devise);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = items?.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.designation}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantite}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${Number(item.prix_unitaire).toLocaleString()}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${Number(item.prix_total).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Devis - ${devis.client_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { width: 120px; height: auto; }
            .company-info { text-align: right; font-size: 12px; line-height: 1.6; }
            .company-info strong { display: block; margin-bottom: 5px; }
            h1 { color: #333; text-align: center; margin: 20px 0; }
            .info { margin: 20px 0; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .amount-words { margin: 20px 0; font-style: italic; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; font-size: 11px; line-height: 1.5; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="Logo" class="logo" />` : `<img src="/logo.png" alt="Logo" class="logo" />`}
            <div class="company-info">
              <strong>RCCM : ${settings?.rccm || 'CD/LSI/RCCM/24-B-745'}</strong>
              <strong>ID.NAT : ${settings?.id_nat || '05-H4901-N70222J'}</strong>
              <strong>NIF : ${settings?.nif || 'A2434893E'}</strong>
              <strong>TEL : ${settings?.phone || '+243 82 569 21 21'}</strong>
              <strong>MAIL : ${settings?.email || 'info@amarachamsarl.com'}</strong>
            </div>
          </div>
          <h1>DEVIS</h1>
          <div class="info">
            <p><span class="label">Client:</span> ${devis.client_name}</p>
            ${devis.motif ? `<p><span class="label">Motif:</span> ${devis.motif}</p>` : ''}
            <p><span class="label">Date:</span> ${new Date(devis.created_at).toLocaleDateString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th style="text-align: right;">Quantité</th>
                <th style="text-align: right;">Prix unitaire (${devis.devise})</th>
                <th style="text-align: right;">Prix total (${devis.devise})</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right;">${devis.montant.toLocaleString()} ${devis.devise}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="amount-words">
            <p><span class="label">Montant en lettres:</span> ${montantEnLettres}</p>
          </div>
          
          <div class="footer">
            <strong>ADRESSE :</strong> ${settings?.address || '1144 avenue maître mawanga'}<br/>
            ${settings?.city || 'Quartier Ile du golf, Commune de Likasi'}, ${settings?.province || 'Haut Katanga'},<br/>
            ${settings?.country || 'République Démocratique du Congo'}
          </div>
          
          <button onclick="window.print()">Imprimer</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Devis</h2>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un devis
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Devise</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devisList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun devis enregistré
                </TableCell>
              </TableRow>
            ) : (
              devisList.map((devis) => (
                <TableRow key={devis.id}>
                  <TableCell>{devis.client_name}</TableCell>
                  <TableCell>{devis.devise}</TableCell>
                  <TableCell>{devis.montant.toLocaleString()}</TableCell>
                  <TableCell>{devis.motif || '-'}</TableCell>
                  <TableCell>{new Date(devis.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(devis)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(devis)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(devis.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DevisForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDevis(undefined);
        }}
        devis={selectedDevis}
        onSuccess={fetchDevis}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DevisList;

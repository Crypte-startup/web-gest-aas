import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FactureForm from './FactureForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface Facture {
  id: string;
  client_name: string;
  devise: string;
  montant: number;
  created_at: string;
}

const FactureList = () => {
  const [factureList, setFactureList] = useState<Facture[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  const fetchFactures = async () => {
    const { data, error } = await supabase
      .from('facture')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les factures',
        variant: 'destructive',
      });
      return;
    }

    setFactureList(data || []);
  };

  useEffect(() => {
    fetchFactures();
  }, []);

  const handleEdit = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedFacture(undefined);
    setIsFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('facture')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la facture',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Succès',
      description: 'Facture supprimée avec succès',
    });

    setDeleteId(null);
    fetchFactures();
  };

  const handlePrint = (facture: Facture) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture - ${facture.client_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .info { margin: 20px 0; }
            .label { font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>FACTURE</h1>
          <div class="info">
            <p><span class="label">Client:</span> ${facture.client_name}</p>
            <p><span class="label">Devise:</span> ${facture.devise}</p>
            <p><span class="label">Montant:</span> ${facture.montant.toLocaleString()}</p>
            <p><span class="label">Date:</span> ${new Date(facture.created_at).toLocaleDateString()}</p>
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
        <h2 className="text-2xl font-bold">Factures</h2>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Créer une facture
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Devise</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factureList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucune facture enregistrée
                </TableCell>
              </TableRow>
            ) : (
              factureList.map((facture) => (
                <TableRow key={facture.id}>
                  <TableCell>{facture.client_name}</TableCell>
                  <TableCell>{facture.devise}</TableCell>
                  <TableCell>{facture.montant.toLocaleString()}</TableCell>
                  <TableCell>{new Date(facture.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(facture)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(facture)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(facture.id)}
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

      <FactureForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedFacture(undefined);
        }}
        facture={selectedFacture}
        onSuccess={fetchFactures}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.
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

export default FactureList;

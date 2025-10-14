import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DevisForm from './DevisForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface Devis {
  id: string;
  client_name: string;
  devise: string;
  montant: number;
  created_at: string;
}

const DevisList = () => {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

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

  const handlePrint = (devis: Devis) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Devis - ${devis.client_name}</title>
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
          <h1>DEVIS</h1>
          <div class="info">
            <p><span class="label">Client:</span> ${devis.client_name}</p>
            <p><span class="label">Devise:</span> ${devis.devise}</p>
            <p><span class="label">Montant:</span> ${devis.montant.toLocaleString()}</p>
            <p><span class="label">Date:</span> ${new Date(devis.created_at).toLocaleDateString()}</p>
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
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devisList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun devis enregistré
                </TableCell>
              </TableRow>
            ) : (
              devisList.map((devis) => (
                <TableRow key={devis.id}>
                  <TableCell>{devis.client_name}</TableCell>
                  <TableCell>{devis.devise}</TableCell>
                  <TableCell>{devis.montant.toLocaleString()}</TableCell>
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Printer, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ClientForm from '@/components/clientele/ClientForm';

interface Client {
  id: string;
  name: string;
  postnom: string | null;
  prenom: string | null;
  date_naissance: string | null;
  phone: string | null;
  email: string | null;
  ecole: string | null;
  classe: string | null;
  created_at: string;
}

const CommercialClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const { toast } = useToast();

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les clients',
        variant: 'destructive',
      });
      return;
    }

    setClients(data || []);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedClient(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedClient(undefined);
  };

  const handleFormSuccess = () => {
    fetchClients();
    handleFormClose();
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const clientRows = clients
      .map(
        (client) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.postnom || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.prenom || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.phone || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.email || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.ecole || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${client.classe || '-'}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Liste des Clients - Commercial</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f4f4f4; border: 1px solid #ddd; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            .print-date { text-align: right; margin-bottom: 10px; color: #666; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>LISTE DES CLIENTS - COMMERCIAL</h1>
          <div class="print-date">Date: ${new Date().toLocaleDateString('fr-FR')}</div>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Postnom</th>
                <th>Prénom</th>
                <th>Date naissance</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>École</th>
                <th>Classe</th>
              </tr>
            </thead>
            <tbody>
              ${clientRows}
            </tbody>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Imprimer</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintOne = (client: Client) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fiche Client - ${client.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; width: 200px; color: #555; }
            .info-value { flex: 1; }
            .print-date { text-align: right; margin-bottom: 20px; color: #666; font-size: 14px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-date">Date d'impression: ${new Date().toLocaleDateString('fr-FR')}</div>
          <h1>FICHE CLIENT</h1>
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Nom:</span>
              <span class="info-value">${client.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Postnom:</span>
              <span class="info-value">${client.postnom || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Prénom:</span>
              <span class="info-value">${client.prenom || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date de naissance:</span>
              <span class="info-value">${client.date_naissance ? new Date(client.date_naissance).toLocaleDateString('fr-FR') : '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone:</span>
              <span class="info-value">${client.phone || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${client.email || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">École:</span>
              <span class="info-value">${client.ecole || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Classe:</span>
              <span class="info-value">${client.classe || '-'}</span>
            </div>
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Imprimer</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clients</h2>
        <div className="flex gap-2">
          <Button onClick={handlePrintAll} disabled={clients.length === 0} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer la liste
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un client
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Postnom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Date naissance</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>École</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Aucun client enregistré
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.postnom || '-'}</TableCell>
                  <TableCell>{client.prenom || '-'}</TableCell>
                  <TableCell>
                    {client.date_naissance 
                      ? new Date(client.date_naissance).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell>{client.email || '-'}</TableCell>
                  <TableCell>{client.ecole || '-'}</TableCell>
                  <TableCell>{client.classe || '-'}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintOne(client)}
                        title="Imprimer"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientForm
        open={isFormOpen}
        onClose={handleFormClose}
        client={selectedClient}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default CommercialClientList;

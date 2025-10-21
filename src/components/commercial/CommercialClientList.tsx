import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const handlePrint = () => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clients</h2>
        <Button onClick={handlePrint} disabled={clients.length === 0}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer la liste
        </Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CommercialClientList;

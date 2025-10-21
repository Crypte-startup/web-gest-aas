import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Pencil, Trash2, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ClientListProps {
  clients: any[];
  isLoading: boolean;
  onEdit: (client: any) => void;
  onDelete: (clientId: string) => void;
  onAdd: () => void;
}

const handlePrintAll = (clients: any[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const clientRows = clients
    .map(
      (client) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.postnom || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.prenom || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.date_naissance ? format(new Date(client.date_naissance), 'dd/MM/yyyy', { locale: fr }) : '-'}</td>
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
        <title>Liste des Clients - Clientèle</title>
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
        <h1>LISTE DES CLIENTS - CLIENTÈLE</h1>
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

const handlePrintOne = (client: any) => {
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
            <span class="info-value">${client.date_naissance ? format(new Date(client.date_naissance), 'dd/MM/yyyy', { locale: fr }) : '-'}</span>
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
          <div class="info-row">
            <span class="info-label">Domicile:</span>
            <span class="info-value">${client.domicile || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Adresse école:</span>
            <span class="info-value">${client.adresse_ecole || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Trajet:</span>
            <span class="info-value">${client.trajet || '-'}</span>
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

const ClientList = ({ clients, isLoading, onEdit, onDelete, onAdd }: ClientListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Aucun client enregistré pour le moment</p>
        <Button onClick={onAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un client
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button onClick={() => handlePrintAll(clients)} disabled={clients.length === 0}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimer la liste
        </Button>
        <Button onClick={onAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un client
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Postnom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Date de naissance</TableHead>
              <TableHead>École</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  {client.photo_url ? (
                    <img
                      src={client.photo_url}
                      alt={client.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {client.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.postnom || '-'}</TableCell>
                <TableCell>{client.prenom || '-'}</TableCell>
                <TableCell>
                  {client.date_naissance 
                    ? format(new Date(client.date_naissance), 'dd/MM/yyyy', { locale: fr })
                    : '-'
                  }
                </TableCell>
                <TableCell>{client.ecole || '-'}</TableCell>
                <TableCell>{client.classe || '-'}</TableCell>
                <TableCell>{client.phone || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintOne(client)}
                      title="Imprimer ce client"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default ClientList;

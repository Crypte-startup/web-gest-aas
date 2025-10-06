import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ClientListProps {
  clients: any[];
  isLoading: boolean;
  onEdit: (client: any) => void;
  onDelete: (clientId: string) => void;
  onAdd: () => void;
}

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
      <div className="flex justify-end">
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

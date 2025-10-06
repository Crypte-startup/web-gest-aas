import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ClientForm from '@/components/clientele/ClientForm';
import ClientList from '@/components/clientele/ClientList';

const Clientele = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du client');
      console.error('Error deleting client:', error);
    },
  });

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = (clientId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const activeClients = clients.filter(c => c.created_at);
  const newClientsThisMonth = clients.filter(c => {
    const createdDate = new Date(c.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && 
           createdDate.getFullYear() === now.getFullYear();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientèle</h1>
        <p className="text-muted-foreground">
          Gestion des clients et relations commerciales
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Clients enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newClientsThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients.length}</div>
            <p className="text-xs text-muted-foreground">
              Clients actifs
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des clients
          </CardTitle>
          <CardDescription>
            Gérer vos clients et leurs informations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientList 
            clients={clients}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={() => setIsFormOpen(true)}
          />
        </CardContent>
      </Card>

      <ClientForm
        open={isFormOpen}
        onClose={handleFormClose}
        client={editingClient}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          handleFormClose();
        }}
      />
    </div>
  );
};

export default Clientele;

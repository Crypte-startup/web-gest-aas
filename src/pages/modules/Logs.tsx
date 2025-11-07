import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, Search } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_email: string;
  action_type: string;
  table_name: string | null;
  record_id: string | null;
  details: any;
  created_at: string;
}

const actionTypeLabels: Record<string, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  CREATE_TRANSACTION: 'Création transaction',
  UPDATE_TRANSACTION: 'Modification transaction',
  DELETE_TRANSACTION: 'Suppression transaction',
  CREATE_CLIENT: 'Ajout client',
  UPDATE_CLIENT: 'Modification client',
  DELETE_CLIENT: 'Suppression client',
  CREATE_EMPLOYEE: 'Ajout employé',
  UPDATE_EMPLOYEE: 'Modification employé',
  DELETE_EMPLOYEE: 'Suppression employé',
  ASSIGN_ROLE: 'Attribution rôle',
  REVOKE_ROLE: 'Révocation rôle',
};

const actionTypeColors: Record<string, string> = {
  LOGIN: 'bg-green-500',
  LOGOUT: 'bg-gray-500',
  CREATE_TRANSACTION: 'bg-blue-500',
  UPDATE_TRANSACTION: 'bg-yellow-500',
  DELETE_TRANSACTION: 'bg-red-500',
  CREATE_CLIENT: 'bg-blue-500',
  UPDATE_CLIENT: 'bg-yellow-500',
  DELETE_CLIENT: 'bg-red-500',
  CREATE_EMPLOYEE: 'bg-blue-500',
  UPDATE_EMPLOYEE: 'bg-yellow-500',
  DELETE_EMPLOYEE: 'bg-red-500',
  ASSIGN_ROLE: 'bg-purple-500',
  REVOKE_ROLE: 'bg-orange-500',
};

const Logs = () => {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRole(user?.id);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAdmin || rolesLoading) {
      setLoading(false);
      return;
    }

    fetchLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, rolesLoading]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  if (rolesLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
          <CardDescription>
            Seuls les administrateurs peuvent accéder aux journaux d'activité.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actionTypeLabels[log.action_type]?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;

    return matchesSearch && matchesAction;
  });

  const uniqueActionTypes = Array.from(new Set(logs.map(log => log.action_type)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Journaux d'activité</h1>
        <p className="text-muted-foreground">
          Historique complet de toutes les opérations et connexions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Activités récentes</CardTitle>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[200px]"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Type d'action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  {uniqueActionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {actionTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aucune activité trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: fr })}
                      </TableCell>
                      <TableCell>{log.user_email || 'Système'}</TableCell>
                      <TableCell>
                        <Badge className={actionTypeColors[log.action_type] || 'bg-gray-500'}>
                          {actionTypeLabels[log.action_type] || log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.table_name || '-'}</TableCell>
                      <TableCell>
                        {log.details && (
                          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;

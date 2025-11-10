import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Loader2, Database, RotateCw, Trash2, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Backup {
  id: string;
  backup_date: string;
  created_by: string;
  ledger_data: any[];
  closing_transfers_data: any[];
  starting_balances_data: any[];
  stats: {
    ledgerCount: number;
    closuresCount: number;
    balancesCount: number;
  };
  notes: string | null;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

const Backups = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<Backup | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchBackups();
    }
  }, [isAdmin]);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('data_backups')
        .select('*')
        .order('backup_date', { ascending: false });

      if (error) throw error;

      // Récupérer les profils des créateurs
      const creatorIds = [...new Set(data?.map(b => b.created_by).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', creatorIds);

      // Mapper les profils aux backups
      const backupsWithProfiles = data?.map(backup => ({
        ...backup,
        profiles: profiles?.find(p => p.id === backup.created_by) || null,
      })) || [];

      setBackups(backupsWithProfiles as any);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les backups',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;

    setIsRestoring(true);
    try {
      // 1. Supprimer les données actuelles
      await supabase.from('closing_transfers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('starting_balances').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 2. Restaurer les données du backup
      if (selectedBackup.ledger_data?.length > 0) {
        const { error: ledgerError } = await supabase
          .from('ledger')
          .insert(selectedBackup.ledger_data);
        if (ledgerError) throw ledgerError;
      }

      if (selectedBackup.closing_transfers_data?.length > 0) {
        const { error: closuresError } = await supabase
          .from('closing_transfers')
          .insert(selectedBackup.closing_transfers_data);
        if (closuresError) throw closuresError;
      }

      if (selectedBackup.starting_balances_data?.length > 0) {
        const { error: balancesError } = await supabase
          .from('starting_balances')
          .insert(selectedBackup.starting_balances_data);
        if (balancesError) throw balancesError;
      }

      toast({
        title: 'Succès',
        description: `Backup du ${format(new Date(selectedBackup.backup_date), 'Pp', { locale: fr })} restauré avec succès`,
      });

      setShowRestoreDialog(false);
      setSelectedBackup(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de restaurer le backup',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = (backup: Backup) => {
    setBackupToDelete(backup);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!backupToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('data_backups')
        .delete()
        .eq('id', backupToDelete.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Backup supprimé avec succès',
      });

      setShowDeleteDialog(false);
      setBackupToDelete(null);
      fetchBackups();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le backup',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = (backup: Backup) => {
    const data = {
      backup_date: backup.backup_date,
      stats: backup.stats,
      notes: backup.notes,
      ledger_data: backup.ledger_data,
      closing_transfers_data: backup.closing_transfers_data,
      starting_balances_data: backup.starting_balances_data,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${format(new Date(backup.backup_date), 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Succès',
      description: 'Backup téléchargé avec succès',
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Seuls les administrateurs peuvent accéder à la gestion des backups.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          Gestion des Backups
        </h1>
        <p className="text-muted-foreground">
          Consultez et restaurez les sauvegardes automatiques des données
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backups totaux</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">Sauvegardes disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernier backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups.length > 0
                ? format(new Date(backups[0].backup_date), 'dd/MM/yyyy', { locale: fr })
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backups.length > 0
                ? format(new Date(backups[0].backup_date), 'HH:mm', { locale: fr })
                : 'Aucun backup'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace utilisé</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                backups.reduce(
                  (sum, b) =>
                    sum +
                    (b.ledger_data?.length || 0) +
                    (b.closing_transfers_data?.length || 0) +
                    (b.starting_balances_data?.length || 0),
                  0
                ) / 1000
              ).toFixed(1)}
              K
            </div>
            <p className="text-xs text-muted-foreground">Enregistrements sauvegardés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des backups */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Backups</CardTitle>
          <CardDescription>
            {backups.length} backup{backups.length > 1 ? 's' : ''} disponible
            {backups.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun backup disponible
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Créé par</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-center">Clôtures</TableHead>
                    <TableHead className="text-center">Soldes</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(backup.backup_date), 'dd MMMM yyyy', { locale: fr })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(backup.backup_date), 'HH:mm:ss', { locale: fr })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {backup.profiles?.full_name || backup.profiles?.email || 'Système'}
                          </div>
                          {backup.profiles?.email && (
                            <div className="text-xs text-muted-foreground">
                              {backup.profiles.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{backup.stats.ledgerCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{backup.stats.closuresCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{backup.stats.balancesCount || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {backup.notes || 'Aucune note'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(backup)}
                            title="Restaurer ce backup"
                          >
                            <RotateCw className="h-4 w-4 mr-1" />
                            Restaurer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(backup)}
                            title="Télécharger ce backup"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(backup)}
                            className="text-destructive hover:text-destructive"
                            title="Supprimer ce backup"
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
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de restauration */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-primary" />
              Confirmer la restauration
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir restaurer le backup du{' '}
                <strong>
                  {selectedBackup &&
                    format(new Date(selectedBackup.backup_date), 'Pp', { locale: fr })}
                </strong>{' '}
                ?
              </p>
              {selectedBackup && (
                <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                  <p>Ce backup contient :</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>{selectedBackup.stats.ledgerCount} transactions</li>
                    <li>{selectedBackup.stats.closuresCount} clôtures</li>
                    <li>{selectedBackup.stats.balancesCount} soldes de départ</li>
                  </ul>
                </div>
              )}
              <p className="text-destructive font-medium">
                Attention : Cette action supprimera toutes les données actuelles et les remplacera
                par celles du backup.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={isRestoring}
              className="bg-primary hover:bg-primary/90"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restauration...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Oui, restaurer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le backup du{' '}
              <strong>
                {backupToDelete &&
                  format(new Date(backupToDelete.backup_date), 'Pp', { locale: fr })}
              </strong>{' '}
              ?
              <br />
              <br />
              Cette action est irréversible et vous ne pourrez plus restaurer ce backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Backups;
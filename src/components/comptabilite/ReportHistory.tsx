import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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

interface ReportRecord {
  id: string;
  report_month: number;
  report_year: number;
  generated_at: string;
  generated_by: string;
  kpis: any;
  comparison_data: any;
  cashier_summary: any;
  notes: string | null;
}

interface ReportHistoryProps {
  onViewReport: (month: number, year: number, reportData: ReportRecord) => void;
}

export const ReportHistory = ({ onViewReport }: ReportHistoryProps) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monthly_reports')
        .select('*')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des rapports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;

    try {
      const { error } = await supabase
        .from('monthly_reports')
        .delete()
        .eq('id', reportToDelete);

      if (error) throw error;

      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé avec succès",
      });

      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rapport",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getReportStatus = (reportDate: string) => {
    const now = new Date();
    const generated = new Date(reportDate);
    const diffInDays = Math.floor((now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 7) return { label: 'Récent', variant: 'default' as const };
    if (diffInDays < 30) return { label: 'Ce mois', variant: 'secondary' as const };
    return { label: 'Archivé', variant: 'outline' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historique des rapports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historique des rapports
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {reports.length} rapport{reports.length > 1 ? 's' : ''} archivé{reports.length > 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun rapport archivé pour le moment
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Généré le</TableHead>
                  <TableHead>Recettes USD</TableHead>
                  <TableHead>Dépenses USD</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const status = getReportStatus(report.generated_at);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {monthNames[report.report_month]} {report.report_year}
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        ${report.kpis.totalRecettesUsd?.toLocaleString('fr-FR') || '0'}
                      </TableCell>
                      <TableCell>
                        ${report.kpis.totalDepensesUsd?.toLocaleString('fr-FR') || '0'}
                      </TableCell>
                      <TableCell>
                        {report.kpis.totalTransactions || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewReport(report.report_month, report.report_year, report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setReportToDelete(report.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rapport archivé sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, TrendingUp, TrendingDown, Activity, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { useAnalyticsData, AnalyticsFilters } from '@/hooks/useAnalyticsData';
import { TrendChart } from './charts/TrendChart';
import { CashierComparisonChart } from './charts/CashierComparisonChart';
import { DistributionChart } from './charts/DistributionChart';
import { GapAnalysisChart } from './charts/GapAnalysisChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const DashboardAnalytics = () => {
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserRole(user?.id);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    cashierIds: [],
    currency: 'BOTH',
  });
  const [cashiers, setCashiers] = useState<Array<{ id: string; name: string }>>([]);
  const { loading, cashierData, dailyData, kpis } = useAnalyticsData(filters);

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, profiles:user_id(id, full_name, username)')
        .in('role', ['caissier', 'caissier1', 'caissier2', 'caissier3', 'caissier4', 'caissier5']);

      if (roles) {
        const uniqueCashiers = Array.from(
          new Map(
            roles.map((r: any) => [
              r.profiles.id,
              { id: r.profiles.id, name: r.profiles.full_name || r.profiles.username }
            ])
          ).values()
        );
        setCashiers(uniqueCashiers);
      }
    } catch (error) {
      console.error('Error fetching cashiers:', error);
    }
  };

  const setPeriod = (period: string) => {
    const today = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case '7days':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(today.setDate(today.getDate() - 30));
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        setFilters({
          ...filters,
          startDate,
          endDate: new Date(today.getFullYear(), today.getMonth(), 0),
        });
        return;
    }

    setFilters({ ...filters, startDate, endDate: new Date() });
  };

  const handleExportPDF = async () => {
    try {
      toast({ title: "Génération du PDF...", description: "Veuillez patienter" });
      
      const element = document.getElementById('dashboard-content');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`tableau-bord-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({ title: "PDF généré avec succès" });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Erreur", description: "Impossible de générer le PDF", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-content">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select onValueChange={setPeriod} defaultValue="30days">
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="thisMonth">Ce mois</SelectItem>
                  <SelectItem value="lastMonth">Mois dernier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Devise</label>
              <Select 
                value={filters.currency} 
                onValueChange={(value: 'USD' | 'CDF' | 'BOTH') => 
                  setFilters({ ...filters, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Les deux</SelectItem>
                  <SelectItem value="USD">USD uniquement</SelectItem>
                  <SelectItem value="CDF">CDF uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-end">
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recettes USD</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${kpis.totalRecettesUsd.toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses USD</CardTitle>
            <TrendingDown className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${kpis.totalDepensesUsd.toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recettes CDF</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.totalRecettesCdf.toLocaleString('fr-FR')} FC
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses CDF</CardTitle>
            <TrendingDown className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.totalDepensesCdf.toLocaleString('fr-FR')} FC
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.mostActiveCashier}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Écarts totaux</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              ${kpis.totalGapUsd.toLocaleString('fr-FR')}
            </div>
            <div className="text-sm font-bold">
              {kpis.totalGapCdf.toLocaleString('fr-FR')} FC
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <TrendChart data={dailyData} currency={filters.currency} />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <CashierComparisonChart data={cashierData} currency={filters.currency} />
        <DistributionChart data={cashierData} currency={filters.currency} />
      </div>

      <GapAnalysisChart data={cashierData} />

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tableau récapitulatif</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caissier</TableHead>
                <TableHead className="text-right">Recettes USD</TableHead>
                <TableHead className="text-right">Dépenses USD</TableHead>
                <TableHead className="text-right">Recettes CDF</TableHead>
                <TableHead className="text-right">Dépenses CDF</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashierData.map((cashier) => (
                <TableRow key={cashier.cashierId}>
                  <TableCell className="font-medium">{cashier.cashierName}</TableCell>
                  <TableCell className="text-right">
                    ${cashier.recettesUsd.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    ${cashier.depensesUsd.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {cashier.recettesCdf.toLocaleString('fr-FR')} FC
                  </TableCell>
                  <TableCell className="text-right">
                    {cashier.depensesCdf.toLocaleString('fr-FR')} FC
                  </TableCell>
                  <TableCell className="text-right">{cashier.transactionCount}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  ${kpis.totalRecettesUsd.toLocaleString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  ${kpis.totalDepensesUsd.toLocaleString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  {kpis.totalRecettesCdf.toLocaleString('fr-FR')} FC
                </TableCell>
                <TableCell className="text-right">
                  {kpis.totalDepensesCdf.toLocaleString('fr-FR')} FC
                </TableCell>
                <TableCell className="text-right">{kpis.totalTransactions}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

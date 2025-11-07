import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Activity, AlertTriangle, Calendar, Save, Archive } from 'lucide-react';
import { useAnalyticsData, AnalyticsFilters } from '@/hooks/useAnalyticsData';
import { useYearlyTrendData } from '@/hooks/useYearlyTrendData';
import { TrendChart } from './charts/TrendChart';
import { CashierComparisonChart } from './charts/CashierComparisonChart';
import { DistributionChart } from './charts/DistributionChart';
import { GapAnalysisChart } from './charts/GapAnalysisChart';
import { YearlyTrendChart } from './charts/YearlyTrendChart';
import { ReportHistory } from './ReportHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const MonthlyReport = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [viewMode, setViewMode] = useState<'generate' | 'history'>('generate');
  const [loadingArchive, setLoadingArchive] = useState<string | null>(null);

  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(selectedYear, selectedMonth, 1),
    endDate: new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59),
    cashierIds: [],
    currency: 'BOTH',
  });

  const { loading, cashierData, dailyData, kpis, comparisonKPIs, previousPeriodLabel } = useAnalyticsData(filters);
  const { loading: loadingYearly, yearlyData } = useYearlyTrendData(selectedYear);

  useEffect(() => {
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    setFilters({ ...filters, startDate, endDate });
  }, [selectedMonth, selectedYear]);

  const handleArchiveReport = async () => {
    if (!user) return;

    try {
      setLoadingArchive('archive');
      
      // Check if report already exists
      const { data: existingReport } = await supabase
        .from('monthly_reports')
        .select('id')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear)
        .maybeSingle();

      const reportData = {
        report_month: selectedMonth,
        report_year: selectedYear,
        generated_by: user.id,
        kpis: JSON.parse(JSON.stringify(kpis)),
        comparison_data: JSON.parse(JSON.stringify(comparisonKPIs)),
        cashier_summary: JSON.parse(JSON.stringify(cashierData)),
      };

      if (existingReport) {
        // Update existing report
        const { error } = await supabase
          .from('monthly_reports')
          .update(reportData)
          .eq('id', existingReport.id);

        if (error) throw error;
        
        toast({
          title: "Rapport mis à jour",
          description: "Le rapport a été mis à jour dans l'archive",
        });
      } else {
        // Create new report
        const { error } = await supabase
          .from('monthly_reports')
          .insert([reportData]);

        if (error) throw error;
        
        toast({
          title: "Rapport archivé",
          description: "Le rapport a été enregistré dans l'archive",
        });
      }
    } catch (error) {
      console.error('Error archiving report:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le rapport",
        variant: "destructive",
      });
    } finally {
      setLoadingArchive(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoadingArchive('pdf');
      toast({ title: "Génération du rapport PDF...", description: "Veuillez patienter" });
      
      const element = document.getElementById('monthly-report-content');
      if (!element) return;

      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const fileName = `rapport-mensuel-${format(new Date(selectedYear, selectedMonth), 'MMMM-yyyy', { locale: fr })}.pdf`;
      pdf.save(fileName);
      
      // Auto-archive after successful PDF generation
      await handleArchiveReport();
      
      toast({ title: "Rapport PDF généré avec succès" });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Erreur", description: "Impossible de générer le PDF", variant: "destructive" });
    } finally {
      setLoadingArchive(null);
    }
  };

  const handleViewArchivedReport = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setViewMode('generate');
  };

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const netBalanceUSD = kpis.totalRecettesUsd - kpis.totalDepensesUsd;
  const netBalanceCDF = kpis.totalRecettesCdf - kpis.totalDepensesCdf;

  return (
    <div className="space-y-6">
      {/* Header with Mode Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Rapport Mensuel</CardTitle>
            </div>
            <div className="flex gap-2">
              {viewMode === 'generate' && (
                <>
                  <Button 
                    onClick={handleArchiveReport} 
                    variant="outline"
                    disabled={loading || loadingArchive === 'archive'}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loadingArchive === 'archive' ? 'Archivage...' : 'Archiver'}
                  </Button>
                  <Button 
                    onClick={handleExportPDF} 
                    variant="default"
                    disabled={loading || loadingArchive === 'pdf'}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {loadingArchive === 'pdf' ? 'Génération...' : 'PDF & Archiver'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'generate' | 'history')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="generate">
                <Calendar className="h-4 w-4 mr-2" />
                Générer un rapport
              </TabsTrigger>
              <TabsTrigger value="history">
                <Archive className="h-4 w-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Mois</label>
                  <Select 
                    value={selectedMonth.toString()} 
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Année</label>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ReportHistory onViewReport={handleViewArchivedReport} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {viewMode === 'generate' && (
        <>

      {/* Report Content */}
      <div id="monthly-report-content" className="space-y-6 bg-background p-6 rounded-lg">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-3xl font-bold">Rapport Mensuel de Comptabilité</h1>
          <p className="text-xl text-muted-foreground mt-2">
            {months[selectedMonth]} {selectedYear}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Généré le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé Exécutif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Performance USD</h3>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Recettes:</span>{' '}
                    <span className="text-green-600 font-bold">
                      ${kpis.totalRecettesUsd.toLocaleString('fr-FR')}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Dépenses:</span>{' '}
                    <span className="text-red-600 font-bold">
                      ${kpis.totalDepensesUsd.toLocaleString('fr-FR')}
                    </span>
                  </p>
                  <p className="text-sm border-t pt-1">
                    <span className="font-medium">Solde net:</span>{' '}
                    <span className={cn("font-bold", netBalanceUSD >= 0 ? "text-green-600" : "text-red-600")}>
                      ${netBalanceUSD.toLocaleString('fr-FR')}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Écarts:</span>{' '}
                    <span className="text-destructive font-bold">
                      ${kpis.totalGapUsd.toLocaleString('fr-FR')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Performance CDF</h3>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Recettes:</span>{' '}
                    <span className="text-green-600 font-bold">
                      {kpis.totalRecettesCdf.toLocaleString('fr-FR')} FC
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Dépenses:</span>{' '}
                    <span className="text-red-600 font-bold">
                      {kpis.totalDepensesCdf.toLocaleString('fr-FR')} FC
                    </span>
                  </p>
                  <p className="text-sm border-t pt-1">
                    <span className="font-medium">Solde net:</span>{' '}
                    <span className={cn("font-bold", netBalanceCDF >= 0 ? "text-green-600" : "text-red-600")}>
                      {netBalanceCDF.toLocaleString('fr-FR')} FC
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Écarts:</span>{' '}
                    <span className="text-destructive font-bold">
                      {kpis.totalGapCdf.toLocaleString('fr-FR')} FC
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-lg mb-2">Indicateurs Clés</h3>
              <div className="grid gap-2 md:grid-cols-3">
                <p className="text-sm">
                  <span className="font-medium">Transactions totales:</span>{' '}
                  <span className="font-bold">{kpis.totalTransactions}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Caissier le plus actif:</span>{' '}
                  <span className="font-bold">{kpis.mostActiveCashier}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Moyenne par transaction:</span>{' '}
                  <span className="font-bold">${kpis.avgTransactionUsd.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs with Evolution */}
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
              <div className={cn("text-xs flex items-center gap-1 mt-1", 
                comparisonKPIs.recettesUsdEvolution >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {comparisonKPIs.recettesUsdEvolution >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(comparisonKPIs.recettesUsdEvolution).toFixed(1)}% {previousPeriodLabel}
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
              <div className={cn("text-xs flex items-center gap-1 mt-1", 
                comparisonKPIs.depensesUsdEvolution <= 0 ? "text-green-600" : "text-red-600"
              )}>
                {comparisonKPIs.depensesUsdEvolution >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(comparisonKPIs.depensesUsdEvolution).toFixed(1)}% {previousPeriodLabel}
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
              <div className={cn("text-xs flex items-center gap-1 mt-1", 
                comparisonKPIs.recettesCdfEvolution >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {comparisonKPIs.recettesCdfEvolution >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(comparisonKPIs.recettesCdfEvolution).toFixed(1)}% {previousPeriodLabel}
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
              <div className={cn("text-xs flex items-center gap-1 mt-1", 
                comparisonKPIs.depensesCdfEvolution <= 0 ? "text-green-600" : "text-red-600"
              )}>
                {comparisonKPIs.depensesCdfEvolution >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(comparisonKPIs.depensesCdfEvolution).toFixed(1)}% {previousPeriodLabel}
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
              <div className={cn("text-xs flex items-center gap-1 mt-1", 
                comparisonKPIs.transactionsEvolution >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {comparisonKPIs.transactionsEvolution >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(comparisonKPIs.transactionsEvolution).toFixed(1)}% {previousPeriodLabel}
              </div>
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

        {/* Yearly Trend Chart */}
        {!loadingYearly && yearlyData.length > 0 && (
          <YearlyTrendChart data={yearlyData} year={selectedYear} currency="BOTH" />
        )}

        {/* Monthly Charts */}
        <TrendChart data={dailyData} currency="BOTH" />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <CashierComparisonChart data={cashierData} currency="BOTH" />
          <DistributionChart data={cashierData} currency="BOTH" />
        </div>

        <GapAnalysisChart data={cashierData} />

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tableau détaillé par caissier</CardTitle>
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
                  <TableHead className="text-right">Gap USD</TableHead>
                  <TableHead className="text-right">Gap CDF</TableHead>
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
                    <TableCell className="text-right text-destructive">
                      ${cashier.gapUsd.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {cashier.gapCdf.toLocaleString('fr-FR')} FC
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
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
                  <TableCell className="text-right text-destructive">
                    ${kpis.totalGapUsd.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {kpis.totalGapCdf.toLocaleString('fr-FR')} FC
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          <p>Ce rapport a été généré automatiquement le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
          <p className="mt-1">Document confidentiel - À usage interne uniquement</p>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
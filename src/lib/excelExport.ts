import * as XLSX from 'xlsx';
import { CashierData, DailyData, KPIs, ComparisonKPIs, AnalyticsFilters } from '@/hooks/useAnalyticsData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const exportToExcel = (
  cashierData: CashierData[],
  dailyData: DailyData[],
  kpis: KPIs,
  comparisonKPIs: ComparisonKPIs,
  filters: AnalyticsFilters,
  previousPeriodLabel: string
) => {
  const workbook = XLSX.utils.book_new();

  // Format period
  const periodStr = `${format(filters.startDate, 'dd/MM/yyyy', { locale: fr })} - ${format(filters.endDate, 'dd/MM/yyyy', { locale: fr })}`;

  // Sheet 1: Vue d'ensemble
  const summaryData = [
    ['TABLEAU DE BORD COMPTABILITÉ'],
    [''],
    ['Période:', periodStr],
    ['Devise:', filters.currency === 'BOTH' ? 'USD et CDF' : filters.currency],
    [''],
    ['KPI', 'Valeur USD', 'Valeur CDF', 'Évolution %'],
    [
      'Recettes',
      kpis.totalRecettesUsd,
      kpis.totalRecettesCdf,
      `${comparisonKPIs.recettesUsdEvolution.toFixed(1)}%`
    ],
    [
      'Dépenses',
      kpis.totalDepensesUsd,
      kpis.totalDepensesCdf,
      `${comparisonKPIs.depensesUsdEvolution.toFixed(1)}%`
    ],
    [
      'Écarts de clôture',
      kpis.totalGapUsd,
      kpis.totalGapCdf,
      `${comparisonKPIs.gapUsdEvolution.toFixed(1)}%`
    ],
    [''],
    ['Transactions totales', kpis.totalTransactions, '', `${comparisonKPIs.transactionsEvolution.toFixed(1)}%`],
    ['Caissier le plus actif', kpis.mostActiveCashier, '', ''],
    ['Montant moyen par transaction USD', kpis.avgTransactionUsd.toFixed(2), '', ''],
    ['Montant moyen par transaction CDF', '', kpis.avgTransactionCdf.toFixed(2), ''],
    [''],
    ['Comparaison:', previousPeriodLabel],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summarySheet['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Vue d'ensemble");

  // Sheet 2: Par caissier
  const cashierSheetData = [
    ['DONNÉES PAR CAISSIER'],
    ['Période:', periodStr],
    [''],
    [
      'Caissier',
      'Recettes USD',
      'Dépenses USD',
      'Recettes CDF',
      'Dépenses CDF',
      'Transactions',
      'Gap USD',
      'Gap CDF'
    ],
    ...cashierData.map(c => [
      c.cashierName,
      c.recettesUsd,
      c.depensesUsd,
      c.recettesCdf,
      c.depensesCdf,
      c.transactionCount,
      c.gapUsd,
      c.gapCdf
    ]),
    [
      'TOTAL',
      kpis.totalRecettesUsd,
      kpis.totalDepensesUsd,
      kpis.totalRecettesCdf,
      kpis.totalDepensesCdf,
      kpis.totalTransactions,
      kpis.totalGapUsd,
      kpis.totalGapCdf
    ]
  ];

  const cashierSheet = XLSX.utils.aoa_to_sheet(cashierSheetData);
  cashierSheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(workbook, cashierSheet, 'Par caissier');

  // Sheet 3: Évolution quotidienne
  const dailySheetData = [
    ['ÉVOLUTION QUOTIDIENNE'],
    ['Période:', periodStr],
    [''],
    ['Date', 'Recettes USD', 'Dépenses USD', 'Recettes CDF', 'Dépenses CDF', 'Solde USD', 'Solde CDF'],
    ...dailyData.map(d => [
      format(new Date(d.date), 'dd/MM/yyyy', { locale: fr }),
      d.recettesUsd,
      d.depensesUsd,
      d.recettesCdf,
      d.depensesCdf,
      d.recettesUsd - d.depensesUsd,
      d.recettesCdf - d.depensesCdf
    ])
  ];

  const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
  dailySheet['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Évolution quotidienne');

  // Sheet 4: Analyse des écarts
  const gapData = cashierData.filter(c => c.gapUsd !== 0 || c.gapCdf !== 0);
  const gapSheetData = [
    ['ANALYSE DES ÉCARTS DE CLÔTURE'],
    ['Période:', periodStr],
    [''],
    ['Caissier', 'Gap USD', 'Gap CDF', 'Total Transactions', '% Gap USD', '% Gap CDF'],
    ...gapData.map(c => [
      c.cashierName,
      c.gapUsd,
      c.gapCdf,
      c.transactionCount,
      c.recettesUsd > 0 ? ((c.gapUsd / c.recettesUsd) * 100).toFixed(2) + '%' : 'N/A',
      c.recettesCdf > 0 ? ((c.gapCdf / c.recettesCdf) * 100).toFixed(2) + '%' : 'N/A'
    ]),
    [
      'TOTAL',
      kpis.totalGapUsd,
      kpis.totalGapCdf,
      kpis.totalTransactions,
      kpis.totalRecettesUsd > 0 ? ((kpis.totalGapUsd / kpis.totalRecettesUsd) * 100).toFixed(2) + '%' : 'N/A',
      kpis.totalRecettesCdf > 0 ? ((kpis.totalGapCdf / kpis.totalRecettesCdf) * 100).toFixed(2) + '%' : 'N/A'
    ]
  ];

  const gapSheet = XLSX.utils.aoa_to_sheet(gapSheetData);
  gapSheet['!cols'] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(workbook, gapSheet, 'Écarts de clôture');

  // Download file
  const fileName = `rapport-comptabilite-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
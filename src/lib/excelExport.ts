import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CashierData, DailyData, KPIs, ComparisonKPIs, AnalyticsFilters } from '@/hooks/useAnalyticsData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ClosureTransfer {
  id: string;
  cashier_id: string;
  cashier_role: string;
  closing_date: string;
  opening_balance_usd: number;
  opening_balance_cdf: number;
  closing_balance_usd: number;
  closing_balance_cdf: number;
  transferred_usd: number;
  transferred_cdf: number;
  expected_balance_usd: number;
  expected_balance_cdf: number;
  gap_usd: number;
  gap_cdf: number;
  notes: string | null;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export const exportClosuresToExcel = (closures: ClosureTransfer[]) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Liste des clôtures
  const closuresData = [
    ['RAPPORTS DE CLÔTURE'],
    [''],
    ['Date générée:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })],
    [''],
    [
      'Date',
      'Caissier',
      'Rôle',
      'Ouv. USD',
      'Ouv. CDF',
      'Clôt. USD',
      'Clôt. CDF',
      'Transf. USD',
      'Transf. CDF',
      'Écart USD',
      'Écart CDF',
      'Notes',
    ],
    ...closures.map((c) => [
      format(new Date(c.closing_date), 'dd/MM/yyyy', { locale: fr }),
      c.profiles?.full_name || c.profiles?.email || 'N/A',
      c.cashier_role,
      Number(c.opening_balance_usd),
      Number(c.opening_balance_cdf),
      Number(c.closing_balance_usd),
      Number(c.closing_balance_cdf),
      Number(c.transferred_usd),
      Number(c.transferred_cdf),
      Number(c.gap_usd),
      Number(c.gap_cdf),
      c.notes || '',
    ]),
    [],
    ['TOTAUX'],
    [
      '',
      '',
      '',
      closures.reduce((sum, c) => sum + Number(c.opening_balance_usd), 0),
      closures.reduce((sum, c) => sum + Number(c.opening_balance_cdf), 0),
      closures.reduce((sum, c) => sum + Number(c.closing_balance_usd), 0),
      closures.reduce((sum, c) => sum + Number(c.closing_balance_cdf), 0),
      closures.reduce((sum, c) => sum + Number(c.transferred_usd), 0),
      closures.reduce((sum, c) => sum + Number(c.transferred_cdf), 0),
      closures.reduce((sum, c) => sum + Number(c.gap_usd), 0),
      closures.reduce((sum, c) => sum + Number(c.gap_cdf), 0),
      '',
    ],
  ];

  const closuresSheet = XLSX.utils.aoa_to_sheet(closuresData);
  closuresSheet['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(workbook, closuresSheet, 'Clôtures');

  // Sheet 2: Statistiques par caissier
  const cashierStats = closures.reduce((acc, c) => {
    const key = c.cashier_role;
    if (!acc[key]) {
      acc[key] = {
        name: c.profiles?.full_name || c.profiles?.email || 'N/A',
        role: c.cashier_role,
        count: 0,
        totalTransferredUsd: 0,
        totalTransferredCdf: 0,
        totalGapUsd: 0,
        totalGapCdf: 0,
      };
    }
    acc[key].count++;
    acc[key].totalTransferredUsd += Number(c.transferred_usd);
    acc[key].totalTransferredCdf += Number(c.transferred_cdf);
    acc[key].totalGapUsd += Number(c.gap_usd);
    acc[key].totalGapCdf += Number(c.gap_cdf);
    return acc;
  }, {} as Record<string, any>);

  const statsData = [
    ['STATISTIQUES PAR CAISSIER'],
    [''],
    ['Caissier', 'Rôle', 'Nb Clôtures', 'Total Transf. USD', 'Total Transf. CDF', 'Total Écart USD', 'Total Écart CDF'],
    ...Object.values(cashierStats).map((s: any) => [
      s.name,
      s.role,
      s.count,
      s.totalTransferredUsd.toFixed(2),
      s.totalTransferredCdf.toFixed(2),
      s.totalGapUsd.toFixed(2),
      s.totalGapCdf.toFixed(2),
    ]),
  ];

  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet['!cols'] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');

  // Download
  const fileName = `clotures-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportClosuresToPDF = (closures: ClosureTransfer[]) => {
  const doc = new jsPDF('landscape');

  // Title
  doc.setFontSize(18);
  doc.text('RAPPORTS DE CLÔTURE', 14, 15);

  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 22);

  // Table
  const tableData = closures.map((c) => [
    format(new Date(c.closing_date), 'dd/MM/yyyy', { locale: fr }),
    c.profiles?.full_name || c.profiles?.email || 'N/A',
    c.cashier_role,
    `$${Number(c.transferred_usd).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
    `${Number(c.transferred_cdf).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`,
    Number(c.gap_usd) !== 0 || Number(c.gap_cdf) !== 0 ? 'Oui' : 'Non',
    `$${Number(c.gap_usd).toFixed(2)}`,
    `${Number(c.gap_cdf).toFixed(2)} FC`,
  ]);

  doc.autoTable({
    startY: 28,
    head: [
      [
        'Date',
        'Caissier',
        'Rôle',
        'Transf. USD',
        'Transf. CDF',
        'Écart',
        'Écart USD',
        'Écart CDF',
      ],
    ],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Summary
  const totalUsd = closures.reduce((sum, c) => sum + Number(c.transferred_usd), 0);
  const totalCdf = closures.reduce((sum, c) => sum + Number(c.transferred_cdf), 0);
  const totalGapUsd = closures.reduce((sum, c) => sum + Number(c.gap_usd), 0);
  const totalGapCdf = closures.reduce((sum, c) => sum + Number(c.gap_cdf), 0);

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text('RÉSUMÉ', 14, finalY);

  doc.setFontSize(10);
  doc.text(`Nombre de clôtures: ${closures.length}`, 14, finalY + 7);
  doc.text(
    `Total transféré USD: $${totalUsd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
    14,
    finalY + 14
  );
  doc.text(
    `Total transféré CDF: ${totalCdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`,
    14,
    finalY + 21
  );
  doc.text(`Total écarts USD: $${totalGapUsd.toFixed(2)}`, 14, finalY + 28);
  doc.text(`Total écarts CDF: ${totalGapCdf.toFixed(2)} FC`, 14, finalY + 35);

  // Download
  const fileName = `clotures-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`;
  doc.save(fileName);
};

interface ReportForComparison {
  month: number;
  year: number;
  kpis: any;
  cashier_summary: any;
}

export const exportComparisonToExcel = (reports: ReportForComparison[]) => {
  const workbook = XLSX.utils.book_new();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Sheet 1: Comparison Summary
  const summaryHeaders = ['Indicateur', ...reports.map(r => `${monthNames[r.month]} ${r.year}`)];
  const summaryData = [
    ['COMPARAISON MULTI-PÉRIODES'],
    [''],
    summaryHeaders,
    [
      'Recettes USD',
      ...reports.map(r => r.kpis.totalRecettesUsd || 0)
    ],
    [
      'Dépenses USD',
      ...reports.map(r => r.kpis.totalDepensesUsd || 0)
    ],
    [
      'Solde USD',
      ...reports.map(r => (r.kpis.totalRecettesUsd || 0) - (r.kpis.totalDepensesUsd || 0))
    ],
    [
      'Recettes CDF',
      ...reports.map(r => r.kpis.totalRecettesCdf || 0)
    ],
    [
      'Dépenses CDF',
      ...reports.map(r => r.kpis.totalDepensesCdf || 0)
    ],
    [
      'Solde CDF',
      ...reports.map(r => (r.kpis.totalRecettesCdf || 0) - (r.kpis.totalDepensesCdf || 0))
    ],
    [
      'Écarts USD',
      ...reports.map(r => r.kpis.totalGapUsd || 0)
    ],
    [
      'Écarts CDF',
      ...reports.map(r => r.kpis.totalGapCdf || 0)
    ],
    [''],
    [
      'Transactions totales',
      ...reports.map(r => r.kpis.totalTransactions || 0)
    ],
    [
      'Moyenne transaction USD',
      ...reports.map(r => (r.kpis.avgTransactionUsd || 0).toFixed(2))
    ],
    [
      'Moyenne transaction CDF',
      ...reports.map(r => (r.kpis.avgTransactionCdf || 0).toFixed(2))
    ],
    [
      'Caissier le plus actif',
      ...reports.map(r => r.kpis.mostActiveCashier || 'N/A')
    ],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 25 },
    ...reports.map(() => ({ wch: 15 }))
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Comparaison');

  // Sheet 2: Evolution Indicators
  const evolutionData = [
    ['INDICATEURS D\'ÉVOLUTION'],
    [''],
    ['Indicateur', ...reports.slice(1).map((r, i) => `${monthNames[reports[i].month]} → ${monthNames[r.month]}`)],
  ];

  for (let i = 1; i < reports.length; i++) {
    const prev = reports[i - 1];
    const curr = reports[i];

    const calcEvolution = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    if (i === 1) {
      evolutionData.push(
        ['Évolution Recettes USD (%)', calcEvolution(curr.kpis.totalRecettesUsd, prev.kpis.totalRecettesUsd).toFixed(1) + '%'],
        ['Évolution Dépenses USD (%)', calcEvolution(curr.kpis.totalDepensesUsd, prev.kpis.totalDepensesUsd).toFixed(1) + '%'],
        ['Évolution Recettes CDF (%)', calcEvolution(curr.kpis.totalRecettesCdf, prev.kpis.totalRecettesCdf).toFixed(1) + '%'],
        ['Évolution Dépenses CDF (%)', calcEvolution(curr.kpis.totalDepensesCdf, prev.kpis.totalDepensesCdf).toFixed(1) + '%'],
        ['Évolution Transactions (%)', calcEvolution(curr.kpis.totalTransactions, prev.kpis.totalTransactions).toFixed(1) + '%'],
        ['Évolution Écarts USD (%)', calcEvolution(curr.kpis.totalGapUsd, prev.kpis.totalGapUsd).toFixed(1) + '%'],
      );
    } else {
      evolutionData[3].push(calcEvolution(curr.kpis.totalRecettesUsd, prev.kpis.totalRecettesUsd).toFixed(1) + '%');
      evolutionData[4].push(calcEvolution(curr.kpis.totalDepensesUsd, prev.kpis.totalDepensesUsd).toFixed(1) + '%');
      evolutionData[5].push(calcEvolution(curr.kpis.totalRecettesCdf, prev.kpis.totalRecettesCdf).toFixed(1) + '%');
      evolutionData[6].push(calcEvolution(curr.kpis.totalDepensesCdf, prev.kpis.totalDepensesCdf).toFixed(1) + '%');
      evolutionData[7].push(calcEvolution(curr.kpis.totalTransactions, prev.kpis.totalTransactions).toFixed(1) + '%');
      evolutionData[8].push(calcEvolution(curr.kpis.totalGapUsd, prev.kpis.totalGapUsd).toFixed(1) + '%');
    }
  }

  const evolutionSheet = XLSX.utils.aoa_to_sheet(evolutionData);
  evolutionSheet['!cols'] = [
    { wch: 25 },
    ...reports.slice(1).map(() => ({ wch: 15 }))
  ];

  XLSX.utils.book_append_sheet(workbook, evolutionSheet, 'Évolutions');

  // Sheet 3: Cashier Performance Comparison
  const allCashiers = new Set<string>();
  reports.forEach(r => {
    if (Array.isArray(r.cashier_summary)) {
      r.cashier_summary.forEach((c: any) => allCashiers.add(c.cashierName));
    }
  });

  const cashierHeaders = ['Caissier', ...reports.map(r => `${monthNames[r.month]} ${r.year}`)];
  const cashierData = [
    ['PERFORMANCE PAR CAISSIER'],
    [''],
    ['Recettes USD par caissier'],
    cashierHeaders,
  ];

  allCashiers.forEach(cashierName => {
    const row = [cashierName];
    reports.forEach(r => {
      const cashier = Array.isArray(r.cashier_summary) 
        ? r.cashier_summary.find((c: any) => c.cashierName === cashierName)
        : null;
      row.push(cashier?.recettesUsd || 0);
    });
    cashierData.push(row);
  });

  cashierData.push([''], ['Dépenses USD par caissier'], cashierHeaders);

  allCashiers.forEach(cashierName => {
    const row = [cashierName];
    reports.forEach(r => {
      const cashier = Array.isArray(r.cashier_summary)
        ? r.cashier_summary.find((c: any) => c.cashierName === cashierName)
        : null;
      row.push(cashier?.depensesUsd || 0);
    });
    cashierData.push(row);
  });

  cashierData.push([''], ['Transactions par caissier'], cashierHeaders);

  allCashiers.forEach(cashierName => {
    const row = [cashierName];
    reports.forEach(r => {
      const cashier = Array.isArray(r.cashier_summary)
        ? r.cashier_summary.find((c: any) => c.cashierName === cashierName)
        : null;
      row.push(cashier?.transactionCount || 0);
    });
    cashierData.push(row);
  });

  const cashierSheet = XLSX.utils.aoa_to_sheet(cashierData);
  cashierSheet['!cols'] = [
    { wch: 25 },
    ...reports.map(() => ({ wch: 15 }))
  ];

  XLSX.utils.book_append_sheet(workbook, cashierSheet, 'Par caissier');

  // Download file
  const fileName = `comparaison-rapports-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

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
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  cashierIds: string[];
  currency: 'USD' | 'CDF' | 'BOTH';
}

export interface CashierData {
  cashierId: string;
  cashierName: string;
  recettesUsd: number;
  depensesUsd: number;
  recettesCdf: number;
  depensesCdf: number;
  transactionCount: number;
  gapUsd: number;
  gapCdf: number;
}

export interface DailyData {
  date: string;
  recettesUsd: number;
  depensesUsd: number;
  recettesCdf: number;
  depensesCdf: number;
}

export interface KPIs {
  totalRecettesUsd: number;
  totalDepensesUsd: number;
  totalRecettesCdf: number;
  totalDepensesCdf: number;
  totalTransactions: number;
  mostActiveCashier: string;
  avgTransactionUsd: number;
  avgTransactionCdf: number;
  totalGapUsd: number;
  totalGapCdf: number;
}

export interface ComparisonKPIs {
  recettesUsdEvolution: number;
  depensesUsdEvolution: number;
  recettesCdfEvolution: number;
  depensesCdfEvolution: number;
  transactionsEvolution: number;
  gapUsdEvolution: number;
  gapCdfEvolution: number;
}

export const useAnalyticsData = (filters: AnalyticsFilters) => {
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [cashierData, setCashierData] = useState<CashierData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [kpis, setKpis] = useState<KPIs>({
    totalRecettesUsd: 0,
    totalDepensesUsd: 0,
    totalRecettesCdf: 0,
    totalDepensesCdf: 0,
    totalTransactions: 0,
    mostActiveCashier: '',
    avgTransactionUsd: 0,
    avgTransactionCdf: 0,
    totalGapUsd: 0,
    totalGapCdf: 0,
  });
  const [comparisonKPIs, setComparisonKPIs] = useState<ComparisonKPIs>({
    recettesUsdEvolution: 0,
    depensesUsdEvolution: 0,
    recettesCdfEvolution: 0,
    depensesCdfEvolution: 0,
    transactionsEvolution: 0,
    gapUsdEvolution: 0,
    gapCdfEvolution: 0,
  });
  const [previousPeriodLabel, setPreviousPeriodLabel] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    fetchAnalyticsData();
  }, [user, filters]);

  const calculatePreviousPeriod = (start: Date, end: Date) => {
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { prevStart, prevEnd };
  };

  const calculateEvolution = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Determine which cashiers to include
      let cashierIdsToFetch = filters.cashierIds;
      
      // If user is a cashier (not admin/resp_compta), only show their own data
      if (!isAdmin && !hasRole('resp_compta')) {
        cashierIdsToFetch = [user!.id];
      }

      // Fetch transactions
      let transactionsQuery = supabase
        .from('ledger')
        .select('*, profiles:account_owner(id, full_name, username)')
        .eq('status', 'VALIDE')
        .gte('created_at', filters.startDate.toISOString())
        .lte('created_at', filters.endDate.toISOString());

      if (cashierIdsToFetch.length > 0) {
        transactionsQuery = transactionsQuery.in('account_owner', cashierIdsToFetch);
      }

      const { data: transactions, error: txError } = await transactionsQuery;

      if (txError) throw txError;

      // Fetch closure gaps
      let closuresQuery = supabase
        .from('closing_transfers')
        .select('*, profiles:cashier_id(id, full_name, username)')
        .gte('closing_date', filters.startDate.toISOString().split('T')[0])
        .lte('closing_date', filters.endDate.toISOString().split('T')[0]);

      if (cashierIdsToFetch.length > 0) {
        closuresQuery = closuresQuery.in('cashier_id', cashierIdsToFetch);
      }

      const { data: closures, error: closureError } = await closuresQuery;

      if (closureError) throw closureError;

      // Aggregate data by cashier
      const cashierMap = new Map<string, CashierData>();
      
      transactions?.forEach((tx: any) => {
        const cashierId = tx.account_owner;
        const cashierName = tx.profiles?.full_name || tx.profiles?.username || 'Inconnu';
        
        if (!cashierMap.has(cashierId)) {
          cashierMap.set(cashierId, {
            cashierId,
            cashierName,
            recettesUsd: 0,
            depensesUsd: 0,
            recettesCdf: 0,
            depensesCdf: 0,
            transactionCount: 0,
            gapUsd: 0,
            gapCdf: 0,
          });
        }

        const data = cashierMap.get(cashierId)!;
        data.transactionCount++;

        if (tx.entry_kind === 'RECETTE') {
          if (tx.currency === 'USD') {
            data.recettesUsd += tx.amount;
          } else {
            data.recettesCdf += tx.amount;
          }
        } else if (tx.entry_kind === 'DEPENSE') {
          if (tx.currency === 'USD') {
            data.depensesUsd += tx.amount;
          } else {
            data.depensesCdf += tx.amount;
          }
        }
      });

      // Add closure gaps
      closures?.forEach((closure: any) => {
        const cashierId = closure.cashier_id;
        if (cashierMap.has(cashierId)) {
          const data = cashierMap.get(cashierId)!;
          data.gapUsd += closure.gap_usd || 0;
          data.gapCdf += closure.gap_cdf || 0;
        }
      });

      const cashierDataArray = Array.from(cashierMap.values());
      setCashierData(cashierDataArray);

      // Aggregate data by date
      const dailyMap = new Map<string, DailyData>();
      
      transactions?.forEach((tx: any) => {
        const date = new Date(tx.created_at).toISOString().split('T')[0];
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            recettesUsd: 0,
            depensesUsd: 0,
            recettesCdf: 0,
            depensesCdf: 0,
          });
        }

        const data = dailyMap.get(date)!;

        if (tx.entry_kind === 'RECETTE') {
          if (tx.currency === 'USD') {
            data.recettesUsd += tx.amount;
          } else {
            data.recettesCdf += tx.amount;
          }
        } else if (tx.entry_kind === 'DEPENSE') {
          if (tx.currency === 'USD') {
            data.depensesUsd += tx.amount;
          } else {
            data.depensesCdf += tx.amount;
          }
        }
      });

      const dailyDataArray = Array.from(dailyMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
      setDailyData(dailyDataArray);

      // Calculate KPIs
      const totalRecettesUsd = cashierDataArray.reduce((sum, c) => sum + c.recettesUsd, 0);
      const totalDepensesUsd = cashierDataArray.reduce((sum, c) => sum + c.depensesUsd, 0);
      const totalRecettesCdf = cashierDataArray.reduce((sum, c) => sum + c.recettesCdf, 0);
      const totalDepensesCdf = cashierDataArray.reduce((sum, c) => sum + c.depensesCdf, 0);
      const totalTransactions = cashierDataArray.reduce((sum, c) => sum + c.transactionCount, 0);
      const totalGapUsd = cashierDataArray.reduce((sum, c) => sum + c.gapUsd, 0);
      const totalGapCdf = cashierDataArray.reduce((sum, c) => sum + c.gapCdf, 0);
      
      const mostActive = cashierDataArray.reduce((max, c) => 
        c.transactionCount > max.transactionCount ? c : max
      , cashierDataArray[0] || { transactionCount: 0, cashierName: 'N/A' });

      setKpis({
        totalRecettesUsd,
        totalDepensesUsd,
        totalRecettesCdf,
        totalDepensesCdf,
        totalTransactions,
        mostActiveCashier: mostActive?.cashierName || 'N/A',
        avgTransactionUsd: totalTransactions > 0 ? totalRecettesUsd / totalTransactions : 0,
        avgTransactionCdf: totalTransactions > 0 ? totalRecettesCdf / totalTransactions : 0,
        totalGapUsd,
        totalGapCdf,
      });

      // Fetch comparison data
      const { prevStart, prevEnd } = calculatePreviousPeriod(filters.startDate, filters.endDate);
      setPreviousPeriodLabel(
        `vs ${prevStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${prevEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`
      );

      // Fetch previous period transactions
      let prevTransactionsQuery = supabase
        .from('ledger')
        .select('*')
        .eq('status', 'VALIDE')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (cashierIdsToFetch.length > 0) {
        prevTransactionsQuery = prevTransactionsQuery.in('account_owner', cashierIdsToFetch);
      }

      const { data: prevTransactions } = await prevTransactionsQuery;

      // Fetch previous period closures
      let prevClosuresQuery = supabase
        .from('closing_transfers')
        .select('*')
        .gte('closing_date', prevStart.toISOString().split('T')[0])
        .lte('closing_date', prevEnd.toISOString().split('T')[0]);

      if (cashierIdsToFetch.length > 0) {
        prevClosuresQuery = prevClosuresQuery.in('cashier_id', cashierIdsToFetch);
      }

      const { data: prevClosures } = await prevClosuresQuery;

      // Calculate previous period KPIs
      let prevRecettesUsd = 0, prevDepensesUsd = 0, prevRecettesCdf = 0, prevDepensesCdf = 0;
      let prevTransactionCount = 0, prevGapUsd = 0, prevGapCdf = 0;

      prevTransactions?.forEach((tx: any) => {
        prevTransactionCount++;
        if (tx.entry_kind === 'RECETTE') {
          if (tx.currency === 'USD') prevRecettesUsd += tx.amount;
          else prevRecettesCdf += tx.amount;
        } else if (tx.entry_kind === 'DEPENSE') {
          if (tx.currency === 'USD') prevDepensesUsd += tx.amount;
          else prevDepensesCdf += tx.amount;
        }
      });

      prevClosures?.forEach((closure: any) => {
        prevGapUsd += closure.gap_usd || 0;
        prevGapCdf += closure.gap_cdf || 0;
      });

      setComparisonKPIs({
        recettesUsdEvolution: calculateEvolution(totalRecettesUsd, prevRecettesUsd),
        depensesUsdEvolution: calculateEvolution(totalDepensesUsd, prevDepensesUsd),
        recettesCdfEvolution: calculateEvolution(totalRecettesCdf, prevRecettesCdf),
        depensesCdfEvolution: calculateEvolution(totalDepensesCdf, prevDepensesCdf),
        transactionsEvolution: calculateEvolution(totalTransactions, prevTransactionCount),
        gapUsdEvolution: calculateEvolution(totalGapUsd, prevGapUsd),
        gapCdfEvolution: calculateEvolution(totalGapCdf, prevGapCdf),
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, cashierData, dailyData, kpis, comparisonKPIs, previousPeriodLabel };
};

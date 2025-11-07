import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface MonthlyTrendData {
  month: string;
  recettesUsd: number;
  depensesUsd: number;
  recettesCdf: number;
  depensesCdf: number;
  gapUsd: number;
  gapCdf: number;
  transactionCount: number;
}

export const useYearlyTrendData = (year: number) => {
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [yearlyData, setYearlyData] = useState<MonthlyTrendData[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchYearlyData();
  }, [user, year]);

  const fetchYearlyData = async () => {
    setLoading(true);
    try {
      // Determine which cashiers to include
      let cashierIdsToFetch: string[] = [];
      
      if (!isAdmin && !hasRole('resp_compta')) {
        cashierIdsToFetch = [user!.id];
      }

      const monthlyData: MonthlyTrendData[] = [];

      // Fetch data for each month of the year
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        // Fetch transactions for this month
        let transactionsQuery = supabase
          .from('ledger')
          .select('amount, currency, entry_kind')
          .eq('status', 'VALIDE')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (cashierIdsToFetch.length > 0) {
          transactionsQuery = transactionsQuery.in('account_owner', cashierIdsToFetch);
        }

        const { data: transactions } = await transactionsQuery;

        // Fetch closure gaps for this month
        let closuresQuery = supabase
          .from('closing_transfers')
          .select('gap_usd, gap_cdf')
          .gte('closing_date', startDate.toISOString().split('T')[0])
          .lte('closing_date', endDate.toISOString().split('T')[0]);

        if (cashierIdsToFetch.length > 0) {
          closuresQuery = closuresQuery.in('cashier_id', cashierIdsToFetch);
        }

        const { data: closures } = await closuresQuery;

        // Aggregate data
        let recettesUsd = 0, depensesUsd = 0, recettesCdf = 0, depensesCdf = 0;
        let gapUsd = 0, gapCdf = 0;
        let transactionCount = 0;

        transactions?.forEach((tx: any) => {
          transactionCount++;
          if (tx.entry_kind === 'RECETTE') {
            if (tx.currency === 'USD') recettesUsd += tx.amount;
            else recettesCdf += tx.amount;
          } else if (tx.entry_kind === 'DEPENSE') {
            if (tx.currency === 'USD') depensesUsd += tx.amount;
            else depensesCdf += tx.amount;
          }
        });

        closures?.forEach((closure: any) => {
          gapUsd += closure.gap_usd || 0;
          gapCdf += closure.gap_cdf || 0;
        });

        const monthNames = [
          'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
          'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
        ];

        monthlyData.push({
          month: monthNames[month],
          recettesUsd,
          depensesUsd,
          recettesCdf,
          depensesCdf,
          gapUsd,
          gapCdf,
          transactionCount,
        });
      }

      setYearlyData(monthlyData);
    } catch (error) {
      console.error('Error fetching yearly trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, yearlyData };
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { KPIs, ComparisonKPIs } from '@/hooks/useAnalyticsData';

interface PeriodComparisonChartProps {
  currentData: {
    kpis: KPIs;
    label: string;
  };
  comparisonKPIs: ComparisonKPIs;
  previousPeriodLabel: string;
  currency: 'USD' | 'CDF' | 'BOTH';
}

export const PeriodComparisonChart = ({ 
  currentData, 
  comparisonKPIs, 
  previousPeriodLabel,
  currency 
}: PeriodComparisonChartProps) => {
  
  const calculatePreviousValue = (current: number, evolution: number): number => {
    if (evolution === 0) return current;
    if (evolution === 100) return 0;
    return current / (1 + evolution / 100);
  };

  const formatCurrency = (value: number, curr: string) => {
    return curr === 'USD' 
      ? `$${value.toLocaleString('fr-FR')}` 
      : `${value.toLocaleString('fr-FR')} FC`;
  };

  const dataUSD = [
    {
      name: 'Recettes',
      'Période actuelle': currentData.kpis.totalRecettesUsd,
      'Période précédente': calculatePreviousValue(
        currentData.kpis.totalRecettesUsd, 
        comparisonKPIs.recettesUsdEvolution
      ),
    },
    {
      name: 'Dépenses',
      'Période actuelle': currentData.kpis.totalDepensesUsd,
      'Période précédente': calculatePreviousValue(
        currentData.kpis.totalDepensesUsd, 
        comparisonKPIs.depensesUsdEvolution
      ),
    },
    {
      name: 'Écarts',
      'Période actuelle': currentData.kpis.totalGapUsd,
      'Période précédente': calculatePreviousValue(
        currentData.kpis.totalGapUsd, 
        comparisonKPIs.gapUsdEvolution
      ),
    },
  ];

  const dataCDF = [
    {
      name: 'Recettes',
      'Période actuelle': currentData.kpis.totalRecettesCdf,
      'Période précédente': calculatePreviousValue(
        currentData.kpis.totalRecettesCdf, 
        comparisonKPIs.recettesCdfEvolution
      ),
    },
    {
      name: 'Dépenses',
      'Période actuelle': currentData.kpis.totalDepensesCdf,
      'Période précédente': calculatePreviousValue(
        currentData.kpis.totalDepensesCdf, 
        comparisonKPIs.depensesCdfEvolution
      ),
    },
    {
      name: 'Écarts',
      'Période actuelle': currentData.kpis.totalGapCdf,
      'Période précédente': calculatePreviousValue(
        currentData.kpis.totalGapCdf, 
        comparisonKPIs.gapCdfEvolution
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison entre périodes</CardTitle>
        <p className="text-sm text-muted-foreground">{previousPeriodLabel}</p>
      </CardHeader>
      <CardContent>
        {(currency === 'USD' || currency === 'BOTH') && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">USD</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataUSD}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'USD')}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="Période actuelle" 
                  fill="hsl(var(--chart-1))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="Période précédente" 
                  fill="hsl(var(--chart-2))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {(currency === 'CDF' || currency === 'BOTH') && (
          <div>
            <h3 className="text-lg font-semibold mb-4">CDF</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataCDF}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'CDF')}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="Période actuelle" 
                  fill="hsl(var(--chart-3))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="Période précédente" 
                  fill="hsl(var(--chart-4))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
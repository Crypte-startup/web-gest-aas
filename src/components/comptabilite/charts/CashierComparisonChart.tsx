import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CashierData } from '@/hooks/useAnalyticsData';

interface CashierComparisonChartProps {
  data: CashierData[];
  currency: 'USD' | 'CDF' | 'BOTH';
}

export const CashierComparisonChart = ({ data, currency }: CashierComparisonChartProps) => {
  const formatCurrency = (value: number, curr: string) => {
    return curr === 'USD' 
      ? `$${value.toLocaleString('fr-FR')}` 
      : `${value.toLocaleString('fr-FR')} FC`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison par caissier</CardTitle>
      </CardHeader>
      <CardContent>
        {(currency === 'USD' || currency === 'BOTH') && (
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-4">Transactions en USD</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="cashierName" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString('fr-FR')}`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'USD')}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend />
                <Bar 
                  dataKey="recettesUsd" 
                  fill="hsl(var(--chart-1))" 
                  name="Recettes"
                />
                <Bar 
                  dataKey="depensesUsd" 
                  fill="hsl(var(--chart-2))" 
                  name="Dépenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {(currency === 'CDF' || currency === 'BOTH') && (
          <div>
            <h3 className="text-sm font-medium mb-4">Transactions en CDF</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="cashierName" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={(value) => `${value.toLocaleString('fr-FR')} FC`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'CDF')}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend />
                <Bar 
                  dataKey="recettesCdf" 
                  fill="hsl(var(--chart-3))" 
                  name="Recettes"
                />
                <Bar 
                  dataKey="depensesCdf" 
                  fill="hsl(var(--chart-4))" 
                  name="Dépenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

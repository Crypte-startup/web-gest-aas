import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyData } from '@/hooks/useAnalyticsData';

interface TrendChartProps {
  data: DailyData[];
  currency: 'USD' | 'CDF' | 'BOTH';
}

export const TrendChart = ({ data, currency }: TrendChartProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const formatCurrency = (value: number, curr: string) => {
    return curr === 'USD' 
      ? `$${value.toLocaleString('fr-FR')}` 
      : `${value.toLocaleString('fr-FR')} FC`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution temporelle des transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {(currency === 'USD' || currency === 'BOTH') && (
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-4">Transactions en USD</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString('fr-FR')}`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'USD')}
                  labelFormatter={(label) => formatDate(label as string)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="recettesUsd" 
                  stroke="hsl(var(--chart-1))" 
                  name="Recettes"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="depensesUsd" 
                  stroke="hsl(var(--chart-2))" 
                  name="Dépenses"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {(currency === 'CDF' || currency === 'BOTH') && (
          <div>
            <h3 className="text-sm font-medium mb-4">Transactions en CDF</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `${value.toLocaleString('fr-FR')} FC`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'CDF')}
                  labelFormatter={(label) => formatDate(label as string)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="recettesCdf" 
                  stroke="hsl(var(--chart-3))" 
                  name="Recettes"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="depensesCdf" 
                  stroke="hsl(var(--chart-4))" 
                  name="Dépenses"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

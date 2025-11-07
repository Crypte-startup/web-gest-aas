import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyTrendData } from '@/hooks/useYearlyTrendData';

interface YearlyTrendChartProps {
  data: MonthlyTrendData[];
  year: number;
  currency: 'USD' | 'CDF' | 'BOTH';
}

export const YearlyTrendChart = ({ data, year, currency }: YearlyTrendChartProps) => {
  const formatCurrency = (value: number, curr: string) => {
    return curr === 'USD' 
      ? `$${value.toLocaleString('fr-FR')}` 
      : `${value.toLocaleString('fr-FR')} FC`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendance annuelle {year}</CardTitle>
        <p className="text-sm text-muted-foreground">Évolution sur 12 mois</p>
      </CardHeader>
      <CardContent>
        {(currency === 'USD' || currency === 'BOTH') && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">USD - Évolution mensuelle</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-sm"
                />
                <YAxis 
                  className="text-sm"
                  tickFormatter={(value) => `$${value.toLocaleString('fr-FR')}`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'USD')}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="recettesUsd" 
                  name="Recettes USD"
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-1))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="depensesUsd" 
                  name="Dépenses USD"
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gapUsd" 
                  name="Écarts USD"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {(currency === 'CDF' || currency === 'BOTH') && (
          <div>
            <h3 className="text-lg font-semibold mb-4">CDF - Évolution mensuelle</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-sm"
                />
                <YAxis 
                  className="text-sm"
                  tickFormatter={(value) => `${value.toLocaleString('fr-FR')} FC`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, 'CDF')}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="recettesCdf" 
                  name="Recettes CDF"
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-3))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="depensesCdf" 
                  name="Dépenses CDF"
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-4))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gapCdf" 
                  name="Écarts CDF"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
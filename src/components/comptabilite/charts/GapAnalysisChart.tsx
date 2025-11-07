import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CashierData } from '@/hooks/useAnalyticsData';

interface GapAnalysisChartProps {
  data: CashierData[];
}

export const GapAnalysisChart = ({ data }: GapAnalysisChartProps) => {
  const gapData = data.map(cashier => ({
    name: cashier.cashierName,
    gapUsd: cashier.gapUsd,
    gapCdf: cashier.gapCdf,
  })).filter(d => d.gapUsd !== 0 || d.gapCdf !== 0);

  const getBarColor = (value: number) => {
    return value < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-1))';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse des écarts de clôture</CardTitle>
      </CardHeader>
      <CardContent>
        {gapData.length > 0 ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-medium mb-4">Écarts en USD</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gapData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => `$${value.toLocaleString('fr-FR')}`}
                    className="text-xs"
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString('fr-FR')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend />
                  <Bar dataKey="gapUsd" name="Écart USD">
                    {gapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.gapUsd)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-4">Écarts en CDF</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gapData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => `${value.toLocaleString('fr-FR')} FC`}
                    className="text-xs"
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString('fr-FR')} FC`}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend />
                  <Bar dataKey="gapCdf" name="Écart CDF">
                    {gapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.gapCdf)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun écart détecté pour la période sélectionnée
          </p>
        )}
      </CardContent>
    </Card>
  );
};

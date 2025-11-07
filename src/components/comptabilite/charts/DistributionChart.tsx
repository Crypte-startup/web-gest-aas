import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CashierData } from '@/hooks/useAnalyticsData';

interface DistributionChartProps {
  data: CashierData[];
  currency: 'USD' | 'CDF' | 'BOTH';
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const DistributionChart = ({ data, currency }: DistributionChartProps) => {
  const recettesUsdData = data.map((cashier, index) => ({
    name: cashier.cashierName,
    value: cashier.recettesUsd,
    color: COLORS[index % COLORS.length],
  })).filter(d => d.value > 0);

  const depensesUsdData = data.map((cashier, index) => ({
    name: cashier.cashierName,
    value: cashier.depensesUsd,
    color: COLORS[index % COLORS.length],
  })).filter(d => d.value > 0);

  const recettesCdfData = data.map((cashier, index) => ({
    name: cashier.cashierName,
    value: cashier.recettesCdf,
    color: COLORS[index % COLORS.length],
  })).filter(d => d.value > 0);

  const depensesCdfData = data.map((cashier, index) => ({
    name: cashier.cashierName,
    value: cashier.depensesCdf,
    color: COLORS[index % COLORS.length],
  })).filter(d => d.value > 0);

  const formatCurrency = (value: number, curr: string) => {
    return curr === 'USD' 
      ? `$${value.toLocaleString('fr-FR')}` 
      : `${value.toLocaleString('fr-FR')} FC`;
  };

  const renderLabel = (entry: any) => {
    const total = entry.payload.reduce((sum: number, item: any) => sum + item.value, 0);
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2">
          {(currency === 'USD' || currency === 'BOTH') && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-4 text-center">Recettes USD</h3>
                {recettesUsdData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={recettesUsdData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {recettesUsdData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value, 'USD')}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Aucune donnée</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4 text-center">Dépenses USD</h3>
                {depensesUsdData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={depensesUsdData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {depensesUsdData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value, 'USD')}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Aucune donnée</p>
                )}
              </div>
            </>
          )}

          {(currency === 'CDF' || currency === 'BOTH') && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-4 text-center">Recettes CDF</h3>
                {recettesCdfData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={recettesCdfData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {recettesCdfData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value, 'CDF')}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Aucune donnée</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4 text-center">Dépenses CDF</h3>
                {depensesCdfData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={depensesCdfData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {depensesCdfData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value, 'CDF')}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Aucune donnée</p>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import { useMemo } from 'react';
import { AuditEntry } from '@/types/finance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface AuditChartProps {
  auditTrail: AuditEntry[];
}

export function AuditChart({ auditTrail }: AuditChartProps) {
  const chartData = useMemo(() => {
    if (auditTrail.length === 0) return [];

    // Sort entries by timestamp (oldest first)
    const sortedEntries = [...auditTrail].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group by account and track balance over time
    const accountBalances: { [accountId: string]: number } = {};
    const data: Array<{
      timestamp: number;
      date: string;
      totalBalance: number;
      accountBalances: { [accountId: string]: number };
    }> = [];

    // Add initial point (all balances at 0)
    const firstEntry = sortedEntries[0];
    const firstTimestamp = new Date(firstEntry.timestamp).getTime();
    data.push({
      timestamp: firstTimestamp - 1000, // 1 second before first entry
      date: new Date(firstTimestamp - 1000).toISOString(),
      totalBalance: 0,
      accountBalances: {},
    });

    sortedEntries.forEach((entry) => {
      if (entry.action === 'deleted') {
        delete accountBalances[entry.accountId];
      } else {
        accountBalances[entry.accountId] = entry.newBalance;
      }

      const totalBalance = Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);
      const timestamp = new Date(entry.timestamp).getTime();

      data.push({
        timestamp,
        date: new Date(entry.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        totalBalance,
        accountBalances: { ...accountBalances },
      });
    });

    return data;
  }, [auditTrail]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const maxBalance = Math.max(...chartData.map(d => d.totalBalance), 0);
  const minBalance = Math.min(...chartData.map(d => d.totalBalance), 0);
  const hasNegativeValues = minBalance < 0;

  if (chartData.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No data available for chart</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--card-foreground))',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Total Balance']}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          />
          {hasNegativeValues && (
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="2 2" 
            />
          )}
          <Line
            type="monotone"
            dataKey="totalBalance"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{
              fill: 'hsl(var(--primary))',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              fill: 'hsl(var(--primary))',
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
import * as React from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@horizon-sync/ui/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../../utility/api/accounts';
import type { AccountBalance, AccountBalanceHistoryResponse } from '../../types/account.types';
import { getCurrencySymbol } from '../../types/currency.types';

interface BalanceHistoryProps {
  accountId: string;
  accountCode: string;
  accountName: string;
  currency: string;
}

type DateRange = '7d' | '30d' | '90d' | '1y';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
];

function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export function BalanceHistory({ accountId, accountCode, accountName, currency }: BalanceHistoryProps) {
  const { accessToken } = useUserStore();
  const [dateRange, setDateRange] = React.useState<DateRange>('30d');
  const [history, setHistory] = React.useState<AccountBalance[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const symbol = getCurrencySymbol(currency);

  const fetchHistory = React.useCallback(async () => {
    if (!accessToken) {
      setError('No access token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const response: AccountBalanceHistoryResponse = await accountApi.getBalanceHistory(
        accessToken,
        accountId,
        startDate,
        endDate
      );

      setHistory(response.history || []);
    } catch (err) {
      console.error('Failed to fetch balance history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance history');
    } finally {
      setLoading(false);
    }
  }, [accountId, dateRange, accessToken]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatCurrency = (amount: number): string => {
    return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (history.length === 0) {
      return { current: 0, min: 0, max: 0, avg: 0, trend: 0 };
    }

    const balances = history.map(h => h.balance);
    const current = balances[balances.length - 1] || 0;
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const avg = balances.reduce((sum, b) => sum + b, 0) / balances.length;
    const trend = balances.length > 1 ? current - balances[0] : 0;

    return { current, min, max, avg, trend };
  }, [history]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Balance History</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {accountCode} - {accountName}
            </p>
          </div>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading balance history...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No balance history available</div>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Current Balance
                </div>
                <div className="text-2xl font-bold">{formatCurrency(stats.current)}</div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="text-sm text-muted-foreground mb-1">Minimum</div>
                <div className="text-2xl font-bold">{formatCurrency(stats.min)}</div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="text-sm text-muted-foreground mb-1">Maximum</div>
                <div className="text-2xl font-bold">{formatCurrency(stats.max)}</div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  {stats.trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  Trend
                </div>
                <div className={`text-2xl font-bold ${stats.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.trend >= 0 ? '+' : ''}{formatCurrency(stats.trend)}
                </div>
              </div>
            </div>

            {/* Balance History Table */}
            <div className="border rounded-lg">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Date</th>
                      <th className="text-right p-3 text-sm font-medium">Debit</th>
                      <th className="text-right p-3 text-sm font-medium">Credit</th>
                      <th className="text-right p-3 text-sm font-medium">Balance</th>
                      {currency !== 'USD' && (
                        <th className="text-right p-3 text-sm font-medium">Base (USD)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, index) => {
                      const isPositive = item.balance >= 0;
                      return (
                        <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 text-sm">{formatDate(item.as_of_date)}</td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            {formatCurrency(item.debit_total)}
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            {formatCurrency(item.credit_total)}
                          </td>
                          <td className={`p-3 text-sm text-right font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(item.balance)}
                          </td>
                          {currency !== 'USD' && (
                            <td className="p-3 text-sm text-right text-muted-foreground">
                              ${Math.abs(item.base_currency_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{history.length} balance snapshots</span>
              <Button variant="outline" size="sm" onClick={fetchHistory}>
                Refresh
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

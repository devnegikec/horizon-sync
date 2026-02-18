import { useState, useMemo } from 'react';
import { FileText, Download, Filter, Printer, ChevronRight, ChevronDown } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useReports } from '../../hooks/useReports';
import type { ReportFilters } from '../../types/account.types';

interface ReportAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  status: string;
  currency: string;
  is_posting_account: boolean;
  balance: number;
  base_currency_balance: number;
  debit_balance?: number;
  credit_balance?: number;
  debit_total?: number;
  credit_total?: number;
  level?: number;
  children?: ReportAccount[];
}

interface HierarchicalNodeProps {
  account: ReportAccount;
  level: number;
}

function HierarchicalNode({ account, level }: HierarchicalNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <div className="border-l-2 border-border">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 hover:bg-muted/50 transition-colors',
          level > 0 && 'ml-6'
        )}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        
        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-2">
            <span className="font-mono text-sm">{account.account_code}</span>
          </div>
          <div className="col-span-4">
            <span className={cn('text-sm', hasChildren && 'font-semibold')}>
              {account.account_name}
            </span>
          </div>
          <div className="col-span-2">
            <Badge variant="outline" className="text-xs">
              {account.account_type}
            </Badge>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-sm">{account.currency}</span>
          </div>
          <div className="col-span-2 text-right">
            <span className={cn(
              'text-sm font-medium',
              account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {account.balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="ml-4">
          {account.children!.map((child) => (
            <HierarchicalNode key={child.id} account={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Reports() {
  const [filters, setFilters] = useState<ReportFilters>({
    account_type: 'all',
    status: 'all',
    as_of_date: new Date().toISOString().split('T')[0],
  });

  const {
    chartOfAccountsReport,
    hierarchicalReport,
    trialBalanceReport,
    loading,
    error,
    refetch,
  } = useReports(filters);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: 'csv' | 'json' | 'xlsx' | 'pdf') => {
    const params = new URLSearchParams();
    params.append('format', format);
    if (filters.account_type !== 'all') params.append('account_type', filters.account_type);
    if (filters.status !== 'all') params.append('status', filters.status);
    if (filters.as_of_date) params.append('as_of_date', filters.as_of_date);

    const url = `/api/v1/accounts/export?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and view financial reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Account Type</label>
              <Select
                value={filters.account_type}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, account_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="income">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">As of Date</label>
              <input
                type="date"
                value={filters.as_of_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, as_of_date: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={() => refetch()} className="gap-2">
                <FileText className="h-4 w-4" />
                Generate Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="hierarchical">Hierarchical View</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>

        {/* Chart of Accounts Report */}
        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chart of Accounts Report</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                    JSON
                  </Button>
                </div>
              </div>
              {chartOfAccountsReport && (
                <p className="text-sm text-muted-foreground">
                  As of {chartOfAccountsReport.as_of_date} • {chartOfAccountsReport.total_accounts} accounts
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8 text-muted-foreground">Loading report...</div>}
              {error && <div className="text-center py-8 text-red-600">Error loading report: {error}</div>}
              {chartOfAccountsReport && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-semibold">Code</th>
                        <th className="text-left p-3 font-semibold">Name</th>
                        <th className="text-left p-3 font-semibold">Type</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Currency</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartOfAccountsReport.accounts.map((account: ReportAccount) => (
                        <tr key={account.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono">{account.account_code}</td>
                          <td className="p-3">{account.account_name}</td>
                          <td className="p-3">
                            <Badge variant="outline">{account.account_type}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {account.status}
                            </Badge>
                          </td>
                          <td className="p-3">{account.currency}</td>
                          <td className={cn(
                            'p-3 text-right font-medium',
                            account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          )}>
                            {account.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hierarchical Report */}
        <TabsContent value="hierarchical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchical Report</CardTitle>
              {hierarchicalReport && (
                <p className="text-sm text-muted-foreground">
                  As of {hierarchicalReport.as_of_date} • {hierarchicalReport.total_accounts} accounts
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8 text-muted-foreground">Loading report...</div>}
              {error && <div className="text-center py-8 text-red-600">Error loading report: {error}</div>}
              {hierarchicalReport && (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-muted/50 rounded-t font-semibold text-sm">
                    <div className="col-span-2">Code</div>
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2 text-right">Currency</div>
                    <div className="col-span-2 text-right">Balance</div>
                  </div>
                  
                  {/* Tree */}
                  <div className="border rounded-b">
                    {hierarchicalReport.tree.map((account: ReportAccount) => (
                      <HierarchicalNode key={account.id} account={account} level={0} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance Report */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trial Balance Report</CardTitle>
                {trialBalanceReport && (
                  <Badge variant={trialBalanceReport.is_balanced ? 'default' : 'destructive'}>
                    {trialBalanceReport.is_balanced ? '✓ Balanced' : '✗ Out of Balance'}
                  </Badge>
                )}
              </div>
              {trialBalanceReport && (
                <p className="text-sm text-muted-foreground">
                  As of {trialBalanceReport.as_of_date} • {trialBalanceReport.total_accounts} posting accounts
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8 text-muted-foreground">Loading report...</div>}
              {error && <div className="text-center py-8 text-red-600">Error loading report: {error}</div>}
              {trialBalanceReport && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="bg-muted/50">
                          <th className="text-left p-3 font-semibold">Code</th>
                          <th className="text-left p-3 font-semibold">Name</th>
                          <th className="text-left p-3 font-semibold">Type</th>
                          <th className="text-right p-3 font-semibold">Debit</th>
                          <th className="text-right p-3 font-semibold">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trialBalanceReport.accounts.map((account: ReportAccount) => (
                          <tr key={account.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-mono">{account.account_code}</td>
                            <td className="p-3">{account.account_name}</td>
                            <td className="p-3">
                              <Badge variant="outline">{account.account_type}</Badge>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {account.debit_balance && account.debit_balance > 0
                                ? account.debit_balance.toFixed(2)
                                : '-'}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {account.credit_balance && account.credit_balance > 0
                                ? account.credit_balance.toFixed(2)
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-foreground">
                        <tr className="bg-muted font-bold">
                          <td colSpan={3} className="p-3 text-right">TOTAL</td>
                          <td className="p-3 text-right">{trialBalanceReport.total_debits.toFixed(2)}</td>
                          <td className="p-3 text-right">{trialBalanceReport.total_credits.toFixed(2)}</td>
                        </tr>
                        {!trialBalanceReport.is_balanced && (
                          <tr className="bg-red-50 dark:bg-red-900/20">
                            <td colSpan={3} className="p-3 text-right text-red-600 dark:text-red-400">
                              DIFFERENCE
                            </td>
                            <td colSpan={2} className="p-3 text-right text-red-600 dark:text-red-400 font-bold">
                              {trialBalanceReport.difference.toFixed(2)}
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

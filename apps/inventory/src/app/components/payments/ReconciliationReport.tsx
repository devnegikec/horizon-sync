import { useState } from 'react';
import { FileText, Download, Filter, Printer, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
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
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { usePaymentReports, ReconciliationFilters } from '../../hooks/usePaymentReports';
import { formatCurrency, formatDate } from '../../utils/payment.utils';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { StatCard } from './StatCard';

export function ReconciliationReport() {
  const [filters, setFilters] = useState<ReconciliationFilters>({
    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    status: undefined,
    payment_mode: undefined,
  });

  const { reportData, loading, error, refetch, exportReport } = usePaymentReports(filters);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    exportReport(format);
  };

  const columns = [
    {
      accessorKey: 'receipt_number',
      header: 'Receipt #',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.original.receipt_number || 'Draft'}</span>
      ),
    },
    {
      accessorKey: 'payment_date',
      header: 'Date',
      cell: ({ row }: any) => formatDate(row.original.payment_date),
    },
    {
      accessorKey: 'party_name',
      header: 'Party',
    },
    {
      accessorKey: 'payment_mode',
      header: 'Mode',
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.payment_mode.replace('_', ' ')}</Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => (
        <span className="font-semibold">
          {formatCurrency(row.original.amount, row.original.currency_code)}
        </span>
      ),
    },
    {
      accessorKey: 'unallocated_amount',
      header: 'Unallocated',
      cell: ({ row }: any) => {
        const unallocated = row.original.unallocated_amount;
        return unallocated > 0 ? (
          <span className="text-orange-600 font-semibold flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {formatCurrency(unallocated, row.original.currency_code)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => <PaymentStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'allocations',
      header: 'Allocations',
      cell: ({ row }: any) => {
        const allocations = row.original.allocations || [];
        return (
          <div className="text-sm">
            {allocations.length > 0 ? (
              <div className="space-y-1">
                {allocations.map((alloc: any, idx: number) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    {alloc.invoice_no}: {formatCurrency(alloc.allocated_amount, row.original.currency_code)}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">No allocations</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reconciliation Report</h1>
          <p className="text-muted-foreground mt-1">
            View payment reconciliation and allocation summary
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4" />
            Export Excel
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
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, date_from: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, date_to: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Payment Mode</label>
              <Select
                value={filters.payment_mode || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    payment_mode: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Bank_Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => refetch()} className="gap-2">
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Payments"
            value={formatCurrency(reportData.total_payments_received, 'USD')}
            icon={DollarSign}
            iconBg="bg-blue-100 dark:bg-blue-900/20"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Total Allocated"
            value={formatCurrency(reportData.total_allocated, 'USD')}
            icon={TrendingUp}
            iconBg="bg-green-100 dark:bg-green-900/20"
            iconColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Total Unallocated"
            value={formatCurrency(reportData.total_unallocated, 'USD')}
            icon={AlertCircle}
            iconBg="bg-orange-100 dark:bg-orange-900/20"
            iconColor="text-orange-600 dark:text-orange-400"
          />
        </div>
      )}

      {/* Report Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Details</CardTitle>
            {reportData && (
              <p className="text-sm text-muted-foreground">
                {reportData.date_from} to {reportData.date_to} • {reportData.payments.length}{' '}
                payments
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8 text-muted-foreground">Loading report...</div>
          )}
          {error && (
            <div className="text-center py-8 text-red-600">Error loading report: {error}</div>
          )}
          {reportData && (
            <DataTable
              columns={columns}
              data={reportData.payments}
            />
          )}
        </CardContent>
      </Card>

      {/* Breakdown by Status and Mode */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Draft</span>
                  <span className="font-semibold">
                    {formatCurrency(reportData.payments_by_status.draft, 'USD')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Confirmed</span>
                  <span className="font-semibold">
                    {formatCurrency(reportData.payments_by_status.confirmed, 'USD')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cancelled</span>
                  <span className="font-semibold">
                    {formatCurrency(reportData.payments_by_status.cancelled, 'USD')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments by Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cash</span>
                  <span className="font-semibold">
                    {formatCurrency(reportData.payments_by_mode.cash, 'USD')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Check</span>
                  <span className="font-semibold">
                    {formatCurrency(reportData.payments_by_mode.check, 'USD')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bank Transfer</span>
                  <span className="font-semibold">
                    {formatCurrency(reportData.payments_by_mode.bank_transfer, 'USD')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

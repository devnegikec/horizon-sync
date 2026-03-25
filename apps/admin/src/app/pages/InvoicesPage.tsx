import { useState, useEffect, useMemo, useCallback } from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Building2,
  User,
  MoreHorizontal,
  Eye,
  ChevronsUpDown,
  Check,
  ShieldAlert,
  ShieldCheck,
  Mail,
} from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  DataTableViewOptions,
  DataTable,
  DataTableColumnHeader,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  InvoiceContent,
  InvoiceStatusBadge,
  TableSkeleton,
  EmptyState,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ConfirmationDialog,
  SendInvoiceEmailDialog,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { toast } from '@horizon-sync/ui';
import { formatDate } from '@horizon-sync/ui/utils';
import type { Invoice, InvoiceStatus } from '@horizon-sync/ui/types';

import { useInvoices } from '../hooks/useInvoices';
import { useInvoiceStats } from '../hooks/useInvoiceStats';
import { useInvoice } from '../hooks/useInvoice';
import { useOrganizations } from '../hooks/useOrganizations';
import { AdminOrganizationService } from '../services/admin-organization.service';
import { AdminInvoiceService } from '../services/admin-invoice.service';
import type { AdminInvoiceFilters, AdminInvoiceListItem } from '../types';

const PAGE_SIZE = 20;

// ─── StatCard (same pattern as UsersPage / OrganizationsPage) ────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helper: map AdminInvoiceListItem → Invoice ──────────────────────────────

function mapToInvoice(item: AdminInvoiceListItem): Invoice {
  return {
    id: item.id,
    organization_id: item.organization_id,
    invoice_no: item.invoice_no,
    invoice_type: item.invoice_type,
    party_id: item.party_id,
    party_type: item.invoice_type === 'sales' ? 'customer' : 'supplier',
    party_name: item.party_name ?? undefined,
    posting_date: item.posting_date,
    due_date: item.due_date ?? '',
    status: item.status as InvoiceStatus,
    grand_total: item.grand_total,
    outstanding_amount: item.outstanding_amount ?? 0,
    currency: 'USD',
    created_at: item.created_at,
    updated_at: item.created_at,
  };
}

// ─── Format currency helper ──────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

// ─── Helper: check if an invoice is overdue ──────────────────────────────────

function isInvoiceOverdue(item: AdminInvoiceListItem): boolean {
  if (!item.due_date) return false;
  const dueDate = new Date(item.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today && (item.status === 'pending' || item.status === 'partial');
}

// ─── Helper: build pre-populated reminder email data ─────────────────────────

function buildReminderEmailData(item: AdminInvoiceListItem) {
  const daysOverdue = item.due_date
    ? Math.floor((Date.now() - new Date(item.due_date).getTime()) / 86400000)
    : 0;

  const currency = 'USD';
  const grandTotal = Number(item.grand_total).toFixed(2);
  const outstandingAmount = Number(item.outstanding_amount ?? item.grand_total).toFixed(2);
  const dueDateFormatted = item.due_date
    ? new Date(item.due_date).toLocaleDateString()
    : 'N/A';

  const subject = `Payment Reminder: Invoice ${item.invoice_no} — Overdue by ${daysOverdue} days`;

  const body = `Dear ${item.party_name ?? 'Customer'},

This is a reminder that invoice ${item.invoice_no} for ${currency} ${grandTotal} was due on ${dueDateFormatted} and is now ${daysOverdue} days overdue.

Outstanding amount: ${currency} ${outstandingAmount}

Please arrange payment at your earliest convenience.

Best regards`;

  return { subject, body };
}

// ─── InvoicesPage ────────────────────────────────────────────────────────────

export function InvoicesPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Table instance for DataTableViewOptions
  const [tableInstance, setTableInstance] = useState<Table<Invoice> | null>(null);

  // Detail dialog state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Org search for dropdown
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);

  // Suspend/reactivate dialog state
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendAction, setSuspendAction] = useState<'suspend' | 'reactivate'>('suspend');
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Reminder email dialog state
  const [reminderInvoice, setReminderInvoice] = useState<AdminInvoiceListItem | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  const queryClient = useQueryClient();

  // Build filters
  const filters: AdminInvoiceFilters = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(orgFilter !== 'all' ? { organization_id: orgFilter } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
      page,
      page_size: pageSize,
    }),
    [search, orgFilter, statusFilter, dateFrom, dateTo, page, pageSize]
  );

  // Data hooks
  const { data: invoiceData, isLoading, refetch } = useInvoices(filters);
  const { data: statsData, isError: statsError } = useInvoiceStats(
    orgFilter !== 'all' ? orgFilter : undefined
  );
  const { data: selectedInvoiceDetail } = useInvoice(selectedInvoiceId ?? '');

  // Org list for filter dropdown
  const orgFilters = useMemo(
    () => ({
      ...(orgSearchQuery ? { search: orgSearchQuery } : {}),
      page: 1,
      page_size: 100,
    }),
    [orgSearchQuery]
  );
  const { data: orgData } = useOrganizations(orgFilters);
  const orgOptions = orgData?.organizations ?? [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, orgFilter, dateFrom, dateTo]);

  const invoices = invoiceData?.invoices ?? [];
  const pagination = invoiceData?.pagination;

  // Map to Invoice type for shared table
  const mappedInvoices: Invoice[] = useMemo(
    () => invoices.map(mapToInvoice),
    [invoices]
  );

  // Stat card values
  const totalInvoices = statsError ? '—' : (statsData?.total_invoices ?? '—');
  const overdueInvoices = statsError ? '—' : (statsData?.overdue_invoices ?? '—');
  const totalOutstanding = statsError
    ? '—'
    : statsData
      ? formatCurrency(statsData.total_outstanding)
      : '—';
  const totalOverdueAmount = statsError
    ? '—'
    : statsData
      ? formatCurrency(statsData.total_overdue_amount)
      : '—';

  // Server pagination config
  const serverPaginationConfig = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize,
      totalItems: pagination?.total_items ?? 0,
      onPaginationChange: (pageIndex: number, newPageSize: number) => {
        setPage(pageIndex + 1);
        setPageSize(newPageSize);
      },
    }),
    [page, pageSize, pagination?.total_items]
  );

  // Handlers
  const handleView = useCallback((invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    setDetailOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    toast({ title: 'Refreshed', description: 'Invoice data has been refreshed.' });
  }, [refetch]);

  const hasActiveFilters =
    !!search || statusFilter !== 'all' || orgFilter !== 'all' || !!dateFrom || !!dateTo;

  // Find selected invoice's org context for detail dialog
  const selectedInvoiceOrgContext = useMemo(() => {
    if (!selectedInvoiceId) return null;
    const item = invoices.find((i) => i.id === selectedInvoiceId);
    if (!item) return null;
    return {
      organization_name: item.organization_name,
      organization_id: item.organization_id,
    };
  }, [selectedInvoiceId, invoices]);

  // Selected org info for billing summary card
  const selectedOrg = useMemo(() => {
    if (orgFilter === 'all') return null;
    return orgOptions.find((o) => o.id === orgFilter) ?? null;
  }, [orgFilter, orgOptions]);

  // Suspend/reactivate handler
  const handleOrgStatusChange = useCallback(async () => {
    if (!selectedOrg) return;
    setSuspendLoading(true);
    try {
      const newStatus = suspendAction === 'suspend' ? 'suspended' : 'active';
      await AdminOrganizationService.update(selectedOrg.id, { status: newStatus as any });
      toast({
        title: suspendAction === 'suspend' ? 'Organization Suspended' : 'Organization Reactivated',
        description: `${selectedOrg.name} has been ${suspendAction === 'suspend' ? 'suspended' : 'reactivated'} successfully.`,
      });
      setSuspendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', selectedOrg.id] });
    } catch (error: any) {
      const message = error?.data?.detail
        ? (typeof error.data.detail === 'string' ? error.data.detail : 'Failed to update organization')
        : (error?.message ?? 'Failed to update organization status');
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSuspendLoading(false);
    }
  }, [selectedOrg, suspendAction, queryClient]);

  // Send reminder handler
  const handleSendReminder = useCallback(
    async (invoiceId: string, emailData: { to: string; subject: string; body: string }) => {
      setSendingReminder(true);
      try {
        await AdminInvoiceService.sendReminder(invoiceId, emailData);
        toast({
          title: 'Reminder Sent',
          description: `Payment reminder for invoice ${reminderInvoice?.invoice_no ?? ''} has been sent successfully.`,
        });
        setReminderInvoice(null);
      } catch (error: any) {
        const message = error?.data?.detail
          ? typeof error.data.detail === 'string'
            ? error.data.detail
            : 'Failed to send reminder'
          : error?.message ?? 'Failed to send reminder email';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        throw error; // re-throw so dialog doesn't auto-close on failure
      } finally {
        setSendingReminder(false);
      }
    },
    [reminderInvoice]
  );

  // Build a temporary Invoice-like object for SendInvoiceEmailDialog with pre-populated reminder content
  const reminderDialogInvoice: Invoice | null = useMemo(() => {
    if (!reminderInvoice) return null;
    return mapToInvoice(reminderInvoice);
  }, [reminderInvoice]);

  // Pre-populated reminder email subject and body
  const reminderEmailDefaults = useMemo(() => {
    if (!reminderInvoice) return { subject: undefined, body: undefined };
    return buildReminderEmailData(reminderInvoice);
  }, [reminderInvoice]);

  // ─── Table columns (InvoicesTable extended with org name) ──────────────────

  const columns: ColumnDef<Invoice, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'invoice_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{invoice.invoice_no}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(invoice.created_at, 'DD-MMM-YY')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'organization_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" />,
        cell: ({ row }) => {
          const orgName = invoices.find((i) => i.id === row.original.id)?.organization_name;
          return orgName ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{orgName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'party_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Party" />,
        cell: ({ row }) => {
          const invoice = row.original;
          return invoice.party_name ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">{invoice.party_name}</p>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'invoice_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <span className="text-sm capitalize">
            {row.original.invoice_type === 'sales' ? 'Sales' : 'Purchase'}
          </span>
        ),
      },
      {
        accessorKey: 'posting_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Posting Date" />,
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.posting_date, 'DD-MMM-YY')}</span>
        ),
      },
      {
        accessorKey: 'due_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.due_date ? formatDate(row.original.due_date, 'DD-MMM-YY') : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'grand_total',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="text-right">
              <p className="font-semibold">
                {invoice.currency} {Number(invoice.grand_total).toFixed(2)}
              </p>
              {invoice.outstanding_amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Due: {invoice.currency} {Number(invoice.outstanding_amount).toFixed(2)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const invoice = row.original;
          const listItem = invoices.find((i) => i.id === invoice.id);
          const overdue = listItem ? isInvoiceOverdue(listItem) : false;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleView(invoice)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {overdue && listItem && (
                    <DropdownMenuItem onClick={() => setReminderInvoice(listItem)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reminder
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [invoices, handleView]
  );

  // ─── Server pagination config for DataTable ────────────────────────────────

  const serverPaginationForTable = useMemo(() => {
    if (!serverPaginationConfig) return undefined;
    return {
      totalItems: serverPaginationConfig.totalItems,
      currentPage: serverPaginationConfig.pageIndex + 1,
      pageSize: serverPaginationConfig.pageSize,
      onPageChange: (p: number, ps: number) => {
        serverPaginationConfig.onPaginationChange(p - 1, ps);
      },
    };
  }, [serverPaginationConfig]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            View and manage invoices across all organizations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleRefresh()}
            className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invoices"
          value={totalInvoices}
          icon={FileText}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <StatCard
          title="Overdue Invoices"
          value={overdueInvoices}
          icon={AlertTriangle}
          iconBg="bg-red-100 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Total Outstanding"
          value={totalOutstanding}
          icon={DollarSign}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Total Overdue Amount"
          value={totalOverdueAmount}
          icon={DollarSign}
          iconBg="bg-red-100 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Organization Billing Summary Card — shown when org filter is selected */}
      {selectedOrg && statsData && (
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedOrg.name}</h3>
                  <p className="text-sm text-muted-foreground">Organization Billing Summary</p>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-2xl font-bold">{statsData.total_invoices}</p>
                  <p className="text-xs text-muted-foreground">Total Invoices</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{statsData.overdue_invoices}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(statsData.total_outstanding)}</p>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </div>
                {selectedOrg.status === 'suspended' ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setSuspendAction('reactivate');
                      setSuspendDialogOpen(true);
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Reactivate Organization
                  </Button>
                ) : (
                  statsData.overdue_invoices > 0 && (
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        setSuspendAction('suspend');
                        setSuspendDialogOpen(true);
                      }}
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Suspend Organization
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-wrap">
          <SearchInput
            className="sm:w-72"
            placeholder="Search by invoice # or party..."
            onSearch={(value) => setSearch(value)}
          />

          {/* Organization filter — searchable popover */}
          <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={orgPopoverOpen}
                className="w-[220px] justify-between font-normal"
              >
                {orgFilter !== 'all'
                  ? orgOptions.find((o) => o.id === orgFilter)?.name ?? 'Organization'
                  : 'All Organizations'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                placeholder="Search organizations..."
                value={orgSearchQuery}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-60 overflow-y-auto space-y-1">
                <button
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer',
                    orgFilter === 'all' && 'bg-accent'
                  )}
                  onClick={() => {
                    setOrgFilter('all');
                    setOrgPopoverOpen(false);
                    setOrgSearchQuery('');
                  }}
                >
                  <Check
                    className={cn('h-4 w-4', orgFilter === 'all' ? 'opacity-100' : 'opacity-0')}
                  />
                  All Organizations
                </button>
                {orgOptions.map((org) => (
                  <button
                    key={org.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer',
                      orgFilter === org.id && 'bg-accent'
                    )}
                    onClick={() => {
                      setOrgFilter(org.id);
                      setOrgPopoverOpen(false);
                      setOrgSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        orgFilter === org.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {org.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[140px]"
              placeholder="From"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[140px]"
              placeholder="To"
            />
          </div>
        </div>
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={9} rows={10} showHeader />
          </CardContent>
        </Card>
      ) : mappedInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-6">
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No invoices found"
                description={
                  hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'No invoices have been created yet'
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={mappedInvoices}
              config={{
                showSerialNumber: true,
                showPagination: true,
                enableRowSelection: false,
                enableColumnVisibility: true,
                enableSorting: true,
                enableFiltering: false,
                initialPageSize: pageSize,
                serverPagination: serverPaginationForTable,
              }}
              filterPlaceholder="Search invoices..."
              renderViewOptions={(table) => {
                if (table !== tableInstance) {
                  setTableInstance(table);
                }
                return null;
              }}
              fixedHeader
              maxHeight="auto"
            />
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Dialog with Organization Context */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedInvoiceId(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoiceDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  {selectedInvoiceDetail.invoice_no}
                  <InvoiceStatusBadge status={selectedInvoiceDetail.status} />
                </DialogTitle>
              </DialogHeader>

              {/* Organization context */}
              {selectedInvoiceOrgContext && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-sm border">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedInvoiceOrgContext.organization_name ?? 'Unknown Organization'}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    ID: {selectedInvoiceOrgContext.organization_id}
                  </span>
                </div>
              )}

              <InvoiceContent
                invoice={selectedInvoiceDetail}
                currencySymbol={selectedInvoiceDetail.currency ?? 'USD'}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend/Reactivate Confirmation Dialog */}
      <ConfirmationDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        title={suspendAction === 'suspend' ? 'Suspend Organization' : 'Reactivate Organization'}
        description={
          suspendAction === 'suspend'
            ? `Are you sure you want to suspend ${selectedOrg?.name ?? 'this organization'}? It has ${statsData?.overdue_invoices ?? 0} overdue invoice(s) with ${formatCurrency(statsData?.total_overdue_amount ?? 0)} overdue. Suspending will restrict the organization's access.`
            : `Are you sure you want to reactivate ${selectedOrg?.name ?? 'this organization'}? This will restore the organization's access.`
        }
        confirmLabel={suspendAction === 'suspend' ? 'Suspend' : 'Reactivate'}
        cancelLabel="Cancel"
        variant={suspendAction === 'suspend' ? 'destructive' : 'default'}
        loading={suspendLoading}
        onConfirm={() => handleOrgStatusChange()}
      />

      {/* Send Reminder Email Dialog */}
      <SendInvoiceEmailDialog
        open={reminderInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setReminderInvoice(null);
        }}
        invoice={reminderDialogInvoice}
        onSend={handleSendReminder}
        sending={sendingReminder}
        defaultSubject={reminderEmailDefaults.subject}
        defaultBody={reminderEmailDefaults.body}
      />
    </div>
  );
}

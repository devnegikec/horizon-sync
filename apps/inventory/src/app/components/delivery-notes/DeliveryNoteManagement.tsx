import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Plus,
  Download,
  RefreshCw,
  AlertTriangle,
  Package,
  FileCheck,
  Ban,
  Eye,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { cn } from '@horizon-sync/ui/lib';

import type { DeliveryNote, DeliveryNoteResponse } from '../../types/delivery-note.types';
import { deliveryNoteApi } from '../../utility/api';

import { DeliveryNoteDetailDialog } from './DeliveryNoteDetailDialog';

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

function getStatusBadge(status: DeliveryNote['status']) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'submitted':
      return { variant: 'success' as const, label: 'Shipped' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
  }
}

export function DeliveryNoteManagement() {
  const accessToken = useUserStore((s) => s.accessToken);

  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<DeliveryNote | null>(null);

  const { data, isLoading, error, refetch } = useQuery<DeliveryNoteResponse>({
    queryKey: ['delivery-notes', filters.page, filters.pageSize, filters.status],
    queryFn: () =>
      deliveryNoteApi.list(
        accessToken || '',
        filters.page,
        filters.pageSize,
        {
          status: filters.status !== 'all' ? filters.status : undefined,
        },
      ) as Promise<DeliveryNoteResponse>,
    enabled: !!accessToken,
  });

  const deliveryNotes = data?.delivery_notes ?? [];
  const pagination = data?.pagination;

  const stats = React.useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const draft = deliveryNotes.filter((d) => d.status === 'draft').length;
    const shipped = deliveryNotes.filter((d) => d.status === 'submitted').length;
    const cancelled = deliveryNotes.filter((d) => d.status === 'cancelled').length;
    return { total, draft, shipped, cancelled };
  }, [deliveryNotes, pagination]);

  const handleView = React.useCallback((note: DeliveryNote) => {
    setSelectedNote(note);
    setDetailDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Notes</h1>
          <p className="text-muted-foreground mt-1">Manage shipments, packing slips, and delivery tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            New Delivery Note
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Error loading delivery notes: {(error as Error).message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Delivery Notes" value={stats.total} icon={Package} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Draft" value={stats.draft} icon={FileCheck} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Shipped" value={stats.shipped} icon={Truck} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={Ban} iconBg="bg-red-100 dark:bg-red-900/20" iconColor="text-red-600 dark:text-red-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-80"
          placeholder="Search by delivery note #, customer..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value, page: 1 }))}
        />
        <Select value={filters.status} onValueChange={(status) => setFilters((prev) => ({ ...prev, status, page: 1 }))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Shipped</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="rounded-lg border-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery Note #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shipping Date</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Tracking #</TableHead>
                <TableHead className="text-right">Packages</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && deliveryNotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No delivery notes found
                  </TableCell>
                </TableRow>
              )}
              {deliveryNotes.map((note) => {
                const badge = getStatusBadge(note.status);
                return (
                  <TableRow key={note.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(note)}>
                    <TableCell className="font-medium">{note.delivery_note_number}</TableCell>
                    <TableCell>{note.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(note.shipping_date).toLocaleDateString()}</TableCell>
                    <TableCell>{note.carrier_name}</TableCell>
                    <TableCell className="font-mono text-xs">{note.tracking_number}</TableCell>
                    <TableCell className="text-right">{note.total_packages}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleView(note); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total_items} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.has_prev} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.has_next} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <DeliveryNoteDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        deliveryNote={selectedNote}
        onConvertToInvoice={(id) => console.log('Convert to invoice:', id)}
        onEdit={(note) => console.log('Edit:', note.id)}
      />
    </div>
  );
}

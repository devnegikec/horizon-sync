import * as React from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Table } from '@tanstack/react-table';
import {
  Truck,
  Plus,
  Download,
  Loader2,
  RefreshCw,
  Package,
  FileCheck,
  Ban,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Card, CardContent, DataTableViewOptions, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { cn } from '@horizon-sync/ui/lib';

import type { DeliveryNote, DeliveryNoteCreate, DeliveryNoteResponse, DeliveryNoteUpdate } from '../../types/delivery-note.types';
import { deliveryNoteApi } from '../../utility/api';
import { getFriendlyErrorMessage } from '../../utility/api/core';
import { ErrorBanner } from '../common';
import { StatCard } from '../shared';

import { DeliveryNoteDetailDialog } from './DeliveryNoteDetailDialog';
import { DeliveryNoteDialog } from './DeliveryNoteDialog';
import { DeliveryNotesTable } from './DeliveryNotesTable';

interface DeliveryNoteFilters {
  search: string;
  status: string;
}

export function DeliveryNoteManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = useState<DeliveryNoteFilters>({
    search: '',
    status: 'all',
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const firstPage = await deliveryNoteApi.list(accessToken, 1, 100) as { delivery_notes: Record<string, unknown>[]; pagination: { total_pages: number } };
      let all: Record<string, unknown>[] = firstPage.delivery_notes ?? [];
      const totalPages = firstPage.pagination?.total_pages ?? 1;
      for (let p = 2; p <= totalPages; p++) {
        const page = await deliveryNoteApi.list(accessToken, p, 100) as { delivery_notes: Record<string, unknown>[] };
        all = all.concat(page.delivery_notes ?? []);
      }

      const headers = ['Delivery Note No', 'Customer', 'Delivery Date', 'Status', 'Created At'];
      const rows = all.map((r) => [
        String(r['delivery_note_no'] ?? ''),
        String(r['customer_name'] ?? ''),
        String(r['delivery_date'] ?? ''),
        String(r['status'] ?? ''),
        String(r['created_at'] ?? ''),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'delivery-notes.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [accessToken]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [editNote, setEditNote] = useState<DeliveryNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [tableInstance, setTableInstance] = useState<Table<DeliveryNote> | null>(null);
  const [convertingInvoice, setConvertingInvoice] = useState(false);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data, isLoading, error, refetch } = useQuery<DeliveryNoteResponse>({
    queryKey: ['delivery-notes', page, pageSize, filters.status, filters.search],
    queryFn: () =>
      deliveryNoteApi.list(
        accessToken || '',
        page,
        pageSize,
        {
          status: filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined,
        },
      ) as Promise<DeliveryNoteResponse>,
    enabled: !!accessToken,
  });

  const deliveryNotes = data?.delivery_notes ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const draft = deliveryNotes.filter((d) => d.status === 'draft').length;
    const shipped = deliveryNotes.filter((d) => d.status === 'submitted').length;
    const cancelled = deliveryNotes.filter((d) => d.status === 'cancelled').length;
    return { total, draft, shipped, cancelled };
  }, [deliveryNotes, pagination]);

  const handleView = React.useCallback(async (note: DeliveryNote) => {
    if (!accessToken) return;
    try {
      const fullNote = await deliveryNoteApi.get(accessToken, note.id) as DeliveryNote;
      setSelectedNote(fullNote);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: getFriendlyErrorMessage(err),
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleCreate = () => {
    setEditNote(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = React.useCallback((note: DeliveryNote) => {
    setEditNote(note);
    setDetailDialogOpen(false);
    setCreateDialogOpen(true);
  }, []);

  const handleTableReady = (table: Table<DeliveryNote>) => {
    setTableInstance(table);
  };

  const handleSave = async (data: DeliveryNoteCreate | DeliveryNoteUpdate, id?: string) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      if (id) {
        await deliveryNoteApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Delivery note updated successfully' });
      } else {
        await deliveryNoteApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Delivery note created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      setCreateDialogOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: getFriendlyErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: page - 1, // DataTable uses 0-based indexing
    pageSize: pageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1); // Convert back to 1-based for API
      setPageSize(newPageSize);
    }
  }), [page, pageSize, pagination?.total_items]);

  const handleConvertToInvoice = React.useCallback(async (
    deliveryNoteId: string,
    data: { items: { item_id: string; qty_to_bill: number }[]; due_date?: string; remarks?: string },
  ) => {
    if (!accessToken) return;
    setConvertingInvoice(true);
    try {
      const result = await deliveryNoteApi.convertToInvoice(accessToken, deliveryNoteId, data) as { invoice_id: string; invoice_no: string; grand_total: number | string; message: string };
      toast({
        title: 'Success',
        description: `Invoice ${result.invoice_no} created with total ${Number(result.grand_total).toFixed(2)}`,
      });
      setDetailDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      refetch();
    } catch (err) {
      // Extract user-friendly message from API error
      let errorMessage = 'Failed to convert to invoice';
      if (err && typeof err === 'object') {
        const apiErr = err as { details?: { message?: string }; message?: string };
        if (apiErr.details?.message) {
          errorMessage = apiErr.details.message;
        } else if (apiErr.message) {
          try {
            const parsed = JSON.parse(apiErr.message);
            errorMessage = parsed.message || errorMessage;
          } catch {
            errorMessage = apiErr.message;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err; // Re-throw so caller knows it failed
    } finally {
      setConvertingInvoice(false);
    }
  }, [accessToken, toast, queryClient, refetch]);

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
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</> : <><Download className="h-4 w-4" />Export</>}
          </Button>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            New Delivery Note
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && <ErrorBanner entity="delivery notes" message={getFriendlyErrorMessage(error)} />}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Delivery Notes" value={stats.total} icon={Package} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Draft" value={stats.draft} icon={FileCheck} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Shipped" value={stats.shipped} icon={Truck} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={Ban} iconBg="bg-red-100 dark:bg-red-900/20" iconColor="text-red-600 dark:text-red-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80"
            placeholder="Search by delivery note #, customer..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))} />
          <div className="flex gap-3">
            <Select value={filters.status} onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}>
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
        </div>
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Delivery Notes Table */}
      <DeliveryNotesTable deliveryNotes={deliveryNotes}
        loading={isLoading}
        error={error ? getFriendlyErrorMessage(error) : null}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onCreateDeliveryNote={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig} />

      {/* Detail Dialog */}
      <DeliveryNoteDetailDialog open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        deliveryNote={selectedNote}
        onConvertToInvoice={handleConvertToInvoice}
        convertingInvoice={convertingInvoice}
        onEdit={handleEdit} />

      <DeliveryNoteDialog open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        deliveryNote={editNote}
        onSave={handleSave}
        saving={saving} />
    </div>
  );
}

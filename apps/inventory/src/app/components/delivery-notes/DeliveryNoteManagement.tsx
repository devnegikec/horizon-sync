import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Table } from '@tanstack/react-table';
import {
  Truck,
  Plus,
  Download,
  RefreshCw,
  AlertTriangle,
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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [editNote, setEditNote] = useState<DeliveryNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [tableInstance, setTableInstance] = useState<Table<DeliveryNote> | null>(null);

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
        description: err instanceof Error ? err.message : 'Failed to load delivery note details',
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
        description: err instanceof Error ? err.message : 'Failed to save delivery note',
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
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg" onClick={handleCreate}>
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
        error={error ? (error as Error).message : null}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onCreateDeliveryNote={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig} />

      {/* Detail Dialog */}
      <DeliveryNoteDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        deliveryNote={selectedNote}
        onConvertToInvoice={(id) => console.log('Convert to invoice:', id)}
        onEdit={handleEdit} />

      <DeliveryNoteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        deliveryNote={editNote}
        onSave={handleSave}
        saving={saving} />
    </div>
  );
}

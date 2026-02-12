import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { type Table } from '@tanstack/react-table';
import { FileText, Plus, Download, RefreshCw, AlertTriangle, FilePlus, FileCheck, FileX } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Card, CardContent, DataTableViewOptions, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { cn } from '@horizon-sync/ui/lib';

import type { Quotation, QuotationCreate, QuotationResponse, QuotationUpdate } from '../../types/quotation.types';
import { quotationApi } from '../../utility/api';
import { StatCard } from '../shared';

import { QuotationDetailDialog } from './QuotationDetailDialog';
import { QuotationDialog } from './QuotationDialog';
import { QuotationsTable } from './QuotationsTable';

interface QuotationFilters {
  search: string;
  status: string;
}

export function QuotationManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = useState<QuotationFilters>({
    search: '',
    status: 'all',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<Quotation> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data, isLoading, error, refetch } = useQuery<QuotationResponse>({
    queryKey: ['quotations', page, pageSize, filters.status, filters.search],
    queryFn: () =>
      quotationApi.list(
        accessToken || '',
        page,
        pageSize,
        {
          status: filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined,
        },
      ) as Promise<QuotationResponse>,
    enabled: !!accessToken,
  });

  const quotations = data?.quotations ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const draft = quotations.filter((q) => q.status === 'draft').length;
    const sent = quotations.filter((q) => q.status === 'sent').length;
    const accepted = quotations.filter((q) => q.status === 'accepted').length;
    return { total, draft, sent, accepted };
  }, [quotations, pagination]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quotationApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Quotation deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete quotation',
        variant: 'destructive',
      });
    },
  });

  const handleView = React.useCallback((quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDetailDialogOpen(true);
  }, []);

  const handleCreate = () => {
    setEditQuotation(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = React.useCallback((quotation: Quotation) => {
    setEditQuotation(quotation);
    setDetailDialogOpen(false);
    setCreateDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback((quotation: Quotation) => {
    if (quotation.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft quotations can be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete quotation ${quotation.quotation_no}?`)) {
      deleteMutation.mutate(quotation.id);
    }
  }, [deleteMutation, toast]);

  const handleConvert = React.useCallback((quotation: Quotation) => {
    // TODO: Implement convert to sales order
    toast({
      title: 'Coming Soon',
      description: 'Convert to Sales Order functionality will be implemented next',
    });
  }, [toast]);

  const handleTableReady = (table: Table<Quotation>) => {
    setTableInstance(table);
  };

  const handleSave = async (data: QuotationCreate | QuotationUpdate, id?: string) => {
    if (!accessToken) return;
    
    try {
      if (id) {
        await quotationApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Quotation updated successfully' });
      } else {
        await quotationApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Quotation created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setCreateDialogOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save quotation',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: page - 1,
    pageSize: pageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    }
  }), [page, pageSize, pagination?.total_items]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground mt-1">Create and manage sales quotations</p>
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
            New Quotation
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Error loading quotations: {(error as Error).message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Quotations" 
          value={stats.total} 
          icon={FileText} 
          iconBg="bg-slate-100 dark:bg-slate-800" 
          iconColor="text-slate-600 dark:text-slate-400" 
        />
        <StatCard 
          title="Draft" 
          value={stats.draft} 
          icon={FilePlus} 
          iconBg="bg-amber-100 dark:bg-amber-900/20" 
          iconColor="text-amber-600 dark:text-amber-400" 
        />
        <StatCard 
          title="Sent" 
          value={stats.sent} 
          icon={FileCheck} 
          iconBg="bg-blue-100 dark:bg-blue-900/20" 
          iconColor="text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          title="Accepted" 
          value={stats.accepted} 
          icon={FileX} 
          iconBg="bg-emerald-100 dark:bg-emerald-900/20" 
          iconColor="text-emerald-600 dark:text-emerald-400" 
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput 
            className="sm:w-80"
            placeholder="Search by quotation #, customer..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))} 
          />
          <div className="flex gap-3">
            <Select value={filters.status} onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Quotations Table */}
      <QuotationsTable 
        quotations={quotations}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateQuotation={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig} 
      />

      {/* Detail Dialog */}
      <QuotationDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        quotation={selectedQuotation}
        onEdit={handleEdit}
        onConvert={handleConvert} 
      />

      {/* Create/Edit Dialog */}
      <QuotationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        quotation={editQuotation}
        onSave={handleSave}
        saving={false} 
      />
    </div>
  );
}

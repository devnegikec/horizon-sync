import * as React from 'react';

import {
  Package,
  Plus,
  Download,
  Upload,
  Loader2,
  ArrowRightLeft,
  FileText,
  ClipboardCheck,
  Boxes,
  AlertTriangle,
  Building2,
  ChevronsUpDown,
  Check,
  X,
} from 'lucide-react';

import { Button, DataTableViewOptions, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@horizon-sync/ui/components/ui/popover';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { cn } from '@horizon-sync/ui/lib';



import { useStockEntryMutations } from '../../hooks/useStock';
import { useStockLevels } from '../../hooks/useStockLevels';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useStockReconciliations } from '../../hooks/useStockReconciliations';
import { useAsnOrderManagement } from '../../hooks/useAsnOrderManagement';
import { useMyWarehouses } from '../../hooks/useMyWarehouses';
import { asnOrderApi } from '../../utility/api/asn-orders';
import type { AsnOrder } from '../../types/asn-order.types';
import type { PaginationInfo } from '../../types/quotation.types';
import { AsnOrdersTable } from '../advance stock notice/AsnOrdersTable';
import type {
  StockEntry,
  StockLevel,
  StockMovement,
  StockReconciliation,
  StockLevelStats,
  StockMovementStats,
  StockEntryStats,
  StockReconciliationStats,
} from '../../types/stock.types';
import { formatQuantity } from '../../utility';
import { stockEntryApi, stockLevelApi, stockMovementApi } from '../../utility/api/stock';
import { ReconciliationWizard, ReconciliationDetailDialog } from '../reconciliation';
import { useStockEntries } from '../stock-entry';


import { StockEntriesTable } from './StockEntriesTable';
import { StockEntryDialog } from './StockEntryDialog';
import { StockLevelsTable } from './StockLevelsTable';
import { StockMovementsTable } from './StockMovementsTable';
import { StockReconciliationsTable } from './StockReconciliationsTable';
import { StockFilters } from './stock.types';
import { useState } from 'react';
import { AsnOrderDialog } from '../advance stock notice/AsnOrderDialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ActiveTab = 'levels' | 'movements' | 'entries' | 'reconciliations' | 'asn';

interface StatDef {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_PAGINATION = { page: 1, pageSize: 20 };

/* ------------------------------------------------------------------ */
/*  Pure helper: build stats array per tab                             */
/* ------------------------------------------------------------------ */

function buildLevelsStats(s: StockLevelStats | null | undefined): StatDef[] {
  return [
    { title: 'Total Items', value: formatQuantity(s?.total_items || 0), icon: Boxes },
    { title: 'Total Warehouses', value: formatQuantity(s?.total_warehouses || 0), icon: Package },
    { title: 'Low Stock Items', value: formatQuantity(s?.low_stock_items || 0), icon: AlertTriangle },
    { title: 'Out of Stock', value: formatQuantity(s?.out_of_stock_items || 0), icon: AlertTriangle },
  ];
}

function buildMovementsStats(s: StockMovementStats | null | undefined): StatDef[] {
  return [
    { title: 'Total Movements', value: formatQuantity(s?.total_movements || 0), icon: ArrowRightLeft },
    { title: 'Stock In', value: formatQuantity(s?.stock_in || 0), icon: Package },
    { title: 'Stock Out', value: formatQuantity(s?.stock_out || 0), icon: Package },
    { title: 'Adjustments', value: formatQuantity(s?.adjustments || 0), icon: FileText },
  ];
}

function buildEntriesStats(s: StockEntryStats | null | undefined): StatDef[] {
  return [
    { title: 'Total Entries', value: formatQuantity(s?.total_entries || 0), icon: FileText },
    { title: 'Draft', value: formatQuantity(s?.draft_count || 0), icon: FileText },
    { title: 'Submitted', value: formatQuantity(s?.submitted_count || 0), icon: ClipboardCheck },
    { title: 'Total Value', value: formatQuantity(s?.total_value || 0), icon: Package },
  ];
}

function buildReconciliationsStats(s: StockReconciliationStats | null | undefined): StatDef[] {
  return [
    { title: 'Total Reconciliations', value: formatQuantity(s?.total_reconciliations || 0), icon: ClipboardCheck },
    { title: 'Pending', value: formatQuantity(s?.pending_count || 0), icon: AlertTriangle },
    { title: 'Completed', value: formatQuantity(s?.completed_count || 0), icon: ClipboardCheck },
    { title: 'Total Adjustments', value: formatQuantity(s?.total_adjustments || 0), icon: FileText },
  ];
}

/* ------------------------------------------------------------------ */
/*  Sub-component: StatCard                                            */
/* ------------------------------------------------------------------ */

const STAT_COLORS = [
  { bg: 'bg-slate-100 dark:bg-slate-800', fg: 'text-slate-600 dark:text-slate-400' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/20', fg: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-blue-100 dark:bg-blue-900/20', fg: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-amber-100 dark:bg-amber-900/20', fg: 'text-amber-600 dark:text-amber-400' },
] as const;

function StatCard({ stat, colorIndex }: { stat: StatDef; colorIndex: number }) {
  const Icon = stat.icon;
  const colors = STAT_COLORS[colorIndex] || STAT_COLORS[0];
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colors.bg)}>
            <Icon className={cn('h-6 w-6', colors.fg)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Stats grid                                          */
/* ------------------------------------------------------------------ */

function StatsGrid({ stats }: { stats: StatDef[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.title} stat={stat} colorIndex={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Page header with actions                            */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  onNewEntry: () => void;
  onAsN: () => void;
  onReconciliation: () => void;
  activeTab: ActiveTab;
  onImportSuccess?: () => void;
}

function StockManagementHeader({ onNewEntry, onAsN, onReconciliation, activeTab, onImportSuccess }: HeaderProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleExport = React.useCallback(async () => {
    if (!accessToken) return;

    setIsExporting(true);
    try {
      let headers: string[] = [];
      let rows: string[][] = [];
      let fileName = 'stock-export';

      if (activeTab === 'levels') {
        // Fetch all pages (backend max page_size is 100)
        const firstPage = await stockLevelApi.list(accessToken, 1, 100) as { stock_levels: StockLevel[]; pagination: { total_items: number; total_pages: number } };
        let allLevels: StockLevel[] = firstPage.stock_levels ?? [];
        const totalPages = firstPage.pagination?.total_pages ?? 1;
        for (let p = 2; p <= totalPages; p++) {
          const page = await stockLevelApi.list(accessToken, p, 100) as { stock_levels: StockLevel[] };
          allLevels = allLevels.concat(page.stock_levels ?? []);
        }

        headers = ['Item Code', 'Item Name', 'Warehouse', 'Qty On Hand', 'Qty Reserved', 'Qty Available', 'Last Counted'];
        rows = allLevels.map((r) => [
          r.product?.code ?? r.product_code ?? '',
          r.product?.name ?? r.product_name ?? '',
          r.warehouse?.name ?? r.warehouse_name ?? '',
          String(r.quantity_on_hand),
          String(r.quantity_reserved),
          String(r.quantity_available),
          r.last_counted_at ?? '',
        ]);
        fileName = 'stock-levels';
      } else if (activeTab === 'movements') {
        const firstPage = await stockMovementApi.list(accessToken, 1, 100) as { stock_movements: StockMovement[]; pagination: { total_pages: number } };
        let allMovements: StockMovement[] = firstPage.stock_movements ?? [];
        const totalPages = firstPage.pagination?.total_pages ?? 1;
        for (let p = 2; p <= totalPages; p++) {
          const page = await stockMovementApi.list(accessToken, p, 100) as { stock_movements: StockMovement[] };
          allMovements = allMovements.concat(page.stock_movements ?? []);
        }

        headers = ['Item Code', 'Item Name', 'Warehouse', 'Movement Type', 'Quantity', 'Unit Cost', 'Reference', 'Notes', 'Performed At'];
        rows = allMovements.map((r) => [
          r.product?.code ?? r.product_code ?? '',
          r.product?.name ?? r.product_name ?? '',
          r.warehouse?.name ?? r.warehouse_name ?? '',
          r.movement_type,
          String(r.quantity),
          r.unit_cost != null ? String(r.unit_cost) : '',
          r.reference_type ? `${r.reference_type}:${r.reference_id ?? ''}` : '',
          r.notes ?? '',
          r.performed_at,
        ]);
        fileName = 'stock-movements';
      } else if (activeTab === 'entries') {
        const firstPage = await stockEntryApi.list(accessToken, 1, 100) as { stock_entries: StockEntry[]; pagination: { total_pages: number } };
        let allEntries: StockEntry[] = firstPage.stock_entries ?? [];
        const totalPages = firstPage.pagination?.total_pages ?? 1;
        for (let p = 2; p <= totalPages; p++) {
          const page = await stockEntryApi.list(accessToken, p, 100) as { stock_entries: StockEntry[] };
          allEntries = allEntries.concat(page.stock_entries ?? []);
        }

        headers = ['Entry No', 'Entry Type', 'Status', 'From Warehouse', 'To Warehouse', 'Posting Date', 'Total Value', 'Created At'];
        rows = allEntries.map((r) => [
          r.stock_entry_no ?? '',
          r.stock_entry_type ?? '',
          r.status ?? '',
          r.from_warehouse?.name ?? r.from_warehouse_name ?? '',
          r.to_warehouse?.name ?? r.to_warehouse_name ?? '',
          r.posting_date ?? '',
          r.total_value != null ? String(r.total_value) : '',
          r.created_at ?? '',
        ]);
        fileName = 'stock-entries';
      } else {
        return;
      }

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [accessToken, activeTab]);

  const exportLabel = activeTab === 'levels' ? 'Export Stock Levels'
    : activeTab === 'movements' ? 'Export Movements'
      : activeTab === 'entries' ? 'Export Entries'
        : null;

  const handleDownloadTemplate = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const { buildUrl } = await import('../../utility/api/core');
      const url = buildUrl('/stock-entries/bulk/template/csv');
      const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error('Failed to download template');
      const blob = await response.blob();
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = 'stock_entries_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(dlUrl);
    } catch {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { title: 'Error', description: 'Failed to download template', variant: 'destructive' }
      }));
    }
  }, [accessToken]);

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleImportSubmit = React.useCallback(async () => {
    if (!selectedFile || !accessToken) return;

    setIsImporting(true);
    try {
      const { buildUrl } = await import('../../utility/api/core');
      const url = buildUrl('/stock-entries/bulk/upload');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Import failed with status ${response.status}`);
      }

      const result = await response.json() as Record<string, unknown>;
      const createdCount = Number(result?.created ?? 0);
      const failedCount = Number(result?.failed ?? 0);
      const totalRows = Number(result?.total_rows ?? 0);

      setIsImportDialogOpen(false);
      setSelectedFile(null);

      setTimeout(() => {
        const message = `${createdCount} of ${totalRows} stock entries created as draft${failedCount > 0 ? `. ${failedCount} failed.` : '.'}`;
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { title: '✅ Import Successful', description: message }
        }));
      }, 100);

      if (onImportSuccess) {
        setTimeout(() => onImportSuccess(), 1000);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to import stock entries';
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { title: 'Import Failed', description: msg, variant: 'destructive' }
      }));
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, accessToken, onImportSuccess]);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor stock levels, movements, and maintain accurate records
          </p>
        </div>
        <div className="flex items-center gap-3">
          {exportLabel && (
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {exportLabel}
                </>
              )}
            </Button>
          )}
          {activeTab === 'entries' && (
            <Button variant="outline" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 text-primary-foreground shadow-lg">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onNewEntry}>
                <FileText className="mr-2 h-4 w-4" />
                Stock Entry
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onAsN}>
                <FileText className="mr-2 h-4 w-4" />
                Advance Stock Notice
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onReconciliation}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Reconciliation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stock Entry Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) setSelectedFile(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Stock Entries</DialogTitle>
            <DialogDescription>
              Upload a CSV or XLSX file to bulk create stock entries. Entries are created as draft.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between rounded-md border border-dashed p-3 bg-muted/40">
              <div className="text-sm">
                <p className="font-medium">Need a template?</p>
                <p className="text-muted-foreground">Download the template with required columns.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="shrink-0 ml-4 gap-1.5">
                <Download className="h-4 w-4" />
                Template CSV
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="stock-file-upload" className="text-sm font-medium">Select File</label>
              {!selectedFile ? (
                <label
                  htmlFor="stock-file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-primary">Click to select file</span>
                  <span className="text-xs text-muted-foreground mt-1">CSV or Excel (.csv, .xlsx)</span>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <Upload className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)} disabled={isImporting}>
                    Change
                  </Button>
                </div>
              )}
              <input id="stock-file-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} disabled={isImporting} className="hidden" />
            </div>

            {isImporting && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Uploading and processing...</p>
                  <p className="text-muted-foreground">This may take a moment depending on file size.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportDialogOpen(false); setSelectedFile(null); }} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} disabled={!selectedFile || isImporting}>
              {isImporting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>) : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Tab content panels                                  */
/* ------------------------------------------------------------------ */

interface AsnOrderManagementData {
  asnOrders: AsnOrder[];
  pagination?: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  recentlyCreatedId?: string | null;
}

interface TabPanelsProps {
  levelsData: ReturnType<typeof useStockLevels>;
  levelsFilters: { page: number; pageSize: number };
  onLevelsPagination: (pageIndex: number, pageSize: number) => void;
  movementsData: ReturnType<typeof useStockMovements>;
  movementsFilters: { page: number; pageSize: number };
  onMovementsPagination: (pageIndex: number, pageSize: number) => void;
  entriesData: ReturnType<typeof useStockEntries>;
  entriesFilters: { page: number; pageSize: number };
  onEntriesPagination: (pageIndex: number, pageSize: number) => void;
  reconciliationsData: ReturnType<typeof useStockReconciliations>;
  reconciliationsFilters: { page: number; pageSize: number };
  onReconciliationsPagination: (pageIndex: number, pageSize: number) => void;
  asnData: AsnOrderManagementData;
  asnPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
  onViewEntry?: (entry: StockEntry) => void;
  onEditEntry?: (entry: StockEntry) => void;
  onDeleteEntry?: (entry: StockEntry) => void;
  onViewReconciliation?: (reconciliation: StockReconciliation) => void;
  onViewAsn?: (order: AsnOrder) => void;
  onEditAsn?: (order: AsnOrder) => void;
  onDeleteAsn?: (order: AsnOrder) => void;
  onCreateAsn?: () => void;
}

function TabPanels({
  levelsData,
  levelsFilters,
  onLevelsPagination,
  movementsData,
  movementsFilters,
  onMovementsPagination,
  entriesData,
  entriesFilters,
  onEntriesPagination,
  reconciliationsData,
  reconciliationsFilters,
  onReconciliationsPagination,
  asnData,
  asnPagination,
  onViewEntry,
  onEditEntry,
  onDeleteEntry,
  onViewReconciliation,
  onViewAsn,
  onEditAsn,
  onDeleteAsn,
  onCreateAsn,
}: TabPanelsProps) {
  return (
    <>
      <TabsContent value="levels" className="mt-4">
        <StockLevelsTable stockLevels={levelsData.data}
          loading={levelsData.loading}
          error={levelsData.error}
          hasActiveFilters={false}
          serverPagination={{
            pageIndex: levelsFilters.page - 1,
            pageSize: levelsFilters.pageSize,
            totalItems: levelsData.pagination?.total_items || 0,
            onPaginationChange: onLevelsPagination,
          }} />
      </TabsContent>
      <TabsContent value="movements" className="mt-4">
        <StockMovementsTable stockMovements={movementsData.data}
          loading={movementsData.loading}
          error={movementsData.error}
          hasActiveFilters={false}
          serverPagination={{
            pageIndex: movementsFilters.page - 1,
            pageSize: movementsFilters.pageSize,
            totalItems: movementsData.pagination?.total_items || 0,
            onPaginationChange: onMovementsPagination,
          }} />
      </TabsContent>
      <TabsContent value="entries" className="mt-4">
        <StockEntriesTable stockEntries={entriesData.data}
          loading={entriesData.loading}
          error={entriesData.error}
          hasActiveFilters={false}
          onView={onViewEntry}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
          serverPagination={{
            pageIndex: entriesFilters.page - 1,
            pageSize: entriesFilters.pageSize,
            totalItems: entriesData.pagination?.total_items || 0,
            onPaginationChange: onEntriesPagination,
          }} />
      </TabsContent>
      <TabsContent value="reconciliations" className="mt-4">
        <StockReconciliationsTable stockReconciliations={reconciliationsData.data}
          loading={reconciliationsData.loading}
          error={reconciliationsData.error}
          hasActiveFilters={false}
          onView={onViewReconciliation}
          serverPagination={{
            pageIndex: reconciliationsFilters.page - 1,
            pageSize: reconciliationsFilters.pageSize,
            totalItems: reconciliationsData.pagination?.total_items || 0,
            onPaginationChange: onReconciliationsPagination,
          }} />
      </TabsContent>
      <TabsContent value="asn" className="mt-4">
        <AsnOrdersTable
          asnOrders={asnData.asnOrders}
          loading={asnData.loading}
          error={asnData.error}
          hasActiveFilters={false}
          onView={onViewAsn}
          onEdit={onEditAsn}
          onDelete={onDeleteAsn}
          onCreateOrder={onCreateAsn}
          serverPagination={asnPagination}
          recentlyCreatedId={asnData.recentlyCreatedId}
        />
      </TabsContent>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook: stock entry actions (view / edit / delete)                   */
/* ------------------------------------------------------------------ */

function useStockEntryActions(refetch: () => void) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { deleteEntry } = useStockEntryMutations();
  const [selectedEntry, setSelectedEntry] = React.useState<StockEntry | null>(null);
  const [fetchingEntry, setFetchingEntry] = React.useState(false);

  const fetchFullEntry = React.useCallback(
    async (id: string): Promise<StockEntry | null> => {
      if (!accessToken) return null;
      setFetchingEntry(true);
      try {
        return (await stockEntryApi.get(accessToken, id)) as StockEntry;
      } catch {
        return null;
      } finally {
        setFetchingEntry(false);
      }
    },
    [accessToken],
  );

  const handleView = React.useCallback(
    async (entry: StockEntry) => {
      const full = await fetchFullEntry(entry.id);
      if (full) setSelectedEntry(full);
    },
    [fetchFullEntry],
  );

  const handleEdit = React.useCallback(
    async (entry: StockEntry) => {
      const full = await fetchFullEntry(entry.id);
      if (full) setSelectedEntry(full);
    },
    [fetchFullEntry],
  );

  const [confirmDeleteEntry, setConfirmDeleteEntry] = React.useState<StockEntry | null>(null);

  const handleDelete = React.useCallback(
    (entry: StockEntry) => {
      setConfirmDeleteEntry(entry);
    },
    [],
  );

  const executeDeleteEntry = React.useCallback(
    async () => {
      if (!confirmDeleteEntry) return;
      try {
        await deleteEntry(confirmDeleteEntry.id);
        refetch();
      } catch {
        /* error handled by hook */
      }
      setConfirmDeleteEntry(null);
    },
    [confirmDeleteEntry, deleteEntry, refetch],
  );

  const clearSelected = React.useCallback(() => setSelectedEntry(null), []);

  return { selectedEntry, fetchingEntry, handleView, handleEdit, handleDelete, clearSelected, confirmDeleteEntry, setConfirmDeleteEntry, executeDeleteEntry };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function StockManagement({ warehouseId }: { warehouseId?: string }) {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('levels');
  const [stockEntryDialogOpen, setStockEntryDialogOpen] = React.useState(false);
  const [stockEntryViewMode, setStockEntryViewMode] = React.useState(false);
  const [asnOrderDialogOpen, setAsnOrderDialogOpen] = React.useState(false);
  const [asnViewMode, setAsnViewMode] = React.useState(false);
  const [selectedAsnOrder, setSelectedAsnOrder] = React.useState<AsnOrder | null>(null);
  const [confirmDeleteAsnOrder, setConfirmDeleteAsnOrder] = React.useState<AsnOrder | null>(null);
  const [reconciliationOpen, setReconciliationOpen] = React.useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = React.useState<StockReconciliation | null>(null);
  const [reconciliationDetailOpen, setReconciliationDetailOpen] = React.useState(false);

  const [levelsFilters, setLevelsFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [movementsFilters, setMovementsFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [entriesFilters, setEntriesFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [reconciliationsFilters, setReconciliationsFilters] = React.useState({ ...DEFAULT_PAGINATION });

  /* ---------- global filters ---------- */
  const [filters, setFilters] = useState<StockFilters>({
    search: '',
    warehouseId: '',
    status: 'all',
  });
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  // When a warehouse is selected from the top-level WMS switcher, the filter is
  // locked to that warehouse. Derive the effective value directly from the prop
  // so the first fetch already uses the locked warehouse (no "all warehouses"
  // flash followed by a re-fetch).
  const isWarehouseLocked = Boolean(warehouseId);
  const effectiveWarehouseId = isWarehouseLocked ? (warehouseId ?? '') : filters.warehouseId;

  const asnManagement = useAsnOrderManagement();
  const setAsnFilters = asnManagement.setFilters;
  const asnRefetch = asnManagement.refetch;

  // Reset pagination on any filter change (SearchInput already debounces onSearch internally)
  React.useEffect(() => {
    const reset = { ...DEFAULT_PAGINATION };
    setLevelsFilters(reset);
    setMovementsFilters(reset);
    setEntriesFilters(reset);
    setReconciliationsFilters(reset);
  }, [effectiveWarehouseId, filters.status, filters.search]);

  /* ---------- data hooks with filters ---------- */
  const levelsData = useStockLevels({
    page: levelsFilters.page,
    pageSize: levelsFilters.pageSize,
    filters: {
      warehouse_id: effectiveWarehouseId,
      search: filters.search,
    },
  });
  const movementsData = useStockMovements({
    page: movementsFilters.page,
    pageSize: movementsFilters.pageSize,
    filters: {
      warehouse_id: effectiveWarehouseId,
      search: filters.search,
    },
  });
  const entriesData = useStockEntries({
    page: entriesFilters.page,
    pageSize: entriesFilters.pageSize,
    filters: {
      warehouse_id: effectiveWarehouseId,
      status: filters.status,
      search: filters.search,
    },
  });
  const reconciliationsData = useStockReconciliations({
    page: reconciliationsFilters.page,
    pageSize: reconciliationsFilters.pageSize,
    filters: {
      warehouse_id: effectiveWarehouseId,
      status: filters.status,
      search: filters.search,
    },
  });

  const entryActions = useStockEntryActions(entriesData.refetch);
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();

  /* ---------- warehouse selector ---------- */
  const { warehouses: allWarehouses, loading: warehousesLoading } = useMyWarehouses();
  const filteredWarehouses = React.useMemo(() => {
    const base = isWarehouseLocked
      ? allWarehouses.filter((w) => w.id === warehouseId)
      : allWarehouses;
    if (!warehouseSearch) return base;
    const q = warehouseSearch.toLowerCase();
    return base.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.code?.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q),
    );
  }, [allWarehouses, warehouseSearch, isWarehouseLocked, warehouseId]);
  const selectedWarehouse = allWarehouses.find((w) => w.id === effectiveWarehouseId);

  // Sync global filters → ASN management
  React.useEffect(() => {
    setAsnFilters({
      search: filters.search,
      status: filters.status,
      warehouse_id: effectiveWarehouseId,
    });
  }, [filters.search, filters.status, effectiveWarehouseId, setAsnFilters]);

  /* ---------- status options per tab ---------- */
  const statusOptions = React.useMemo(() => {
    if (activeTab === 'entries') {
      return [
        { value: 'all', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }
    if (activeTab === 'reconciliations') {
      return [
        { value: 'all', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }
    if (activeTab === 'asn') {
      return [
        { value: 'all', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'partially_delivered', label: 'Partially Delivered' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'closed', label: 'Closed' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }
    return [];
  }, [activeTab]);

  const handleTabChange = React.useCallback((newTab: string) => {
    setActiveTab(newTab as ActiveTab);
    setFilters((prev) => ({ ...prev, status: 'all' }));
    const reset = { ...DEFAULT_PAGINATION };
    const setters: Record<string, React.Dispatch<React.SetStateAction<typeof DEFAULT_PAGINATION>>> = {
      levels: setLevelsFilters,
      movements: setMovementsFilters,
      entries: setEntriesFilters,
      reconciliations: setReconciliationsFilters,
    };
    setters[newTab]?.(reset);
  }, [setFilters]);

  const makePaginationHandler = React.useCallback(
    (setter: React.Dispatch<React.SetStateAction<typeof DEFAULT_PAGINATION>>) =>
      (pageIndex: number, pageSize: number) => setter({ page: pageIndex + 1, pageSize }),
    [],
  );

  const activeStats = React.useMemo(() => {
    if (activeTab === 'levels') return buildLevelsStats(levelsData.stats);
    if (activeTab === 'movements') return buildMovementsStats(movementsData.stats);
    if (activeTab === 'entries') return buildEntriesStats(entriesData.stats);
    return buildReconciliationsStats(reconciliationsData.stats);
  }, [activeTab, levelsData.stats, movementsData.stats, entriesData.stats, reconciliationsData.stats]);

  const handleNewEntry = React.useCallback(() => {
    entryActions.clearSelected();
    setStockEntryViewMode(false);
    setStockEntryDialogOpen(true);
  }, [entryActions]);

  const handleNewAsN = React.useCallback(() => {
    entryActions.clearSelected();
    setSelectedAsnOrder(null);
    setAsnViewMode(false);
    setAsnOrderDialogOpen(true);
  }, [entryActions]);

  const handleAsnDialogClose = React.useCallback(() => {
    setAsnOrderDialogOpen(false);
    setSelectedAsnOrder(null);
    setActiveTab('asn');
    asnRefetch();
  }, [asnRefetch, setActiveTab]);

  const handleViewAsn = React.useCallback(
    async (order: AsnOrder) => {
      try {
        const fullOrder = await asnOrderApi.get(accessToken || '', order.id) as AsnOrder;
        setSelectedAsnOrder(fullOrder);
        setAsnViewMode(true);
        setAsnOrderDialogOpen(true);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load ASN order details',
          variant: 'destructive',
        });
      }
    },
    [accessToken, toast],
  );

  const handleEditAsn = React.useCallback(
    async (order: AsnOrder) => {
      try {
        const fullOrder = await asnOrderApi.get(accessToken || '', order.id) as AsnOrder;
        setSelectedAsnOrder(fullOrder);
        setAsnViewMode(false);
        setAsnOrderDialogOpen(true);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load ASN order details',
          variant: 'destructive',
        });
      }
    },
    [accessToken, toast],
  );

  const handleDeleteAsn = React.useCallback(
    (order: AsnOrder) => {
      setConfirmDeleteAsnOrder(order);
    },
    [],
  );

  const executeDeleteAsn = React.useCallback(
    async () => {
      if (!confirmDeleteAsnOrder) return;
      try {
        await asnManagement.deleteMutation.mutateAsync(confirmDeleteAsnOrder.id);
        asnManagement.refetch();
      } catch {
        /* error handled by mutation */
      }
      setConfirmDeleteAsnOrder(null);
    },
    [confirmDeleteAsnOrder, asnManagement.deleteMutation, asnManagement.refetch],
  );

  const handleNewReconciliation = React.useCallback(() => {
    setReconciliationOpen(true);
  }, []);

  const handleView = React.useCallback(
    async (entry: StockEntry) => {
      await entryActions.handleView(entry);
      setStockEntryViewMode(true);
      setStockEntryDialogOpen(true);
    },
    [entryActions],
  );

  const handleEdit = React.useCallback(
    async (entry: StockEntry) => {
      await entryActions.handleEdit(entry);
      setStockEntryViewMode(false);
      setStockEntryDialogOpen(true);
    },
    [entryActions],
  );

  const handleViewReconciliation = React.useCallback(
    (reconciliation: StockReconciliation) => {
      setSelectedReconciliation(reconciliation);
      setReconciliationDetailOpen(true);
    },
    [],
  );

  const handleDialogClose = React.useCallback(() => {
    setStockEntryDialogOpen(false);
    entryActions.clearSelected();
    setActiveTab('entries');
    entriesData.refetch();
    levelsData.refetch();
    movementsData.refetch();
  }, [entryActions, entriesData, levelsData, movementsData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StockManagementHeader
        onNewEntry={handleNewEntry}
        onAsN={handleNewAsN}
        onReconciliation={handleNewReconciliation}
        activeTab={activeTab}
        onImportSuccess={entriesData.refetch}
      />
      <StatsGrid stats={activeStats} />
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            className="sm:w-80"
            placeholder={
              activeTab === 'levels'
                ? 'Search by item name or code...'
                : activeTab === 'movements'
                  ? 'Search by item name, code, notes...'
                  : activeTab === 'entries'
                    ? 'Search by entry no, remarks...'
                    : activeTab === 'reconciliations'
                      ? 'Search by reconciliation no...'
                      : 'Search by ASN order no...'
            }
            value={filters.search}
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          />
          {/* Warehouse selector */}
          <Popover open={warehouseOpen} onOpenChange={setWarehouseOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={warehouseOpen}
                className="w-[220px] justify-between"
                disabled={isWarehouseLocked}
              >
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {selectedWarehouse ? selectedWarehouse.name : 'All Warehouses'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0">
              <div className="p-2">
                {!isWarehouseLocked && (
                  <Input
                    placeholder="Search warehouses..."
                    value={warehouseSearch}
                    onChange={(e) => setWarehouseSearch(e.target.value)}
                    className="mb-2"
                  />
                )}
                <div className="max-h-60 overflow-auto space-y-1">
                  {!isWarehouseLocked && (
                    <button
                      className="w-full text-left px-2 py-1.5 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, warehouseId: '' }));
                        setWarehouseOpen(false);
                      }}
                    >
                      <span className="h-4 w-4 flex items-center justify-center">
                        {!filters.warehouseId && <Check className="h-4 w-4" />}
                      </span>
                      All Warehouses
                    </button>
                  )}
                  {warehousesLoading && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Loading...</div>
                  )}
                  {filteredWarehouses.map((w) => (
                    <button
                      key={w.id}
                      className="w-full text-left px-2 py-1.5 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, warehouseId: w.id }));
                        setWarehouseOpen(false);
                      }}
                    >
                      <span className="h-4 w-4 flex items-center justify-center">
                        {filters.warehouseId === w.id && <Check className="h-4 w-4" />}
                      </span>
                      <span className="truncate">{w.name}</span>
                    </button>
                  ))}
                  {!warehousesLoading && filteredWarehouses.length === 0 && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">No warehouses found</div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Status — shown only on tabs that support it */}
          {statusOptions.length > 0 && (
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear all filters */}
          {(filters.search || (!isWarehouseLocked && filters.warehouseId) || filters.status !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({
                  search: '',
                  warehouseId: isWarehouseLocked ? (warehouseId ?? '') : '',
                  status: 'all',
                })
              }
              className="gap-1 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="levels" className="gap-1.5">
            Stock Levels
            {activeTab === 'levels' && levelsData.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-1.5">
            Movements
            {activeTab === 'movements' && movementsData.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="entries" className="gap-1.5">
            Stock Entries
            {activeTab === 'entries' && entriesData.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="reconciliations" className="gap-1.5">
            Reconciliations
            {activeTab === 'reconciliations' && reconciliationsData.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="asn" className="gap-1.5">
            Advance Stock Notice
            {activeTab === 'asn' && asnManagement.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </TabsTrigger>
        </TabsList>
        <TabPanels levelsData={levelsData}
          levelsFilters={levelsFilters}
          onLevelsPagination={makePaginationHandler(setLevelsFilters)}
          movementsData={movementsData}
          movementsFilters={movementsFilters}
          onMovementsPagination={makePaginationHandler(setMovementsFilters)}
          entriesData={entriesData}
          entriesFilters={entriesFilters}
          onEntriesPagination={makePaginationHandler(setEntriesFilters)}
          reconciliationsData={reconciliationsData}
          reconciliationsFilters={reconciliationsFilters}
          onReconciliationsPagination={makePaginationHandler(setReconciliationsFilters)}
          asnData={{
            asnOrders: asnManagement.asnOrders,
            pagination: asnManagement.pagination,
            loading: asnManagement.loading,
            error: asnManagement.error,
            refetch: asnManagement.refetch,
            recentlyCreatedId: asnManagement.recentlyCreatedId,
          }}
          asnPagination={asnManagement.serverPaginationConfig}
          onViewEntry={handleView}
          onEditEntry={handleEdit}
          onDeleteEntry={entryActions.handleDelete}
          onViewReconciliation={handleViewReconciliation}
          onViewAsn={handleViewAsn}
          onEditAsn={handleEditAsn}
          onDeleteAsn={handleDeleteAsn}
          onCreateAsn={handleNewAsN} />
      </Tabs>


      <StockEntryDialog open={stockEntryDialogOpen}
        onOpenChange={setStockEntryDialogOpen}
        entry={entryActions.selectedEntry}
        viewMode={stockEntryViewMode}
        onCreated={handleDialogClose}
        onUpdated={handleDialogClose} />

      <AsnOrderDialog open={asnOrderDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleAsnDialogClose();
          else setAsnOrderDialogOpen(true);
        }}
        viewMode={asnViewMode}
        onSave={asnManagement.handleSave}
        saving={asnManagement.saving}
        asnOrder={selectedAsnOrder} />

      <ReconciliationWizard open={reconciliationOpen}
        onOpenChange={setReconciliationOpen}
        onCompleted={reconciliationsData.refetch} />

      <ReconciliationDetailDialog open={reconciliationDetailOpen}
        onOpenChange={setReconciliationDetailOpen}
        reconciliation={selectedReconciliation} />

      {/* Delete Stock Entry Confirmation Dialog */}
      <ConfirmationDialog
        open={!!entryActions.confirmDeleteEntry}
        onOpenChange={(open) => { if (!open) entryActions.setConfirmDeleteEntry(null); }}
        title="Delete Stock Entry"
        description={`Delete stock entry "${entryActions.confirmDeleteEntry?.stock_entry_no}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={entryActions.executeDeleteEntry}
      />

      {/* Delete ASN Order Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmDeleteAsnOrder}
        onOpenChange={(open) => { if (!open) setConfirmDeleteAsnOrder(null); }}
        title="Delete ASN Order"
        description={`Delete ASN order "${confirmDeleteAsnOrder?.asn_order_no}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDeleteAsn}
      />
    </div>
  );
}

import * as React from 'react';

import {
  Package,
  Plus,
  Download,
  ArrowRightLeft,
  FileText,
  ClipboardCheck,
  Boxes,
  AlertTriangle,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import { cn } from '@horizon-sync/ui/lib';

 

import { useStockEntryMutations } from '../../hooks/useStock';
import { useStockLevels } from '../../hooks/useStockLevels';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useStockReconciliations } from '../../hooks/useStockReconciliations';
import type {
  StockEntry,
  StockReconciliation,
  StockLevelStats,
  StockMovementStats,
  StockEntryStats,
  StockReconciliationStats,
} from '../../types/stock.types';
import { formatQuantity } from '../../utility';
import { stockEntryApi } from '../../utility/api/stock';
import { ReconciliationWizard, ReconciliationDetailDialog } from '../reconciliation';
import { useStockEntries } from '../stock-entry';


import { StockEntriesTable } from './StockEntriesTable';
import { StockEntryDialog } from './StockEntryDialog';
import { StockLevelsTable } from './StockLevelsTable';
import { StockMovementsTable } from './StockMovementsTable';
import { StockReconciliationsTable } from './StockReconciliationsTable';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ActiveTab = 'levels' | 'movements' | 'entries' | 'reconciliations';

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
  onReconciliation: () => void;
}

function StockManagementHeader({ onNewEntry, onReconciliation }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor stock levels, movements, and maintain accurate records
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
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
            <DropdownMenuItem onSelect={onReconciliation}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Reconciliation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Tab content panels                                  */
/* ------------------------------------------------------------------ */

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
  onViewEntry?: (entry: StockEntry) => void;
  onEditEntry?: (entry: StockEntry) => void;
  onDeleteEntry?: (entry: StockEntry) => void;
  onViewReconciliation?: (reconciliation: StockReconciliation) => void;
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
  onViewEntry,
  onEditEntry,
  onDeleteEntry,
  onViewReconciliation,
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

  const handleDelete = React.useCallback(
    async (entry: StockEntry) => {
      if (!window.confirm(`Delete stock entry "${entry.stock_entry_no}"?`)) return;
      try {
        await deleteEntry(entry.id);
        refetch();
      } catch {
        /* error handled by hook */
      }
    },
    [deleteEntry, refetch],
  );

  const clearSelected = React.useCallback(() => setSelectedEntry(null), []);

  return { selectedEntry, fetchingEntry, handleView, handleEdit, handleDelete, clearSelected };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function StockManagement() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('levels');
  const [stockEntryDialogOpen, setStockEntryDialogOpen] = React.useState(false);
  const [reconciliationOpen, setReconciliationOpen] = React.useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = React.useState<StockReconciliation | null>(null);
  const [reconciliationDetailOpen, setReconciliationDetailOpen] = React.useState(false);

  const [levelsFilters, setLevelsFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [movementsFilters, setMovementsFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [entriesFilters, setEntriesFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [reconciliationsFilters, setReconciliationsFilters] = React.useState({ ...DEFAULT_PAGINATION });

  const levelsData = useStockLevels({ page: levelsFilters.page, pageSize: levelsFilters.pageSize });
  const movementsData = useStockMovements({ page: movementsFilters.page, pageSize: movementsFilters.pageSize });
  const entriesData = useStockEntries({ page: entriesFilters.page, pageSize: entriesFilters.pageSize });
  const reconciliationsData = useStockReconciliations({ page: reconciliationsFilters.page, pageSize: reconciliationsFilters.pageSize });

  const entryActions = useStockEntryActions(entriesData.refetch);

  const handleTabChange = React.useCallback((newTab: string) => {
    setActiveTab(newTab as ActiveTab);
    const reset = { ...DEFAULT_PAGINATION };
    const setters: Record<string, React.Dispatch<React.SetStateAction<typeof DEFAULT_PAGINATION>>> = {
      levels: setLevelsFilters,
      movements: setMovementsFilters,
      entries: setEntriesFilters,
      reconciliations: setReconciliationsFilters,
    };
    setters[newTab]?.(reset);
  }, []);

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
    setStockEntryDialogOpen(true);
  }, [entryActions]);

  const handleNewReconciliation = React.useCallback(() => {
    setReconciliationOpen(true);
  }, []);

  const handleViewOrEdit = React.useCallback(
    async (entry: StockEntry) => {
      await entryActions.handleView(entry);
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
    entriesData.refetch();
  }, [entryActions, entriesData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StockManagementHeader onNewEntry={handleNewEntry} onReconciliation={handleNewReconciliation}/>
      <StatsGrid stats={activeStats} />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="levels">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="entries">Stock Entries</TabsTrigger>
          <TabsTrigger value="reconciliations">Reconciliations</TabsTrigger>
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
          onViewEntry={handleViewOrEdit}
          onEditEntry={handleViewOrEdit}
          onDeleteEntry={entryActions.handleDelete}
          onViewReconciliation={handleViewReconciliation} />
      </Tabs>

      <StockEntryDialog open={stockEntryDialogOpen}
        onOpenChange={setStockEntryDialogOpen}
        entry={entryActions.selectedEntry}
        onCreated={handleDialogClose}
        onUpdated={handleDialogClose} />

      <ReconciliationWizard open={reconciliationOpen}
        onOpenChange={setReconciliationOpen}
        onCompleted={reconciliationsData.refetch} />

      <ReconciliationDetailDialog open={reconciliationDetailOpen}
        onOpenChange={setReconciliationDetailOpen}
        reconciliation={selectedReconciliation} />
    </div>
  );
}

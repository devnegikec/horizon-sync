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

import { useStockEntries } from '../../hooks/useStockEntries';
import { useStockLevels } from '../../hooks/useStockLevels';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useStockReconciliations } from '../../hooks/useStockReconciliations';
import { formatQuantity } from '../../utility';
import type {
  StockLevelStats,
  StockMovementStats,
  StockEntryStats,
  StockReconciliationStats,
} from '../../types/stock.types';

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
}

function StockManagementHeader({ onNewEntry }: HeaderProps) {
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
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Record Movement
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onNewEntry}>
              <FileText className="mr-2 h-4 w-4" />
              Stock Entry
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
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function StockManagement() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('levels');
  const [stockEntryDialogOpen, setStockEntryDialogOpen] = React.useState(false);

  const [levelsFilters, setLevelsFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [movementsFilters, setMovementsFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [entriesFilters, setEntriesFilters] = React.useState({ ...DEFAULT_PAGINATION });
  const [reconciliationsFilters, setReconciliationsFilters] = React.useState({ ...DEFAULT_PAGINATION });

  const levelsData = useStockLevels({ page: levelsFilters.page, pageSize: levelsFilters.pageSize });
  const movementsData = useStockMovements({ page: movementsFilters.page, pageSize: movementsFilters.pageSize });
  const entriesData = useStockEntries({ page: entriesFilters.page, pageSize: entriesFilters.pageSize });
  const reconciliationsData = useStockReconciliations({ page: reconciliationsFilters.page, pageSize: reconciliationsFilters.pageSize });

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

  const handleDialogClose = React.useCallback(() => {
    setStockEntryDialogOpen(false);
    entriesData.refetch();
  }, [entriesData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StockManagementHeader onNewEntry={() => setStockEntryDialogOpen(true)} />
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
          onReconciliationsPagination={makePaginationHandler(setReconciliationsFilters)} />
      </Tabs>

      <StockEntryDialog open={stockEntryDialogOpen}
        onOpenChange={setStockEntryDialogOpen}
        onCreated={handleDialogClose}
        onUpdated={handleDialogClose} />
    </div>
  );
}

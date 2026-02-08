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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import { cn } from '@horizon-sync/ui/lib';

import { useStockEntries } from '../../hooks/useStockEntries';
import { useStockLevels } from '../../hooks/useStockLevels';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useStockReconciliations } from '../../hooks/useStockReconciliations';
import { formatQuantity } from '../../utility';

import { StockEntriesTable } from './StockEntriesTable';
import { StockEntryDialog } from './StockEntryDialog';
import { StockLevelsTable } from './StockLevelsTable';
import { StockMovementsTable } from './StockMovementsTable';
import { StockReconciliationsTable } from './StockReconciliationsTable';

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

type ActiveTab = 'levels' | 'movements' | 'entries' | 'reconciliations';

export function StockManagement() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('levels');
  const [stockEntryDialogOpen, setStockEntryDialogOpen] = React.useState(false);

  // Separate filter state for each tab
  const [levelsFilters, setLevelsFilters] = React.useState({
    page: 1,
    pageSize: 20,
  });

  const [movementsFilters, setMovementsFilters] = React.useState({
    page: 1,
    pageSize: 20,
  });

  const [entriesFilters, setEntriesFilters] = React.useState({
    page: 1,
    pageSize: 20,
  });

  const [reconciliationsFilters, setReconciliationsFilters] = React.useState({
    page: 1,
    pageSize: 20,
  });

  // Fetch data for each tab using the new hooks
  const {
    data: stockLevels,
    stats: levelsStats,
    loading: levelsLoading,
    error: levelsError,
    pagination: levelsPagination,
  } = useStockLevels({ page: levelsFilters.page, pageSize: levelsFilters.pageSize });

  const {
    data: stockMovements,
    stats: movementsStats,
    loading: movementsLoading,
    error: movementsError,
    pagination: movementsPagination,
  } = useStockMovements({ page: movementsFilters.page, pageSize: movementsFilters.pageSize });

  const {
    data: stockEntries,
    stats: entriesStats,
    loading: entriesLoading,
    error: entriesError,
    pagination: entriesPagination,
    refetch: refetchEntries,
  } = useStockEntries({ page: entriesFilters.page, pageSize: entriesFilters.pageSize });

  const {
    data: stockReconciliations,
    stats: reconciliationsStats,
    loading: reconciliationsLoading,
    error: reconciliationsError,
    pagination: reconciliationsPagination,
  } = useStockReconciliations({ page: reconciliationsFilters.page, pageSize: reconciliationsFilters.pageSize });

  // Reset filters when switching tabs (requirement 8.5)
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab as ActiveTab);
    
    // Reset filters for the new tab to default values
    switch (newTab) {
      case 'levels':
        setLevelsFilters({ page: 1, pageSize: 20 });
        break;
      case 'movements':
        setMovementsFilters({ page: 1, pageSize: 20 });
        break;
      case 'entries':
        setEntriesFilters({ page: 1, pageSize: 20 });
        break;
      case 'reconciliations':
        setReconciliationsFilters({ page: 1, pageSize: 20 });
        break;
    }
  };

  // Pagination handlers for each tab
  const handleLevelsPaginationChange = (pageIndex: number, pageSize: number) => {
    setLevelsFilters((prev) => ({ ...prev, page: pageIndex + 1, pageSize }));
  };

  const handleMovementsPaginationChange = (pageIndex: number, pageSize: number) => {
    setMovementsFilters((prev) => ({ ...prev, page: pageIndex + 1, pageSize }));
  };

  const handleEntriesPaginationChange = (pageIndex: number, pageSize: number) => {
    setEntriesFilters((prev) => ({ ...prev, page: pageIndex + 1, pageSize }));
  };

  const handleReconciliationsPaginationChange = (pageIndex: number, pageSize: number) => {
    setReconciliationsFilters((prev) => ({ ...prev, page: pageIndex + 1, pageSize }));
  };

  // Get stats for the active tab
  const getActiveStats = () => {
    switch (activeTab) {
      case 'levels':
        return {
          stat1: { title: 'Total Items', value: formatQuantity(levelsStats?.total_items || 0), icon: Boxes },
          stat2: { title: 'Total Warehouses', value: formatQuantity(levelsStats?.total_warehouses || 0), icon: Package },
          stat3: { title: 'Low Stock Items', value: formatQuantity(levelsStats?.low_stock_items || 0), icon: AlertTriangle },
          stat4: { title: 'Out of Stock', value: formatQuantity(levelsStats?.out_of_stock_items || 0), icon: AlertTriangle },
        };
      case 'movements':
        return {
          stat1: { title: 'Total Movements', value: formatQuantity(movementsStats?.total_movements || 0), icon: ArrowRightLeft },
          stat2: { title: 'Stock In', value: formatQuantity(movementsStats?.stock_in || 0), icon: Package },
          stat3: { title: 'Stock Out', value: formatQuantity(movementsStats?.stock_out || 0), icon: Package },
          stat4: { title: 'Adjustments', value: formatQuantity(movementsStats?.adjustments || 0), icon: FileText },
        };
      case 'entries':
        return {
          stat1: { title: 'Total Entries', value: formatQuantity(entriesStats?.total_entries || 0), icon: FileText },
          stat2: { title: 'Draft', value: formatQuantity(entriesStats?.draft_count || 0), icon: FileText },
          stat3: { title: 'Submitted', value: formatQuantity(entriesStats?.submitted_count || 0), icon: ClipboardCheck },
          stat4: { title: 'Total Value', value: `$${formatQuantity(entriesStats?.total_value || 0)}`, icon: Package },
        };
      case 'reconciliations':
        return {
          stat1: { title: 'Total Reconciliations', value: formatQuantity(reconciliationsStats?.total_reconciliations || 0), icon: ClipboardCheck },
          stat2: { title: 'Pending', value: formatQuantity(reconciliationsStats?.pending_count || 0), icon: AlertTriangle },
          stat3: { title: 'Completed', value: formatQuantity(reconciliationsStats?.completed_count || 0), icon: ClipboardCheck },
          stat4: { title: 'Total Adjustments', value: formatQuantity(reconciliationsStats?.total_adjustments || 0), icon: FileText },
        };
    }
  };

  const activeStats = getActiveStats();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground mt-1">Monitor stock levels, movements, and maintain accurate records</p>
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
              <DropdownMenuItem onSelect={() => setStockEntryDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Stock Entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards - Dynamic based on active tab */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={activeStats.stat1.title}
          value={activeStats.stat1.value}
          icon={activeStats.stat1.icon}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"/>
        <StatCard title={activeStats.stat2.title}
          value={activeStats.stat2.value}
          icon={activeStats.stat2.icon}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"/>
        <StatCard title={activeStats.stat3.title}
          value={activeStats.stat3.value}
          icon={activeStats.stat3.icon}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"/>
        <StatCard title={activeStats.stat4.title}
          value={activeStats.stat4.value}
          icon={activeStats.stat4.icon}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"/>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="levels">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="entries">Stock Entries</TabsTrigger>
          <TabsTrigger value="reconciliations">Reconciliations</TabsTrigger>
        </TabsList>

        {/* Stock Levels Tab */}
        <TabsContent value="levels" className="mt-4">
          <StockLevelsTable stockLevels={stockLevels}
            loading={levelsLoading}
            error={levelsError}
            hasActiveFilters={false}
            serverPagination={{
              pageIndex: levelsFilters.page - 1,
              pageSize: levelsFilters.pageSize,
              totalItems: levelsPagination?.total_items || 0,
              onPaginationChange: handleLevelsPaginationChange,
            }}/>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="mt-4">
          <StockMovementsTable stockMovements={stockMovements}
            loading={movementsLoading}
            error={movementsError}
            hasActiveFilters={false}
            serverPagination={{
              pageIndex: movementsFilters.page - 1,
              pageSize: movementsFilters.pageSize,
              totalItems: movementsPagination?.total_items || 0,
              onPaginationChange: handleMovementsPaginationChange,
            }}/>
        </TabsContent>

        {/* Stock Entries Tab */}
        <TabsContent value="entries" className="mt-4">
          <StockEntriesTable stockEntries={stockEntries}
            loading={entriesLoading}
            error={entriesError}
            hasActiveFilters={false}
            serverPagination={{
              pageIndex: entriesFilters.page - 1,
              pageSize: entriesFilters.pageSize,
              totalItems: entriesPagination?.total_items || 0,
              onPaginationChange: handleEntriesPaginationChange,
            }}/>
        </TabsContent>

        {/* Reconciliations Tab */}
        <TabsContent value="reconciliations" className="mt-4">
          <StockReconciliationsTable stockReconciliations={stockReconciliations}
            loading={reconciliationsLoading}
            error={reconciliationsError}
            hasActiveFilters={false}
            serverPagination={{
              pageIndex: reconciliationsFilters.page - 1,
              pageSize: reconciliationsFilters.pageSize,
              totalItems: reconciliationsPagination?.total_items || 0,
              onPaginationChange: handleReconciliationsPaginationChange,
            }}/>
        </TabsContent>
      </Tabs>

      {/* Stock Entry Dialog */}
      <StockEntryDialog open={stockEntryDialogOpen}
        onOpenChange={setStockEntryDialogOpen}
        warehouses={[]}
        items={[]}
        onCreated={() => {
          setStockEntryDialogOpen(false);
          refetchEntries();
        }}
        onUpdated={() => {
          setStockEntryDialogOpen(false);
          refetchEntries();
        }}/>
    </div>
  );
}

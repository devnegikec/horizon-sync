import * as React from 'react';

import {
  Package,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  ArrowRightLeft,
  FileText,
  ClipboardCheck,
  Boxes,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import { cn } from '@horizon-sync/ui/lib';

import { useItems } from '../../hooks/useItems';
import {
  useStockLevels,
  useStockMovements,
  useStockEntries,
  useStockReconciliations,
} from '../../hooks/useStock';
import { useWarehouses } from '../../hooks/useWarehouses';
import type { StockLevel, StockMovement, StockEntry, StockReconciliation } from '../../types/stock.types';
import { formatDate } from '../../utility/formatDate';

import { StockEntryDialog } from './StockEntryDialog';
import { StockMovementDialog } from './StockMovementDialog';

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

function getMovementTypeBadge(type: string) {
  switch (type) {
    case 'receipt':
      return { variant: 'success' as const, label: 'Receipt', icon: TrendingUp };
    case 'issue':
      return { variant: 'destructive' as const, label: 'Issue', icon: TrendingDown };
    case 'transfer':
      return { variant: 'secondary' as const, label: 'Transfer', icon: ArrowRightLeft };
    case 'adjustment':
      return { variant: 'warning' as const, label: 'Adjustment', icon: AlertTriangle };
    default:
      return { variant: 'outline' as const, label: type, icon: Package };
  }
}

function getEntryStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'submitted':
      return { variant: 'success' as const, label: 'Submitted' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

export function StockManagement() {
  const [activeTab, setActiveTab] = React.useState('levels');
  const [filters, setFilters] = React.useState({
    search: '',
    warehouseId: 'all',
    movementType: 'all',
    entryType: 'all',
    status: 'all',
  });
  const [movementDialogOpen, setMovementDialogOpen] = React.useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<StockEntry | null>(null);

  const { warehouses } = useWarehouses(1, 100);
  const { items } = useItems(1, 100);
  const { stockLevels, loading: levelsLoading, error: levelsError, refetch: refetchLevels } = useStockLevels(
    1,
    50,
    { warehouseId: filters.warehouseId !== 'all' ? filters.warehouseId : undefined }
  );
  const { stockMovements, loading: movementsLoading, error: movementsError, refetch: refetchMovements } =
    useStockMovements(1, 50, {
      warehouseId: filters.warehouseId !== 'all' ? filters.warehouseId : undefined,
    });
  const { stockEntries, loading: entriesLoading, error: entriesError, refetch: refetchEntries } =
    useStockEntries(1, 50, {
      entryType: filters.entryType !== 'all' ? filters.entryType : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
    });
  const {
    reconciliations,
    loading: reconciliationsLoading,
    error: reconciliationsError,
    refetch: refetchReconciliations,
  } = useStockReconciliations(1, 50, {
    status: filters.status !== 'all' ? filters.status : undefined,
  });

  const stats = React.useMemo(() => {
    const totalOnHand = stockLevels.reduce((sum, s) => sum + (s.quantity_on_hand || 0), 0);
    const totalReserved = stockLevels.reduce((sum, s) => sum + (s.quantity_reserved || 0), 0);
    const totalAvailable = stockLevels.reduce((sum, s) => sum + (s.quantity_available || 0), 0);
    const lowStockCount = stockLevels.filter((s) => (s.quantity_available || 0) < 10).length;
    return { totalOnHand, totalReserved, totalAvailable, lowStockCount };
  }, [stockLevels]);

  const handleRecordMovement = () => {
    setMovementDialogOpen(true);
  };

  const handleCreateEntry = () => {
    setSelectedEntry(null);
    setEntryDialogOpen(true);
  };

  const handleEditEntry = (entry: StockEntry) => {
    setSelectedEntry(entry);
    setEntryDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchLevels();
    refetchMovements();
    refetchEntries();
    refetchReconciliations();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
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
              <DropdownMenuItem onClick={handleRecordMovement}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Record Movement
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateEntry}>
                <FileText className="mr-2 h-4 w-4" />
                Stock Entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total On Hand"
          value={stats.totalOnHand.toLocaleString()}
          icon={Boxes}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"/>
        <StatCard title="Available"
          value={stats.totalAvailable.toLocaleString()}
          icon={Package}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"/>
        <StatCard title="Reserved"
          value={stats.totalReserved.toLocaleString()}
          icon={ClipboardCheck}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"/>
        <StatCard title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"/>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="levels">Stock Levels</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="entries">Stock Entries</TabsTrigger>
            <TabsTrigger value="reconciliations">Reconciliations</TabsTrigger>
          </TabsList>
          <div className="flex gap-3">
            <SearchInput className="w-64"
              placeholder="Search..."
              onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
            <Select value={filters.warehouseId}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, warehouseId: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stock Levels Tab */}
        <TabsContent value="levels" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {levelsError && (
                <div className="p-4 text-destructive text-sm border-b">{levelsError}</div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Warehouse ID</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Last Counted</TableHead>
                    <TableHead>Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levelsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : stockLevels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState icon={<Boxes className="h-12 w-12" />}
                          title="No stock levels found"
                          description="Stock levels will appear here once items are added to warehouses"/>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockLevels.map((level: StockLevel) => (
                      <TableRow key={level.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">
                            {level.product_id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">
                            {level.warehouse_id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {level.quantity_on_hand?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {level.quantity_reserved?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                              'font-medium',
                              (level.quantity_available || 0) < 10 && 'text-destructive'
                            )}>
                            {level.quantity_available?.toLocaleString() || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {level.last_counted_at
                            ? formatDate(level.last_counted_at, 'DD-MMM-YY')
                            : '—'}
                        </TableCell>
                        <TableCell>{formatDate(level.updated_at, 'DD-MMM-YY')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base">Recent Movements</CardTitle>
              <Button variant="outline" size="sm" onClick={handleRecordMovement}>
                <Plus className="h-4 w-4 mr-1" />
                Record Movement
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {movementsError && (
                <div className="p-4 text-destructive text-sm border-b">{movementsError}</div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Warehouse ID</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Performed At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : stockMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState icon={<ArrowRightLeft className="h-12 w-12" />}
                          title="No movements found"
                          description="Stock movements will appear here as they are recorded"
                          action={
                            <Button onClick={handleRecordMovement} className="gap-2">
                              <Plus className="h-4 w-4" />
                              Record Movement
                            </Button>
                          }/>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockMovements.map((movement: StockMovement) => {
                      const typeBadge = getMovementTypeBadge(movement.movement_type);
                      return (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-0.5 rounded">
                              {movement.product_id.slice(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-0.5 rounded">
                              {movement.warehouse_id.slice(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {movement.quantity.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {formatDate(movement.performed_at, 'DD-MMM-YY', true)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Entries Tab */}
        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base">Stock Entries</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCreateEntry}>
                <Plus className="h-4 w-4 mr-1" />
                New Entry
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {entriesError && (
                <div className="p-4 text-destructive text-sm border-b">{entriesError}</div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From Warehouse</TableHead>
                    <TableHead>To Warehouse</TableHead>
                    <TableHead>Posting Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : stockEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState icon={<FileText className="h-12 w-12" />}
                          title="No stock entries found"
                          description="Create stock entries for material receipts, issues, or transfers"
                          action={
                            <Button onClick={handleCreateEntry} className="gap-2">
                              <Plus className="h-4 w-4" />
                              New Entry
                            </Button>
                          }/>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockEntries.map((entry: StockEntry) => {
                      const statusBadge = getEntryStatusBadge(entry.status);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-0.5 rounded">
                              {entry.stock_entry_no}
                            </code>
                          </TableCell>
                          <TableCell className="capitalize">
                            {entry.stock_entry_type.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell>
                            {entry.from_warehouse_id ? (
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                {entry.from_warehouse_id.slice(0, 8)}...
                              </code>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.to_warehouse_id ? (
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                {entry.to_warehouse_id.slice(0, 8)}...
                              </code>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>{formatDate(entry.posting_date, 'DD-MMM-YY')}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View / Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliations Tab */}
        <TabsContent value="reconciliations" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base">Stock Reconciliations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {reconciliationsError && (
                <div className="p-4 text-destructive text-sm border-b">{reconciliationsError}</div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reconciliation No.</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Posting Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : reconciliations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState icon={<ClipboardCheck className="h-12 w-12" />}
                          title="No reconciliations found"
                          description="Stock reconciliations help compare physical counts with system records"/>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reconciliations.map((recon: StockReconciliation) => {
                      const statusBadge = getEntryStatusBadge(recon.status);
                      return (
                        <TableRow key={recon.id}>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-0.5 rounded">
                              {recon.reconciliation_no}
                            </code>
                          </TableCell>
                          <TableCell>{recon.purpose}</TableCell>
                          <TableCell>{formatDate(recon.posting_date, 'DD-MMM-YY')}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(recon.created_at, 'DD-MMM-YY')}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <StockMovementDialog open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
        warehouses={warehouses}
        items={items}
        onCreated={() => {
          refetchMovements();
          refetchLevels();
        }}/>
      <StockEntryDialog open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        entry={selectedEntry}
        warehouses={warehouses}
        items={items}
        onCreated={refetchEntries}
        onUpdated={refetchEntries}/>
    </div>
  );
}

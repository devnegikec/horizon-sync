import { useMemo, useState, useEffect } from 'react';

import { type Table } from '@tanstack/react-table';
import { Truck, Plus, Download, Link2, Package, Star } from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  DataTableViewOptions,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useItems } from '../../hooks/useItems';
import { useItemSuppliers, useItemSupplierMutations } from '../../hooks/useItemSuppliers';
import type { ItemSupplier, ItemSupplierFilters } from '../../types/supplier.types';

import { ItemSupplierDialog } from './ItemSupplierDialog';
import { SuppliersTable } from './SuppliersTable';

// Mock suppliers for demonstration - in production this would come from a suppliers API
const mockSuppliers = [
  { id: 'sup-001', name: 'Acme Corporation', code: 'ACME' },
  { id: 'sup-002', name: 'Global Supplies Inc', code: 'GSI' },
  { id: 'sup-003', name: 'Tech Parts Ltd', code: 'TPL' },
  { id: 'sup-004', name: 'Industrial Materials Co', code: 'IMC' },
];

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

export function SupplierManagement() {
  const { items } = useItems(1, 100);
  const [filters, setFilters] = useState<ItemSupplierFilters>({
    search: '',
    supplierId: 'all',
    itemId: 'all',
  });

  const {
    itemSuppliers,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    currentPage,
    currentPageSize,
  } = useItemSuppliers(1, 20, filters);

  const { deleteItemSupplier } = useItemSupplierMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItemSupplier, setSelectedItemSupplier] = useState<ItemSupplier | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<ItemSupplier> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  // Create lookup maps for display
  const itemMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.id, item.item_name || item.item_code || 'Unknown'));
    return map;
  }, [items]);

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    mockSuppliers.forEach((s) => map.set(s.id, s.name));
    return map;
  }, []);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const defaultSuppliers = itemSuppliers.filter((is) => is.is_default).length;
    const uniqueItems = new Set(itemSuppliers.map((is) => is.item_id)).size;
    const uniqueSuppliers = new Set(itemSuppliers.map((is) => is.supplier_id)).size;
    return { total, defaultSuppliers, uniqueItems, uniqueSuppliers };
  }, [itemSuppliers, pagination]);

  const handleCreateLink = () => {
    setSelectedItemSupplier(null);
    setDialogOpen(true);
  };

  const handleEditLink = (itemSupplier: ItemSupplier) => {
    setSelectedItemSupplier(itemSupplier);
    setDialogOpen(true);
  };

  const handleDeleteLink = async (itemSupplier: ItemSupplier) => {
    const itemName = itemMap.get(itemSupplier.item_id) || 'this item';
    const supplierName = supplierMap.get(itemSupplier.supplier_id) || 'this supplier';

    if (window.confirm(`Are you sure you want to remove the link between "${itemName}" and "${supplierName}"?`)) {
      try {
        await deleteItemSupplier(itemSupplier.id);
        refetch();
      } catch {
        // Error handled in hook
      }
    }
  };

  const handleTableReady = (table: Table<ItemSupplier>) => {
    setTableInstance(table);
  };

  const serverPaginationConfig = useMemo(
    () => ({
      pageIndex: currentPage - 1, // DataTable uses 0-based indexing
      pageSize: currentPageSize,
      totalItems: pagination?.total_items ?? 0,
      onPaginationChange: (pageIndex: number, newPageSize: number) => {
        setPage(pageIndex + 1); // Convert back to 1-based for API
        setPageSize(newPageSize);
      },
    }),
    [currentPage, currentPageSize, pagination?.total_items, setPage, setPageSize]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-muted-foreground mt-1">Manage item-supplier relationships, lead times, and preferred suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateLink} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            Link Item to Supplier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Links"
          value={stats.total}
          icon={Link2}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"/>
        <StatCard title="Default Suppliers"
          value={stats.defaultSuppliers}
          icon={Star}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"/>
        <StatCard title="Items with Suppliers"
          value={stats.uniqueItems}
          icon={Package}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"/>
        <StatCard title="Active Suppliers"
          value={stats.uniqueSuppliers}
          icon={Truck}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"/>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80"
            placeholder="Search by item, supplier, or part no..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
          <div className="flex gap-3">
            <Select value={filters.supplierId} onValueChange={(value) => setFilters((prev) => ({ ...prev, supplierId: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {mockSuppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.itemId} onValueChange={(value) => setFilters((prev) => ({ ...prev, itemId: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                {items.slice(0, 20).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name || item.item_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">{tableInstance && <DataTableViewOptions table={tableInstance} />}</div>
      </div>

      {/* Suppliers Table */}
      <SuppliersTable itemSuppliers={itemSuppliers}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.supplierId !== 'all' || filters.itemId !== 'all'}
        itemMap={itemMap}
        supplierMap={supplierMap}
        onEdit={handleEditLink}
        onDelete={handleDeleteLink}
        onCreateLink={handleCreateLink}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      {/* Dialog */}
      <ItemSupplierDialog open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemSupplier={selectedItemSupplier}
        items={items}
        suppliers={mockSuppliers}
        onCreated={refetch}
        onUpdated={refetch}/>
    </div>
  );
}

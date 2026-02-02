import * as React from 'react';

import {
  Truck,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Link2,
  Package,
  Clock,
  Star,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { cn } from '@horizon-sync/ui/lib';

import { useItems } from '../../hooks/useItems';
import { useItemSuppliers, useItemSupplierMutations } from '../../hooks/useItemSuppliers';
import type { ItemSupplier, ItemSupplierFilters } from '../../types/supplier.types';
import { formatDate } from '../../utility/formatDate';

import { ItemSupplierDialog } from './ItemSupplierDialog';

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

interface ItemSupplierRowProps {
  itemSupplier: ItemSupplier;
  supplierName: string;
  itemName: string;
  onEdit: (itemSupplier: ItemSupplier) => void;
  onDelete: (itemSupplier: ItemSupplier) => void;
}

function ItemSupplierRow({
  itemSupplier,
  supplierName,
  itemName,
  onEdit,
  onDelete,
}: ItemSupplierRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{itemName}</p>
            <code className="text-xs text-muted-foreground">
              {itemSupplier.item_id.slice(0, 8)}...
            </code>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{supplierName}</p>
          <code className="text-xs text-muted-foreground">
            {itemSupplier.supplier_id.slice(0, 8)}...
          </code>
        </div>
      </TableCell>
      <TableCell>
        {itemSupplier.supplier_part_no ? (
          <code className="text-sm bg-muted px-2 py-0.5 rounded">
            {itemSupplier.supplier_part_no}
          </code>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {itemSupplier.lead_time_days !== undefined ? (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{itemSupplier.lead_time_days} days</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {itemSupplier.is_default ? (
          <Badge variant="success" className="gap-1">
            <Star className="h-3 w-3" />
            Default
          </Badge>
        ) : (
          <Badge variant="secondary">Alternative</Badge>
        )}
      </TableCell>
      <TableCell>{formatDate(itemSupplier.created_at, 'DD-MMM-YY')}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(itemSupplier)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(itemSupplier)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function SupplierManagement() {
  const { items } = useItems(1, 100);
  const { itemSuppliers, pagination, loading, error, refetch } = useItemSuppliers(1, 50);
  const { deleteItemSupplier } = useItemSupplierMutations();
  const [filters, setFilters] = React.useState<ItemSupplierFilters>({
    search: '',
    supplierId: 'all',
    itemId: 'all',
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedItemSupplier, setSelectedItemSupplier] = React.useState<ItemSupplier | null>(null);

  // Create lookup maps for display
  const itemMap = React.useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.id, item.item_name || item.item_code || 'Unknown'));
    return map;
  }, [items]);

  const supplierMap = React.useMemo(() => {
    const map = new Map<string, string>();
    mockSuppliers.forEach((s) => map.set(s.id, s.name));
    return map;
  }, []);

  const filteredItemSuppliers = React.useMemo(() => {
    return itemSuppliers.filter((is) => {
      const itemName = itemMap.get(is.item_id) || '';
      const supplierName = supplierMap.get(is.supplier_id) || '';

      const matchesSearch =
        filters.search === '' ||
        itemName.toLowerCase().includes(filters.search.toLowerCase()) ||
        supplierName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (is.supplier_part_no || '').toLowerCase().includes(filters.search.toLowerCase());

      const matchesSupplier =
        filters.supplierId === 'all' || is.supplier_id === filters.supplierId;

      const matchesItem = filters.itemId === 'all' || is.item_id === filters.itemId;

      return matchesSearch && matchesSupplier && matchesItem;
    });
  }, [itemSuppliers, filters, itemMap, supplierMap]);

  const stats = React.useMemo(() => {
    const total = pagination?.total_items ?? itemSuppliers.length;
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

    if (
      window.confirm(
        `Are you sure you want to remove the link between "${itemName}" and "${supplierName}"?`
      )
    ) {
      try {
        await deleteItemSupplier(itemSupplier.id);
        refetch();
      } catch {
        // Error handled in hook
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage item-supplier relationships, lead times, and preferred suppliers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleCreateLink}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Link Item to Supplier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Links"
          value={stats.total}
          icon={Link2}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <StatCard
          title="Default Suppliers"
          value={stats.defaultSuppliers}
          icon={Star}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Items with Suppliers"
          value={stats.uniqueItems}
          icon={Package}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Active Suppliers"
          value={stats.uniqueSuppliers}
          icon={Truck}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-80"
          placeholder="Search by item, supplier, or part no..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        />
        <div className="flex gap-3">
          <Select
            value={filters.supplierId}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, supplierId: value }))}
          >
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
          <Select
            value={filters.itemId}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, itemId: value }))}
          >
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

      {/* Item Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          {error && <div className="p-4 text-destructive text-sm border-b">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Supplier Part No.</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredItemSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={<Link2 className="h-12 w-12" />}
                      title="No item-supplier links found"
                      description={
                        filters.search ||
                        filters.supplierId !== 'all' ||
                        filters.itemId !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Link items to suppliers to manage procurement'
                      }
                      action={
                        !filters.search &&
                        filters.supplierId === 'all' &&
                        filters.itemId === 'all' && (
                          <Button onClick={handleCreateLink} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Link Item to Supplier
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredItemSuppliers.map((itemSupplier) => (
                  <ItemSupplierRow
                    key={itemSupplier.id}
                    itemSupplier={itemSupplier}
                    itemName={itemMap.get(itemSupplier.item_id) || 'Unknown Item'}
                    supplierName={supplierMap.get(itemSupplier.supplier_id) || 'Unknown Supplier'}
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <ItemSupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemSupplier={selectedItemSupplier}
        items={items}
        suppliers={mockSuppliers}
        onCreated={refetch}
        onUpdated={refetch}
      />
    </div>
  );
}

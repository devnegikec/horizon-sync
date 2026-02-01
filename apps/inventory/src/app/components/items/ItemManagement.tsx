import * as React from 'react';
import {
  Package,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Power,
  PowerOff,
  Archive,
  Boxes,
  DollarSign,
  AlertTriangle,
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
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { cn } from '@horizon-sync/ui/lib';

import type { Item, ItemFilters } from '../../types/item.types';
import { mockItems, mockItemGroups } from '../../data/items.mock';
import { ItemDialog } from './ItemDialog';
import { ItemDetailDialog } from './ItemDetailDialog';

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

export function ItemManagement() {
  const [items, setItems] = React.useState<Item[]>(mockItems);
  const [filters, setFilters] = React.useState<ItemFilters>({
    search: '',
    groupId: 'all',
    status: 'all',
  });
  const [itemDialogOpen, setItemDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        filters.search === '' ||
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.itemGroupName.toLowerCase().includes(filters.search.toLowerCase());

      const matchesGroup =
        filters.groupId === 'all' || item.itemGroupId === filters.groupId;

      const matchesStatus =
        filters.status === 'all' || item.status === filters.status;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [items, filters]);

  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const activeItems = items.filter((i) => i.status === 'active').length;
    const totalValue = items.reduce(
      (sum, i) => sum + i.defaultPrice * i.currentStock,
      0
    );
    const lowStockItems = items.filter((i) => i.currentStock < 30 && i.currentStock > 0).length;

    return { totalItems, activeItems, totalValue, lowStockItems };
  }, [items]);

  const handleCreateItem = () => {
    setSelectedItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  };

  const handleViewItem = (item: Item) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const handleToggleStatus = (item: Item) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' }
          : i
      )
    );
  };

  const handleSaveItem = (itemData: Partial<Item>) => {
    if (selectedItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, ...itemData, updatedAt: new Date().toISOString() }
            : i
        )
      );
    } else {
      const newItem: Item = {
        id: Date.now().toString(),
        itemCode: itemData.itemCode || '',
        name: itemData.name || '',
        description: itemData.description || '',
        unitOfMeasure: itemData.unitOfMeasure || 'Piece',
        defaultPrice: itemData.defaultPrice || 0,
        itemGroupId: itemData.itemGroupId || '',
        itemGroupName: itemData.itemGroupName || '',
        currentStock: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog, pricing, and inventory levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleCreateItem}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={Package}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <StatCard
          title="Active Items"
          value={stats.activeItems}
          icon={Boxes}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Inventory Value"
          value={`$${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-80"
          placeholder="Search by code, name, or group..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        />
        <div className="flex gap-3">
          <Select
            value={filters.groupId}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, groupId: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {mockItemGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={<Package className="h-12 w-12" />}
                      title="No items found"
                      description={
                        filters.search || filters.groupId !== 'all' || filters.status !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Get started by adding your first item'
                      }
                      action={
                        !filters.search &&
                        filters.groupId === 'all' &&
                        filters.status === 'all' && (
                          <Button onClick={handleCreateItem} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Item
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {item.itemCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.itemGroupName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Archive
                          className={cn(
                            'h-4 w-4',
                            item.currentStock > 50
                              ? 'text-emerald-500'
                              : item.currentStock > 0
                              ? 'text-amber-500'
                              : 'text-destructive'
                          )}
                        />
                        <span
                          className={cn(
                            'font-medium',
                            item.currentStock === 0 && 'text-destructive'
                          )}
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {item.unitOfMeasure}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${item.defaultPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewItem(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditItem(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                            {item.status === 'active' ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={selectedItem}
        itemGroups={mockItemGroups}
        onSave={handleSaveItem}
      />
      <ItemDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        item={selectedItem}
      />
    </div>
  );
}

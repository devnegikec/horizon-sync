import * as React from 'react';

import { Package, TrendingUp, TrendingDown, RotateCcw, Truck, Calendar, Hash, Ruler, DollarSign, Layers, Archive } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import { cn } from '@horizon-sync/ui/lib';

import { mockPriceLevels, mockTransactions, mockSuppliers } from '../../data/items.mock';
import type { Item, PriceLevel, ItemTransaction, Supplier } from '../../types/item.types';

interface ItemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function TransactionIcon({ type }: { type: ItemTransaction['type'] }) {
  switch (type) {
    case 'purchase':
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case 'sale':
      return <TrendingDown className="h-4 w-4 text-blue-500" />;
    case 'adjustment':
      return <RotateCcw className="h-4 w-4 text-amber-500" />;
  }
}

export function ItemDetailDialog({ open, onOpenChange, item }: ItemDetailDialogProps) {
  if (!item) return null;

  const priceLevels = mockPriceLevels.filter((pl) => pl.itemId === item.id);
  const transactions = mockTransactions.filter((t) => t.itemId === item.id);
  const suppliers = mockSuppliers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{item.name}</DialogTitle>
                <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>{item.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.itemCode}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${item.defaultPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Default Price</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1">
              Pricing
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex-1">
              Suppliers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-3">Item Details</h4>
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={Hash} label="Item Code" value={item.itemCode} />
                <InfoRow icon={Ruler} label="Unit of Measure" value={item.unitOfMeasure} />
                <InfoRow icon={Layers} label="Item Group" value={item.itemGroupName} />
                <InfoRow icon={Calendar} label="Last Updated" value={new Date(item.updatedAt).toLocaleDateString()} />
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-3">Stock Information</h4>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-xl',
                    item.currentStock > 50 ? 'bg-emerald-500/10' : item.currentStock > 0 ? 'bg-amber-500/10' : 'bg-destructive/10',
                  )}
                >
                  <Archive
                    className={cn(
                      'h-8 w-8',
                      item.currentStock > 50 ? 'text-emerald-500' : item.currentStock > 0 ? 'text-amber-500' : 'text-destructive',
                    )}
                  />
                </div>
                <div>
                  <p className="text-3xl font-bold">{item.currentStock}</p>
                  <p className="text-sm text-muted-foreground">{item.unitOfMeasure}s in stock</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity Range</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Effective Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceLevels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No special pricing configured</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    priceLevels.map((pl) => (
                      <TableRow key={pl.id}>
                        <TableCell>{pl.customerName || <span className="text-muted-foreground">All Customers</span>}</TableCell>
                        <TableCell>
                          {pl.minQuantity}
                          {pl.maxQuantity ? ` - ${pl.maxQuantity}` : '+'} units
                        </TableCell>
                        <TableCell className="font-medium">${pl.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {pl.effectiveFrom}
                          {pl.effectiveTo ? ` to ${pl.effectiveTo}` : ' onwards'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <RotateCcw className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No recent transactions</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TransactionIcon type={t.type} />
                            <span className="capitalize">{t.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{t.reference}</TableCell>
                        <TableCell>{t.quantity}</TableCell>
                        <TableCell>${t.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{t.date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{s.contactEmail}</TableCell>
                      <TableCell>{s.contactPhone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

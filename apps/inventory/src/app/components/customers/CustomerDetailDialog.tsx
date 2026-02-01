import * as React from 'react';
import {
  Users,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  FileText,
  Truck,
  DollarSign,
  Tag,
  Building2,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@horizon-sync/ui/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { cn } from '@horizon-sync/ui/lib';

import type { Customer, Invoice, Delivery, CustomerPricing } from '../../types/customer.types';
import { mockInvoices, mockDeliveries, mockCustomerPricing } from '../../data/customers.mock';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
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

function getStatusBadge(status: Customer['status']) {
  switch (status) {
    case 'active':
      return { variant: 'success' as const, label: 'Active' };
    case 'inactive':
      return { variant: 'secondary' as const, label: 'Inactive' };
    case 'on-hold':
      return { variant: 'warning' as const, label: 'On Hold' };
  }
}

function getInvoiceStatusBadge(status: Invoice['status']) {
  switch (status) {
    case 'paid':
      return { variant: 'success' as const, icon: CheckCircle };
    case 'partial':
      return { variant: 'warning' as const, icon: AlertCircle };
    case 'unpaid':
      return { variant: 'secondary' as const, icon: Clock };
    case 'overdue':
      return { variant: 'destructive' as const, icon: XCircle };
  }
}

function getDeliveryStatusBadge(status: Delivery['status']) {
  switch (status) {
    case 'delivered':
      return { variant: 'success' as const, label: 'Delivered' };
    case 'shipped':
      return { variant: 'warning' as const, label: 'Shipped' };
    case 'pending':
      return { variant: 'secondary' as const, label: 'Pending' };
  }
}

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDetailDialogProps) {
  if (!customer) return null;

  const invoices = mockInvoices.filter((inv) => inv.customerId === customer.id);
  const deliveries = mockDeliveries.filter((del) => del.customerId === customer.id);
  const pricing = mockCustomerPricing.filter((p) => p.customerId === customer.id);

  const outstandingBalance = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const creditUtilization = customer.creditLimit > 0
    ? (customer.currentBalance / customer.creditLimit) * 100
    : 0;

  const statusBadge = getStatusBadge(customer.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{customer.name}</DialogTitle>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{customer.customerCode}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${customer.currentBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Current Balance</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="invoices" className="flex-1">Invoices</TabsTrigger>
            <TabsTrigger value="deliveries" className="flex-1">Deliveries</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Contact Information */}
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={Mail} label="Email" value={customer.email} />
                <InfoRow icon={Phone} label="Phone" value={customer.phone} />
                <InfoRow icon={Clock} label="Payment Terms" value={customer.paymentTerms} />
                <InfoRow
                  icon={CreditCard}
                  label="Credit Limit"
                  value={`$${customer.creditLimit.toLocaleString()}`}
                />
              </div>
            </div>

            {/* Credit Status */}
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-3">Credit Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credit Utilization</span>
                  <span className="text-sm font-medium">{creditUtilization.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      creditUtilization > 90
                        ? 'bg-destructive'
                        : creditUtilization > 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${customer.currentBalance.toLocaleString()} used
                  </span>
                  <span className="text-muted-foreground">
                    ${(customer.creditLimit - customer.currentBalance).toLocaleString()} available
                  </span>
                </div>
                {creditUtilization > 90 && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Credit limit nearly exhausted - new sales may be blocked</span>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-3">Addresses</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Billing Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p>{customer.billingAddress.street}</p>
                      <p>
                        {customer.billingAddress.city}, {customer.billingAddress.state}{' '}
                        {customer.billingAddress.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Shipping Addresses ({customer.shippingAddresses.length})
                  </p>
                  <div className="grid gap-2">
                    {customer.shippingAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="flex items-start gap-2 rounded-md bg-muted/50 p-2"
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{addr.label}</span>
                            {addr.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">
                            {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No invoices found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => {
                      const badge = getInvoiceStatusBadge(inv.status);
                      const Icon = badge.icon;
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell>{inv.date}</TableCell>
                          <TableCell>{inv.dueDate}</TableCell>
                          <TableCell className="font-medium">
                            ${inv.total.toLocaleString()}
                          </TableCell>
                          <TableCell>${inv.paidAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={badge.variant} className="gap-1">
                              <Icon className="h-3 w-3" />
                              {inv.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {outstandingBalance > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted p-4">
                <span className="text-sm font-medium">Outstanding Balance</span>
                <span className="text-lg font-bold">${outstandingBalance.toLocaleString()}</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Truck className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No deliveries found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((del) => {
                      const badge = getDeliveryStatusBadge(del.status);
                      const address = customer.shippingAddresses.find(
                        (a) => a.id === del.addressId
                      );
                      return (
                        <TableRow key={del.id}>
                          <TableCell className="font-mono text-sm">
                            {del.deliveryNumber}
                          </TableCell>
                          <TableCell>{del.date}</TableCell>
                          <TableCell>
                            {address ? (
                              <span className="text-sm">
                                {address.label} - {address.city}, {address.state}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Default Price</TableHead>
                    <TableHead>Special Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Effective Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Tag className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            No special pricing configured
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pricing.map((p) => {
                      const discount = (
                        ((p.defaultPrice - p.specialPrice) / p.defaultPrice) *
                        100
                      ).toFixed(0);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{p.itemName}</p>
                              <p className="text-sm text-muted-foreground">{p.itemCode}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            ${p.defaultPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${p.specialPrice.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="success">{discount}% off</Badge>
                          </TableCell>
                          <TableCell>
                            {p.effectiveFrom}
                            {p.effectiveTo ? ` to ${p.effectiveTo}` : ' onwards'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

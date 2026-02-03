import * as React from 'react';

import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Hash,
  CreditCard,
  Wallet,
  Calendar,
  Tag as TagIcon,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Separator } from '@horizon-sync/ui/components/ui/separator';

import type { Customer } from '../../types/customer.types';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
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

export function CustomerDetailDialog({ open, onOpenChange, customer }: CustomerDetailDialogProps) {
  if (!customer) return null;

  const creditLimit = parseFloat(customer.credit_limit);
  const outstandingBalance = parseFloat(customer.outstanding_balance);
  const creditUtilization = creditLimit > 0 ? (outstandingBalance / creditLimit) * 100 : 0;
  const statusBadge = getStatusBadge(customer.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-2xl font-bold">{customer.customer_name}</DialogTitle>
              <Badge variant={statusBadge.variant} className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
              <Hash className="h-3.5 w-3.5" />
              {customer.customer_code}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight">${outstandingBalance.toLocaleString()}</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Outstanding Balance</p>
          </div>
        </DialogHeader>

        <Separator />

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Contact Information */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Contact Information</h3>
              </div>
              <div className="grid gap-5">
                <div className="flex gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium mt-0.5">{customer.email}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium mt-0.5">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</p>
                    <p className="text-sm font-medium mt-0.5">{customer.city}</p>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                      <p className="text-sm font-medium mt-0.5">{customer.address}</p>
                    </div>
                  </div>
                )}
                {customer.tax_number && (
                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                      <Hash className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tax Number</p>
                      <p className="text-sm font-medium mt-0.5">{customer.tax_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block h-auto self-stretch" />
            <Separator orientation="horizontal" className="md:hidden" />

            {/* Financial Information */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Financial Information</h3>
              </div>
              <div className="grid gap-5">
                <div className="flex gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Credit Limit</p>
                    <p className="text-sm font-medium mt-0.5">${creditLimit.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Outstanding Balance</p>
                    <p className="text-sm font-medium mt-0.5">${outstandingBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Credit Utilization</span>
                    <span>{creditUtilization.toFixed(1)}% used</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                        creditUtilization > 90 ? 'bg-destructive' : creditUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">${(creditLimit - outstandingBalance).toLocaleString()} available credit</p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Member Since</p>
                    <p className="text-sm font-medium mt-0.5">
                      {new Date(customer.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {customer.tags && (
            <>
              <Separator className="my-8" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="px-3 py-1 text-xs font-medium bg-muted/50">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';

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

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDetailDialogProps) {
  if (!customer) return null;

  const creditLimit = parseFloat(customer.credit_limit);
  const outstandingBalance = parseFloat(customer.outstanding_balance);
  const creditUtilization = creditLimit > 0 ? (outstandingBalance / creditLimit) * 100 : 0;
  const statusBadge = getStatusBadge(customer.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl">{customer.customer_name}</DialogTitle>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{customer.customer_code}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${outstandingBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Outstanding Balance</p>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium">City</p>
                <p className="text-sm text-muted-foreground">{customer.city}</p>
              </div>
              {customer.address && (
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{customer.address}</p>
                </div>
              )}
              {customer.tax_number && (
                <div>
                  <p className="text-sm font-medium">Tax Number</p>
                  <p className="text-sm text-muted-foreground">{customer.tax_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Credit Limit</p>
                <p className="text-sm text-muted-foreground">${creditLimit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Outstanding Balance</p>
                <p className="text-sm text-muted-foreground">${outstandingBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Credit Utilization</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {creditUtilization.toFixed(1)}% used
                    </span>
                    <span className="text-muted-foreground">
                      ${(creditLimit - outstandingBalance).toLocaleString()} available
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${creditUtilization > 90 ? 'bg-destructive' : creditUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(creditUtilization, 100)}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {customer.tags && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Tags</h3>
            <p className="text-sm text-muted-foreground">{customer.tags}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
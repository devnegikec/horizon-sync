import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, Power, PowerOff, Pause, Building2, AlertTriangle } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { cn } from '@horizon-sync/ui/lib';

import type { Customer } from '../../types/customer.types';

interface CustomerColumnsProps {
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onToggleStatus: (customer: Customer, newStatus: Customer['status']) => void;
}

function getStatusBadge(status: Customer['status']) {
  switch (status) {
    case 'active':
      return { variant: 'success' as const, label: 'Active' };
    case 'inactive':
      return { variant: 'secondary' as const, label: 'Inactive' };
    case 'blocked':
      return { variant: 'warning' as const, label: 'Blocked' };
  }
}

export function createCustomerColumns({ onViewCustomer, onEditCustomer, onToggleStatus }: CustomerColumnsProps): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{customer.customer_name}</p>
              <code className="text-xs text-muted-foreground">{customer.customer_code}</code>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-sm">
            <p>{customer.email}</p>
            <p className="text-muted-foreground">{customer.phone}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-sm">
            <p>{customer.city}</p>
            {customer.address && <p className="text-muted-foreground text-xs line-clamp-1">{customer.address}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: 'credit_limit',
      header: 'Credit Limit',
      cell: ({ row }) => {
        const creditLimit = parseFloat(row.original.credit_limit);
        return <span className="font-medium">${creditLimit.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: 'outstanding_balance',
      header: 'Balance',
      cell: ({ row }) => {
        const customer = row.original;
        const balance = parseFloat(customer.outstanding_balance);
        const creditLimit = parseFloat(customer.credit_limit);
        const creditUtilization = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', creditUtilization > 90 && 'text-destructive')}>${balance.toLocaleString()}</span>
              {creditUtilization > 90 && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            {creditLimit > 0 && (
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div className={cn(
                    'h-full rounded-full',
                    creditUtilization > 90 ? 'bg-destructive' : creditUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500',
                  )}
                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}/>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'tax_number',
      header: 'Tax Number',
      cell: ({ row }) => {
        const taxNumber = row.original.tax_number;
        return taxNumber ? (
          <code className="text-sm bg-muted px-2 py-1 rounded">{taxNumber}</code>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusBadge = getStatusBadge(status);
        return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewCustomer(customer)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditCustomer(customer)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {customer.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => onToggleStatus(customer, 'blocked')}>
                    <Pause className="mr-2 h-4 w-4" />
                    Block Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleStatus(customer, 'inactive')}>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                </>
              )}
              {customer.status === 'inactive' && (
                <DropdownMenuItem onClick={() => onToggleStatus(customer, 'active')}>
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              {customer.status === 'blocked' && (
                <DropdownMenuItem onClick={() => onToggleStatus(customer, 'active')}>
                  <Power className="mr-2 h-4 w-4" />
                  Remove Hold
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

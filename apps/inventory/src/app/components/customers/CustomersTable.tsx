import * as React from 'react';

import { Users, Plus } from 'lucide-react';

import { DataTable } from '@horizon-sync/ui/components/data-table/DataTable';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { Customer } from '../../types/customer.types';

import { createCustomerColumns } from './CustomerColumns';

export interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  filters: {
    status: string;
  };
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onToggleStatus: (customer: Customer, newStatus: Customer['status']) => Promise<void>;
  onCreateCustomer: () => void;
  onStatusFilter: (status: string) => void;
}

export function CustomersTable({
  customers,
  loading,
  error,
  hasActiveFilters,
  filters,
  onView,
  onEdit,
  onToggleStatus,
  onCreateCustomer,
  onStatusFilter,
}: CustomersTableProps) {
  const columns = React.useMemo(
    () =>
      createCustomerColumns({
        onViewCustomer: onView,
        onEditCustomer: onEdit,
        onToggleStatus,
      }),
    [onView, onEdit, onToggleStatus],
  );

  const renderFilters = () => (
    <Select value={filters.status} onValueChange={onStatusFilter}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="All Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
        <SelectItem value="blocked">Blocked</SelectItem>
      </SelectContent>
    </Select>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-4 text-destructive text-sm border-b">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="py-12 text-center text-muted-foreground">Loading…</div>
        </CardContent>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<Users className="h-12 w-12" />} title="No customers found" description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by adding your first customer'} action={!hasActiveFilters ? <Button onClick={onCreateCustomer} className="gap-2"><Plus className="h-4 w-4" />Add Customer</Button> : undefined} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns} data={customers} filterPlaceholder="Search by name, code, email, or phone..." renderFilters={renderFilters} config={{ enableRowSelection: false, enableColumnVisibility: true, enableSorting: true, enableFiltering: true, initialPageSize: 20 }} />
      </CardContent>
    </Card>
  );
}
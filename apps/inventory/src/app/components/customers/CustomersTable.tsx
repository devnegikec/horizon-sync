import * as React from 'react';

import { type Table } from '@tanstack/react-table';
import { Users, Plus } from 'lucide-react';

import { DataTable } from '@horizon-sync/ui/components/data-table/DataTable';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { Customer } from '../../types/customer.types';

import { createCustomerColumns } from './CustomerColumns';

export interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onToggleStatus: (customer: Customer, newStatus: Customer['status']) => Promise<void>;
  onCreateCustomer: () => void;
  onTableReady?: (table: Table<Customer>) => void;
}

export function CustomersTable({
  customers,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onToggleStatus,
  onCreateCustomer,
  onTableReady,
}: CustomersTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<Customer> | null>(null);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const columns = React.useMemo(
    () =>
      createCustomerColumns({
        onViewCustomer: onView,
        onEditCustomer: onEdit,
        onToggleStatus,
      }),
    [onView, onEdit, onToggleStatus],
  );

  const renderViewOptions = (table: Table<Customer>) => {
    // Set table instance in state, which will trigger useEffect
    if (table !== tableInstance) {
      setTableInstance(table);
    }
    return null; // Don't render anything in the table
  };

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
        <DataTable<Customer, unknown> 
          columns={columns} 
          data={customers} 
          config={{ 
            showSerialNumber: true, 
            showPagination: true, 
            enableRowSelection: false, 
            enableColumnVisibility: true, 
            enableSorting: true, 
            enableFiltering: true, 
            initialPageSize: 20 
          }} 
          filterPlaceholder="Search by name, code, email, or phone..." 
          renderViewOptions={renderViewOptions}
          fixedHeader 
          maxHeight="600px" 
        />
      </CardContent>
    </Card>
  );
}
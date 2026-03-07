import * as React from 'react';

import { type Table } from '@tanstack/react-table';
import { Users, Plus } from 'lucide-react';

import { DataTable } from '@horizon-sync/ui/components/data-table/DataTable';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { TableSkeleton } from '@horizon-sync/ui/components/ui/table-skeleton';

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
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    customer: Customer | null;
    newStatus: Customer['status'] | null;
  }>({ open: false, customer: null, newStatus: null });
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const handleToggleStatus = React.useCallback(
    (customer: Customer, newStatus: Customer['status']) => {
      setConfirmDialog({ open: true, customer, newStatus });
    },
    [],
  );

  const handleConfirmToggle = React.useCallback(async () => {
    if (!confirmDialog.customer || !confirmDialog.newStatus) return;
    setConfirmLoading(true);
    try {
      await onToggleStatus(confirmDialog.customer, confirmDialog.newStatus);
    } finally {
      setConfirmLoading(false);
      setConfirmDialog({ open: false, customer: null, newStatus: null });
    }
  }, [confirmDialog, onToggleStatus]);

  const confirmMeta = React.useMemo(() => {
    const status = confirmDialog.newStatus;
    const name = confirmDialog.customer?.customer_name;
    switch (status) {
      case 'blocked':
        return { title: 'Block Customer', description: `Are you sure you want to block "${name}"? They will not be available for new transactions.`, confirmLabel: 'Block', variant: 'destructive' as const };
      case 'inactive':
        return { title: 'Deactivate Customer', description: `Are you sure you want to deactivate "${name}"?`, confirmLabel: 'Deactivate', variant: 'destructive' as const };
      case 'active':
        return { title: 'Activate Customer', description: `Are you sure you want to activate "${name}"?`, confirmLabel: 'Activate', variant: 'default' as const };
      default:
        return { title: 'Confirm', description: 'Are you sure?', confirmLabel: 'Confirm', variant: 'default' as const };
    }
  }, [confirmDialog]);

  const columns = React.useMemo(
    () =>
      createCustomerColumns({
        onViewCustomer: onView,
        onEditCustomer: onEdit,
        onToggleStatus: handleToggleStatus,
      }),
    [onView, onEdit, handleToggleStatus],
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
          <TableSkeleton columns={8} rows={10} showHeader={true} />
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
    <>
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} 
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
            maxHeight="600px"/>
        </CardContent>
      </Card>
      <ConfirmationDialog open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, customer: null, newStatus: null });
        }}
        title={confirmMeta.title}
        description={confirmMeta.description}
        confirmLabel={confirmMeta.confirmLabel}
        variant={confirmMeta.variant}
        loading={confirmLoading}
        onConfirm={handleConfirmToggle} />
    </>
  );
}
import * as React from 'react';

import { type Table } from '@tanstack/react-table';
import { Users, Plus, Download, CreditCard, AlertTriangle, UserCheck, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { cn } from '@horizon-sync/ui/lib';

import { useCustomerActions } from '../../hooks/useCustomerActions';
import { useCustomers } from '../../hooks/useCustomers';
import type { Customer } from '../../types/customer.types';
import { customerApi } from '../../utility/api';

import { CustomerDetailDialog } from './CustomerDetailDialog';
import { CustomerDialog } from './CustomerDialog';
import { CustomersTable } from './CustomersTable';

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

export function CustomerManagement() {
  const { toast } = useToast();
  const accessToken = useUserStore((s) => s.accessToken);

  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 20,
  });

  const { customers, pagination, loading, error, refetch } = useCustomers({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search,
    status: filters.status,
  });

  const { updateStatus } = useCustomerActions();

  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [tableInstance, setTableInstance] = React.useState<Table<Customer> | null>(null);

  const stats = React.useMemo(() => {
    if (!pagination) {
      return { totalCustomers: 0, activeCustomers: 0, totalCredit: 0, creditAlerts: 0 };
    }

    const totalCustomers = pagination.total_items;
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const totalCredit = customers.reduce((sum, c) => sum + parseFloat(c.credit_limit), 0);
    const creditAlerts = customers.filter((c) => {
      const balance = parseFloat(c.outstanding_balance);
      const limit = parseFloat(c.credit_limit);
      return limit > 0 && balance / limit > 0.9;
    }).length;

    return { totalCustomers, activeCustomers, totalCredit, creditAlerts };
  }, [customers, pagination]);

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setCustomerDialogOpen(true);
  };

  const handleEditCustomer = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDialogOpen(true);
  }, []);

  const handleViewCustomer = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
  }, []);

  const handleToggleStatus = React.useCallback(
    async (customer: Customer, newStatus: Customer['status']) => {
      await updateStatus(customer, newStatus, refetch);
    },
    [updateStatus, refetch]
  );

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (selectedCustomer) {
        // Update existing customer
        await customerApi.update(accessToken, selectedCustomer.id, customerData);
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        });
      } else {
        // Create new customer
        await customerApi.create(accessToken, customerData);
        toast({
          title: 'Success',
          description: 'Customer created successfully',
        });
      }

      // Refresh the table data
      refetch();
      setCustomerDialogOpen(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save customer',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusFilter = React.useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const handleTableReady = (table: Table<Customer>) => {
    setTableInstance(table);
  };

  const filteredCustomers = React.useMemo(() => {
    return customers; // Filtering is handled by the API based on filters
  }, [customers]);

  const hasActiveFilters = filters.search !== '' || filters.status !== 'all';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-1">Manage customer information, credit terms, and pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateCustomer} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Error loading customers: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active Customers" value={stats.activeCustomers} icon={UserCheck} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Total Credit Extended" value={`$${stats.totalCredit.toLocaleString()}`} icon={CreditCard} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard title="Credit Alerts" value={stats.creditAlerts} icon={AlertTriangle} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80"
            placeholder="Search by name, code, email, or phone..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
          <div className="flex gap-3">
            <Select value={filters.status} onValueChange={handleStatusFilter}>
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
          </div>
        </div>
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Customers Table */}
      <CustomersTable customers={filteredCustomers} loading={loading} error={error} hasActiveFilters={hasActiveFilters} onView={handleViewCustomer} onEdit={handleEditCustomer} onToggleStatus={handleToggleStatus} onCreateCustomer={handleCreateCustomer} onTableReady={handleTableReady} />

      {/* Dialogs */}
      <CustomerDialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen} customer={selectedCustomer} onSave={handleSaveCustomer} saving={saving} />
      <CustomerDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} customer={selectedCustomer} />
    </div>
  );
}

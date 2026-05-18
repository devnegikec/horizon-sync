import * as React from 'react';

import { type Table } from '@tanstack/react-table';
import { Users, Plus, Download, Upload, Loader2, CreditCard, AlertTriangle, UserCheck, RefreshCw, ChevronDown, FileDown } from 'lucide-react';

import { useUserStore, useCurrencyStore } from '@horizon-sync/store';
import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { cn } from '@horizon-sync/ui/lib';

import { useCustomerActions } from '../../hooks/useCustomerActions';
import { useCustomers } from '../../hooks/useCustomers';
import type { Customer } from '../../types/customer.types';
import { getCurrencySymbol } from '../../types/currency.types';
import { customerApi } from '../../utility/api';
import { ErrorBanner } from '../common';

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

  const [isExporting, setIsExporting] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleExport = React.useCallback(async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const blob = await customerApi.bulkExport(accessToken, {
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'customers_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Success', description: 'Customers exported successfully' });
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: err instanceof Error ? err.message : 'Failed to export customers',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [accessToken, filters, toast]);

  const handleDownloadTemplate = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const blob = await customerApi.downloadTemplate(accessToken);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'customers-import-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to download template',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleImportSubmit = React.useCallback(async () => {
    if (!selectedFile || !accessToken) {
      toast({ title: 'Error', description: 'Please select a file', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    try {
      const result = await customerApi.bulkImport(accessToken, selectedFile);

      setIsImportDialogOpen(false);
      setSelectedFile(null);

      const message = result.total_rows > 0
        ? `${result.successful_rows} of ${result.total_rows} customer(s) imported successfully${result.failed_rows > 0 ? `. ${result.failed_rows} row(s) failed.` : '.'}`
        : 'Import completed successfully.';

      toast({ title: 'Import Successful', description: message });

      // Refresh customer list
      setTimeout(() => refetch(), 500);
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to import file. Please check the format and try again.';
      toast({ title: 'Import Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, accessToken, toast, refetch]);

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
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency || 'INR');

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Export/Import
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Customers'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4" />
                Import Customers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleCreateCustomer} variant="default" className="gap-2 text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && <ErrorBanner entity="customers" message={error} />}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active Customers" value={stats.activeCustomers} icon={UserCheck} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Total Credit Extended" value={`${currencySymbol} ${stats.totalCredit.toLocaleString()}`} icon={CreditCard} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Customers</DialogTitle>
            <DialogDescription>
              Upload a file to import customers. Supported formats: CSV, Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Template download section */}
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-4">
              <div>
                <p className="font-medium text-sm">Need a template?</p>
                <p className="text-sm text-muted-foreground">Download the sample file to see the required format.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleDownloadTemplate}>
                <FileDown className="h-4 w-4" />
                Sample CSV
              </Button>
            </div>

            {/* File upload drop zone */}
            <div>
              <p className="font-medium text-sm mb-2">Select File</p>
              <label
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 cursor-pointer transition-colors',
                  'hover:border-primary/50 hover:bg-accent/50',
                  selectedFile && 'border-primary bg-accent/30'
                )}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                {selectedFile ? (
                  <>
                    <p className="text-sm font-medium text-primary">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-primary">Click to select file</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV or Excel (.csv, .xlsx, .xls)</p>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isImporting}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportDialogOpen(false); setSelectedFile(null); }}>
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} disabled={!selectedFile || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

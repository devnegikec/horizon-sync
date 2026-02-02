import * as React from 'react';

import {
  Users,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Power,
  PowerOff,
  Pause,
  Building2,
  CreditCard,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { cn } from '@horizon-sync/ui/lib';

import { mockCustomers } from '../../data/customers.mock';
import type { Customer, CustomerFilters } from '../../types/customer.types';

import { CustomerDetailDialog } from './CustomerDetailDialog';
import { CustomerDialog } from './CustomerDialog';

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

export function CustomerManagement() {
  const [customers, setCustomers] = React.useState<Customer[]>(mockCustomers);
  const [filters, setFilters] = React.useState<CustomerFilters>({
    search: '',
    status: 'all',
  });
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        filters.search === '' ||
        customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.customerCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.phone.includes(filters.search);

      const matchesStatus =
        filters.status === 'all' || customer.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [customers, filters]);

  const stats = React.useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const totalCredit = customers.reduce((sum, c) => sum + c.creditLimit, 0);
    const creditAlerts = customers.filter(
      (c) => c.currentBalance / c.creditLimit > 0.9 && c.creditLimit > 0
    ).length;

    return { totalCustomers, activeCustomers, totalCredit, creditAlerts };
  }, [customers]);

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setCustomerDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDialogOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
  };

  const handleToggleStatus = (customer: Customer, newStatus: Customer['status']) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? { ...c, status: newStatus, updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    if (selectedCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? { ...c, ...customerData, updatedAt: new Date().toISOString() }
            : c
        )
      );
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        customerCode: customerData.customerCode || '',
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        billingAddress: customerData.billingAddress || {
          id: Date.now().toString(),
          label: 'Main',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'USA',
        },
        shippingAddresses: customerData.shippingAddresses || [],
        creditLimit: customerData.creditLimit || 0,
        currentBalance: 0,
        paymentTerms: customerData.paymentTerms || 'Net 30',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCustomers((prev) => [newCustomer, ...prev]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer information, credit terms, and pricing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateCustomer}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"/>
        <StatCard title="Active Customers"
          value={stats.activeCustomers}
          icon={UserCheck}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"/>
        <StatCard title="Total Credit Extended"
          value={`$${stats.totalCredit.toLocaleString()}`}
          icon={CreditCard}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"/>
        <StatCard title="Credit Alerts"
          value={stats.creditAlerts}
          icon={AlertTriangle}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"/>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput className="sm:w-80"
          placeholder="Search by name, code, email, or phone..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
        <Select value={filters.status}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, status: value }))
          }>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={<Users className="h-12 w-12" />}
                      title="No customers found"
                      description={
                        filters.search || filters.status !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Get started by adding your first customer'
                      }
                      action={
                        !filters.search &&
                        filters.status === 'all' && (
                          <Button onClick={handleCreateCustomer} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Customer
                          </Button>
                        )
                      }/>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const creditUtilization =
                    customer.creditLimit > 0
                      ? (customer.currentBalance / customer.creditLimit) * 100
                      : 0;
                  const statusBadge = getStatusBadge(customer.status);

                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <code className="text-xs text-muted-foreground">
                              {customer.customerCode}
                            </code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.email}</p>
                          <p className="text-muted-foreground">{customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${customer.creditLimit.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                                'font-medium',
                                creditUtilization > 90 && 'text-destructive'
                              )}>
                              ${customer.currentBalance.toLocaleString()}
                            </span>
                            {creditUtilization > 90 && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div className={cn(
                                'h-full rounded-full',
                                creditUtilization > 90
                                  ? 'bg-destructive'
                                  : creditUtilization > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min(creditUtilization, 100)}%` }}/>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.paymentTerms}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {customer.status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => handleToggleStatus(customer, 'on-hold')}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Put On Hold
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(customer, 'inactive')}>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              </>
                            )}
                            {customer.status === 'inactive' && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(customer, 'active')}>
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {customer.status === 'on-hold' && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(customer, 'active')}>
                                <Power className="mr-2 h-4 w-4" />
                                Remove Hold
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CustomerDialog open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}/>
      <CustomerDetailDialog open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        customer={selectedCustomer}/>
    </div>
  );
}

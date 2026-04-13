import { useState, useEffect, useMemo } from 'react';

import { type Table } from '@tanstack/react-table';
import { Building2, CheckCircle, XCircle, Clock, Download, Plus } from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  DataTableViewOptions,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  OrganizationsTable,
  CreateOrgModal,
  OrgDetailModal,
} from '@horizon-sync/ui/components';
import type { OrganizationsTableOrg, CreateOrgFormData, OrgDetailEditData } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { toast } from '@horizon-sync/ui';

import { useCreateOrganization } from '../hooks/useCreateOrganization';
import { useOrganization, useUpdateOrganization } from '../hooks/useOrganization';
import { useOrganizations } from '../hooks/useOrganizations';
import { usePermissions } from '../hooks/usePermissions';
import type { AdminOrgFilters, AdminOrgListItem, OrgStatus } from '../types';
import { SYSTEM_ADMIN_PERMISSIONS } from '../types/permissions';

const PAGE_SIZE = 20;

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

export function OrganizationsPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(SYSTEM_ADMIN_PERMISSIONS.ORGANIZATIONS_CREATE);
  const canUpdate = hasPermission(SYSTEM_ADMIN_PERMISSIONS.ORGANIZATIONS_UPDATE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [tableInstance, setTableInstance] = useState<Table<AdminOrgListItem> | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  // Fetch org detail when selected
  const { data: selectedOrgData, isLoading: selectedOrgLoading } = useOrganization(selectedOrgId ?? '');

  const filters: AdminOrgFilters = useMemo(() => ({
    ...(search ? { search } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter as OrgStatus } : {}),
    page,
    page_size: pageSize,
  }), [search, statusFilter, page, pageSize]);

  const { data, isLoading } = useOrganizations(filters);

  // Reset to first page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const orgs = data?.organizations ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? orgs.length;
    const active = orgs.filter(o => o.status === 'active').length;
    const inactive = orgs.filter(o => o.status === 'inactive').length;
    const trial = orgs.filter(o => o.status === 'trial').length;
    return { total, active, inactive, trial };
  }, [orgs, pagination]);

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: page - 1,
    pageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    },
  }), [page, pageSize, pagination?.total_items]);

  const handleView = (org: AdminOrgListItem) => {
    setSelectedOrgId(org.id);
    setDetailModalOpen(true);
  };
  const handleEdit = (org: AdminOrgListItem) => {
    setSelectedOrgId(org.id);
    setDetailModalOpen(true);
  };

  const handleUpdateOrg = async (orgId: string, data: OrgDetailEditData) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        {
          id: orgId,
          data: {
            name: data.name,
            display_name: data.display_name || null,
            description: data.description || null,
            email: data.email || null,
            phone: data.phone || null,
            website: data.website || null,
            organization_type: data.organization_type as any,
            industry: data.industry || null,
            base_currency: data.base_currency || undefined,
            status: data.status as any,
            country: data.country || null,
          },
        },
        {
          onSuccess: () => {
            toast({ title: 'Organization updated', description: 'Changes saved successfully.' });
            resolve();
          },
          onError: (error: any) => {
            reject(error.data?.detail ? new Error(typeof error.data.detail === 'string' ? error.data.detail : 'Failed to update') : error);
          },
        }
      );
    });
  };

  const handleCreateOrg = async (data: CreateOrgFormData) => {
    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(
        {
          name: data.name,
          slug: data.slug,
          display_name: data.display_name || null,
          description: data.description || null,
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          organization_type: (data.organization_type as any) || 'business',
          industry: data.industry || null,
          base_currency: data.base_currency || undefined,
          status: (data.status as any) || 'active',
          country: data.country || null,
        },
        {
          onSuccess: (created) => {
            toast({ title: 'Organization created', description: `${created.name} has been created.` });
            resolve();
          },
          onError: (error: any) => {
            reject(error.data?.detail ? new Error(typeof error.data.detail === 'string' ? error.data.detail : 'Failed to create organization') : error);
          },
        }
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-muted-foreground mt-1">Manage all organizations on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canCreate && (
            <Button onClick={() => setCreateModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25">
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Organizations" value={stats.total}
          icon={Building2} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active" value={stats.active}
          icon={CheckCircle} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Inactive" value={stats.inactive}
          icon={XCircle} iconBg="bg-red-100 dark:bg-red-900/20" iconColor="text-red-600 dark:text-red-400" />
        <StatCard title="Trial" value={stats.trial}
          icon={Clock} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80"
            placeholder="Search by name or slug..."
            onSearch={(value) => setSearch(value)} />
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Organizations Table */}
      <OrganizationsTable
        orgs={orgs as (AdminOrgListItem & OrganizationsTableOrg)[]}
        loading={isLoading}
        error={null}
        hasActiveFilters={!!search || statusFilter !== 'all'}
        onView={handleView}
        onEdit={canUpdate ? handleEdit : undefined}
        onCreateOrg={canCreate ? () => setCreateModalOpen(true) : undefined}
        onTableReady={(table) => setTableInstance(table as Table<AdminOrgListItem>)}
        serverPagination={serverPaginationConfig}
      />

      {/* Create Organization Modal */}
      <CreateOrgModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateOrg}
      />

      {/* Organization Detail / Edit Modal */}
      <OrgDetailModal
        open={detailModalOpen}
        onOpenChange={(open) => { setDetailModalOpen(open); if (!open) setSelectedOrgId(null); }}
        org={selectedOrgData ?? null}
        loading={selectedOrgLoading}
        onUpdate={canUpdate ? handleUpdateOrg : undefined}
      />
    </div>
  );
}

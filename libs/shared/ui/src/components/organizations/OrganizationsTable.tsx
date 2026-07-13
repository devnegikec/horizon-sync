import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Building2, MoreHorizontal, Eye, Edit, Plus } from 'lucide-react';

import { DataTable, DataTableColumnHeader } from '../data-table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { EmptyState } from '../ui/empty-state';
import { TableSkeleton } from '../ui/table-skeleton';

export type OrgStatus = 'active' | 'inactive' | 'suspended' | 'trial';

/** Minimal org shape the table needs. */
export interface OrganizationsTableOrg {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  organization_type: string;
  is_active: boolean;
  created_at: string;
  display_name?: string | null;
  user_count?: number;
  email?: string | null;
}

export interface OrganizationsTableProps<T extends OrganizationsTableOrg = OrganizationsTableOrg> {
  orgs: T[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView?: (org: T) => void;
  onEdit?: (org: T) => void;
  onCreateOrg?: () => void;
  onTableReady?: (table: Table<T>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

function getOrgStatusBadge(status: OrgStatus): { variant: 'success' | 'secondary' | 'destructive' | 'outline'; label: string } {
  switch (status) {
    case 'active':
      return { variant: 'success', label: 'Active' };
    case 'inactive':
      return { variant: 'secondary', label: 'Inactive' };
    case 'suspended':
      return { variant: 'destructive', label: 'Suspended' };
    case 'trial':
      return { variant: 'outline', label: 'Trial' };
    default:
      return { variant: 'secondary', label: status };
  }
}

function getOrgTypeBadge(orgType: string): { variant: 'default' | 'secondary' | 'outline'; label: string } {
  switch (orgType) {
    case 'enterprise':
      return { variant: 'default', label: 'Enterprise' };
    case 'business':
      return { variant: 'secondary', label: 'Business' };
    case 'startup':
      return { variant: 'outline', label: 'Startup' };
    case 'individual':
      return { variant: 'outline', label: 'Individual' };
    default:
      return { variant: 'outline', label: orgType };
  }
}

function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function OrganizationsTable<T extends OrganizationsTableOrg = OrganizationsTableOrg>({
  orgs,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onCreateOrg,
  onTableReady,
  serverPagination,
}: OrganizationsTableProps<T>) {
  const [tableInstance, setTableInstance] = React.useState<Table<T> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;
    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.pageIndex + 1,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPaginationChange(page - 1, pageSize);
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<T, unknown>[] = React.useMemo(() => {
    const cols: ColumnDef<T, unknown>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
          const org = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="text-sm text-muted-foreground">{org.slug}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'organization_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const typeBadge = getOrgTypeBadge(row.original.organization_type);
          return <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const statusBadge = getOrgStatusBadge(row.original.status);
          return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => <span className="text-sm">{formatShortDate(row.original.created_at)}</span>,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const org = row.original;
          const hasActions = onView || onEdit;
          if (!hasActions) return null;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(org)}>
                      <Eye className="mr-2 h-4 w-4" />View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(org)}>
                      <Edit className="mr-2 h-4 w-4" />Edit
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ];
    return cols;
  }, [onView, onEdit]);

  const renderViewOptions = (table: Table<T>) => {
    if (table !== tableInstance) setTableInstance(table);
    return null;
  };

  if (error) {
    return (
      <Card><CardContent className="p-0">
        <div className="p-4 text-destructive text-sm border-b">{error}</div>
      </CardContent></Card>
    );
  }

  if (loading) {
    return (
      <Card><CardContent className="p-0">
        <TableSkeleton columns={6} rows={10} showHeader />
      </CardContent></Card>
    );
  }

  if (orgs.length === 0) {
    return (
      <Card><CardContent className="p-0"><div className="p-6">
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No organizations found"
          description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first organization'}
          action={!hasActiveFilters && onCreateOrg ? (
            <Button onClick={onCreateOrg} className="gap-2">
              <Plus className="h-4 w-4" />Create Organization
            </Button>
          ) : undefined}
        />
      </div></CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-0">
      <DataTable
        columns={columns}
        data={orgs}
        config={{
          showSerialNumber: true,
          showPagination: true,
          enableRowSelection: false,
          enableColumnVisibility: true,
          enableSorting: true,
          enableFiltering: false,
          initialPageSize: serverPagination?.pageSize ?? 20,
          serverPagination: serverPaginationConfig,
        }}
        filterPlaceholder="Search organizations..."
        renderViewOptions={renderViewOptions}
        fixedHeader
        maxHeight="auto"
      />
    </CardContent></Card>
  );
}

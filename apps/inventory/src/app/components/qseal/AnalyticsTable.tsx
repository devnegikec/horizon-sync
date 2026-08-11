import * as React from 'react';

import type { ColumnDef } from '@tanstack/react-table';
import { ScanLine } from 'lucide-react';

import { Badge, Card, CardContent } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { AnalyticsScanEvent } from '../../types/qseal.types';
import { formatDate } from '../../utility/formatDate';

const CTA_LABELS: Record<string, string> = {
  view_product: 'View Product',
  visit_website: 'Visit Website',
  verify_auth: 'Verify Auth',
  call_support: 'Call Support',
};

const CTA_COLORS: Record<string, string> = {
  view_product: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  visit_website: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  verify_auth: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
  call_support: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
};

interface AnalyticsTableProps {
  events: AnalyticsScanEvent[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  serverPagination?: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
  };
}

export function AnalyticsTable({
  events,
  loading,
  error,
  hasActiveFilters,
  serverPagination,
}: AnalyticsTableProps) {
  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;
    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.currentPage,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPageChange(page, pageSize);
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<AnalyticsScanEvent, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'scan_timestamp',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">
            {formatDate(row.original.scan_timestamp, 'DD-MMM-YY', { includeTime: true })}
          </span>
        ),
      },
      {
        accessorKey: 'serial_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Serial" />,
        cell: ({ row }) => (
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {row.original.serial_number}
          </code>
        ),
      },
      {
        accessorKey: 'cta_action',
        header: ({ column }) => <DataTableColumnHeader column={column} title="CTA" />,
        cell: ({ row }) => {
          const action = row.original.cta_action;
          if (!action) return <span className="text-muted-foreground">—</span>;
          return (
            <Badge variant="secondary" className={CTA_COLORS[action] || ''}>
              {CTA_LABELS[action] || action}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'device_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Device" />,
        cell: ({ row }) => {
          const device = row.original.device_type;
          const os = row.original.os;
          if (!device) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-sm">
              {device.charAt(0).toUpperCase() + device.slice(1)}
              {os && <span className="text-muted-foreground"> · {os}</span>}
            </span>
          );
        },
      },
      {
        accessorKey: 'country',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
        cell: ({ row }) => {
          const city = row.original.city;
          const country = row.original.country;
          if (!city && !country) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-sm">
              {city && country ? `${city}, ${country}` : city || country}
            </span>
          );
        },
      },
      {
        accessorKey: 'referrer_url',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Referrer" />,
        cell: ({ row }) => {
          const url = row.original.referrer_url;
          if (!url) return <span className="text-muted-foreground">—</span>;
          const truncated = url.length > 40 ? url.slice(0, 40) + '…' : url;
          return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block max-w-[200px]">
              {truncated}
            </a>
          );
        },
      },
    ],
    [],
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3058EE] mx-auto mb-4" />
              <p className="text-muted-foreground">Loading scan events...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState icon={<ScanLine className="h-12 w-12" />} title="No scan events yet" description={hasActiveFilters ? 'Try adjusting your date range' : 'QR scan events will appear here once consumers start scanning your product QR codes.'} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns} data={events} config={{ showSerialNumber: true, showPagination: true, enableRowSelection: false, enableColumnVisibility: true, enableSorting: true, enableFiltering: false, initialPageSize: serverPagination?.pageSize ?? 20, serverPagination: serverPaginationConfig }} maxHeight="auto" />
      </CardContent>
    </Card>
  );
}

import { useState, useMemo, useCallback } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { QrCode, Plus, Users, HardHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  Button,
  SearchInput,
  DataTable,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useWorkers } from '../hooks/useWorkers';
import type { AdminWorkerListItem } from '../types';
import { WorkerQRCodeModal } from '../components/workers/WorkerQRCodeModal';

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

export function WorkersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<{
    id: string;
    name: string;
    email: string;
    qrCode?: string;
  } | null>(null);

  const { data, isLoading, isError } = useWorkers({
    search: search || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const workers = data?.users ?? [];
  const pagination = data?.pagination;
  const totalWorkers = pagination?.total_items ?? 0;
  const activeWorkers = useMemo(
    () => workers.filter((w) => w.is_active).length,
    [workers]
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleQRClick = useCallback((worker: AdminWorkerListItem) => {
    setSelectedWorker({
      id: worker.id,
      name: `${worker.first_name} ${worker.last_name}`,
      email: worker.email,
      qrCode: worker.qr_code,
    });
    setQrModalOpen(true);
  }, []);

  const serverPaginationConfig = useMemo(() => ({
    totalItems: pagination?.total_items ?? 0,
    currentPage: pagination?.page ?? 1,
    pageSize: PAGE_SIZE,
    onPageChange: (newPage: number, _newPageSize: number) => {
      setPage(newPage);
    },
  }), [pagination]);

  const columns: ColumnDef<AdminWorkerListItem, unknown>[] = useMemo(() => [
    {
      accessorKey: 'display_name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '—',
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            row.original.is_active
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
          )}
        >
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'qr_code',
      header: 'QR Code',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleQRClick(row.original);
          }}
          title="View QR Code"
        >
          <QrCode className="h-4 w-4 text-violet-600" />
        </Button>
      ),
    },
  ], [handleQRClick]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warehouse Workers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage warehouse workers who log in via QR code
          </p>
        </div>
        <Button onClick={() => navigate('/workers/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Worker
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Workers"
          value={totalWorkers}
          icon={Users}
          iconBg="bg-violet-50 dark:bg-violet-950"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          title="Active Workers"
          value={activeWorkers}
          icon={HardHat}
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Inactive"
          value={totalWorkers - activeWorkers}
          icon={QrCode}
          iconBg="bg-amber-50 dark:bg-amber-950"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Search & Table */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <SearchInput
              placeholder="Search workers by name or email..."
              onSearch={handleSearch}
            />
          </div>

          {isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive font-medium">Failed to load workers</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again later.
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={workers}
              config={{
                showPagination: totalWorkers > 0,
                serverPagination: serverPaginationConfig,
                enableColumnVisibility: false,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {selectedWorker && (
        <WorkerQRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          userId={selectedWorker.id}
          workerName={selectedWorker.name}
          workerEmail={selectedWorker.email}
          qrCodeString={selectedWorker.qrCode}
        />
      )}
    </div>
  );
}

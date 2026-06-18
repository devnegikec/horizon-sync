import * as React from 'react';

import { Users, Plus } from 'lucide-react';

import { DataTable } from '@horizon-sync/ui/components/data-table/DataTable';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { TableSkeleton } from '@horizon-sync/ui/components/ui/table-skeleton';

import type { WMSWorker } from '../../types/wms.types';
import { createWorkerColumns } from './WorkerColumns';

export interface WorkersTableProps {
  workers: WMSWorker[];
  loading: boolean;
  onEdit: (worker: WMSWorker) => void;
  onDelete: (worker: WMSWorker) => void;
  onPrintQR: (worker: WMSWorker) => void;
  onRegenerateQR: (worker: WMSWorker) => void;
  onCreateWorker: () => void;
  hasSearch: boolean;
}

export function WorkersTable({
  workers,
  loading,
  onEdit,
  onDelete,
  onPrintQR,
  onRegenerateQR,
  onCreateWorker,
  hasSearch,
}: WorkersTableProps) {
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    worker: WMSWorker | null;
    action: 'delete' | 'regenerate' | null;
  }>({ open: false, worker: null, action: null });
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  const handleDeleteClick = React.useCallback((worker: WMSWorker) => {
    setConfirmDialog({ open: true, worker, action: 'delete' });
  }, []);

  const handleRegenerateClick = React.useCallback((worker: WMSWorker) => {
    setConfirmDialog({ open: true, worker, action: 'regenerate' });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (!confirmDialog.worker || !confirmDialog.action) return;
    setConfirmLoading(true);
    try {
      if (confirmDialog.action === 'delete') {
        onDelete(confirmDialog.worker);
      } else {
        onRegenerateQR(confirmDialog.worker);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmDialog({ open: false, worker: null, action: null });
    }
  }, [confirmDialog, onDelete, onRegenerateQR]);

  const confirmMeta = React.useMemo(() => {
    const name = confirmDialog.worker?.display_name || `${confirmDialog.worker?.first_name ?? ''} ${confirmDialog.worker?.last_name ?? ''}`.trim();
    if (confirmDialog.action === 'delete') {
      return {
        title: 'Disable Worker',
        description: `Are you sure you want to disable "${name}"? They will no longer be able to log in or receive tasks.`,
        confirmLabel: 'Disable',
        variant: 'destructive' as const,
      };
    }
    return {
      title: 'Regenerate QR Code',
      description: `Are you sure you want to regenerate the QR code for "${name}"? The current QR code will stop working immediately.`,
      confirmLabel: 'Regenerate',
      variant: 'destructive' as const,
    };
  }, [confirmDialog]);

  const columns = React.useMemo(
    () =>
      createWorkerColumns({
        onEdit,
        onDelete: handleDeleteClick,
        onPrintQR,
        onRegenerateQR: handleRegenerateClick,
      }),
    [onEdit, handleDeleteClick, onPrintQR, handleRegenerateClick],
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={7} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (workers.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No workers found"
              description={hasSearch ? 'Try adjusting your search' : 'Get started by adding your first warehouse worker'}
              action={
                !hasSearch ? (
                  <Button onClick={onCreateWorker} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Worker
                  </Button>
                ) : undefined
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={workers}
            config={{
              showSerialNumber: true,
              showPagination: true,
              enableRowSelection: false,
              enableColumnVisibility: true,
              enableSorting: true,
              enableFiltering: true,
              initialPageSize: 20,
            }}
            filterPlaceholder="Search by name, email, username, or employee ID..."
            fixedHeader
            maxHeight="600px"
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, worker: null, action: null });
        }}
        title={confirmMeta.title}
        description={confirmMeta.description}
        confirmLabel={confirmMeta.confirmLabel}
        variant={confirmMeta.variant}
        loading={confirmLoading}
        onConfirm={handleConfirm}
      />
    </>
  );
}

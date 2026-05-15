import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Card, CardContent } from '@horizon-sync/ui/components';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { usePickListManagement } from '../../hooks/usePickListManagement';
import type { PickList } from '../../types/pick-list.types';
import type { DeliveryNoteCreate, DeliveryNoteUpdate } from '../../types/delivery-note.types';
import { pickListApi } from '../../utility/api/pick-lists';
import { smartPickingApi } from '../../utility/api/smart-picking';

import { DeliveryNoteDialog } from '../delivery-notes/DeliveryNoteDialog';
import { PickListDetailDialog } from './PickListDetailDialog';
import { PickListDialog } from './PickListDialog';
import { PickListManagementFilters } from './PickListManagementFilters';
import { PickListManagementHeader } from './PickListManagementHeader';
import { PickListStats } from './PickListStats';
import { PickListTable } from './PickListTable';

export function PickListManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const {
    filters,
    setFilters,
    pickLists,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedPickList,
    tableInstance,
    handleView,
    handleDelete,
    handleTableReady,
    serverPaginationConfig,
    confirmAction,
    setConfirmAction,
    executeConfirmedAction,
  } = usePickListManagement();

  const [deliveryDialogOpen, setDeliveryDialogOpen] = React.useState(false);
  const [deliveryPickList, setDeliveryPickList] = React.useState<PickList | null>(null);
  const [creatingDelivery, setCreatingDelivery] = React.useState(false);

  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editPickList, setEditPickList] = React.useState<PickList | null>(null);

  const handleEdit = React.useCallback(async (pickList: PickList) => {
    if (!accessToken) return;
    try {
      const fullPickList = await pickListApi.get(accessToken, pickList.id) as PickList;
      setEditPickList(fullPickList);
      setEditDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load pick list details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleCreateDeliveryNote = React.useCallback((pickList: PickList) => {
    setDeliveryPickList(pickList);
    setDetailDialogOpen(false);
    setDeliveryDialogOpen(true);
  }, [setDetailDialogOpen]);

  const handleCreateDeliverySubmit = React.useCallback(async (data: DeliveryNoteCreate | DeliveryNoteUpdate) => {
    if (!accessToken || !deliveryPickList) return;
    setCreatingDelivery(true);
    try {
      const result = await smartPickingApi.createDeliveryFromPickList(accessToken, {
        pick_list_id: deliveryPickList.id,
        delivery_date: (data as DeliveryNoteCreate).delivery_date || undefined,
        remarks: (data as DeliveryNoteCreate).remarks || undefined,
      });
      toast({
        title: 'Success',
        description: `Delivery Note ${result.delivery_note_no} created. ${result.stock_movements_created} stock movements recorded.`,
      });
      setDeliveryDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create delivery note',
        variant: 'destructive',
      });
    } finally {
      setCreatingDelivery(false);
    }
  }, [accessToken, toast, refetch, deliveryPickList]);

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading pick lists: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <PickListManagementHeader onRefresh={refetch} isLoading={loading} />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <PickListStats total={stats.total}
        draft={stats.draft}
        inProgress={stats.inProgress}
        completed={stats.completed}/>

      {/* Filters */}
      <PickListManagementFilters filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}/>

      {/* Pick Lists Table */}
      <PickListTable pickLists={pickLists}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      {/* Detail Dialog */}
      <PickListDetailDialog open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        pickList={selectedPickList}
        onCreateDeliveryNote={handleCreateDeliveryNote}/>

      {/* Create Delivery Note from Pick List Dialog */}
      <DeliveryNoteDialog open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        deliveryNote={null}
        pickList={deliveryPickList}
        onSave={handleCreateDeliverySubmit}
        saving={creatingDelivery}/>

      {/* Edit Pick List Dialog */}
      <PickListDialog open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        pickList={editPickList}
        onSaved={refetch}/>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.title || ''}
        description={confirmAction?.message || ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
}


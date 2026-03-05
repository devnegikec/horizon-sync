import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Card, CardContent } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { usePickListManagement } from '../../hooks/usePickListManagement';
import type { PickList } from '../../types/pick-list.types';
import { pickListApi } from '../../utility/api/pick-lists';
import { smartPickingApi } from '../../utility/api/smart-picking';

import { CreateDeliveryFromPickListDialog } from './CreateDeliveryFromPickListDialog';
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

  const handleCreateDeliverySubmit = React.useCallback(async (data: { pick_list_id: string; delivery_date?: string; remarks?: string }) => {
    if (!accessToken) return;
    setCreatingDelivery(true);
    try {
      const result = await smartPickingApi.createDeliveryFromPickList(accessToken, data);
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
  }, [accessToken, toast, refetch]);

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
      <CreateDeliveryFromPickListDialog open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        pickList={deliveryPickList}
        onCreateDelivery={handleCreateDeliverySubmit}
        creating={creatingDelivery}/>

      {/* Edit Pick List Dialog */}
      <PickListDialog open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        pickList={editPickList}
        onSaved={refetch}/>
    </div>
  );
}


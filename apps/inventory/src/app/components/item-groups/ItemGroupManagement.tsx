import { useItemGroupManagement } from '../../hooks/useItemGroupManagement';

import { ItemGroupDetailDialog } from './ItemGroupDetailDialog';
import { ItemGroupDialog } from './ItemGroupDialog';
import { ItemGroupManagementFilters } from './ItemGroupManagementFilters';
import { ItemGroupManagementHeader } from './ItemGroupManagementHeader';
import { ItemGroupsTable } from './ItemGroupsTable';
import { ItemGroupStats } from './ItemGroupStats';

export function ItemGroupManagement() {
  const {
    filters,
    setFilters,
    itemGroups,
    loading,
    error,
    refetch,
    stats,
    dialogOpen,
    setDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedGroup,
    tableInstance,
    handleCreate,
    handleEdit,
    handleView,
    handleDelete,
    handleTableReady,
    serverPaginationConfig,
  } = useItemGroupManagement();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ItemGroupManagementHeader onCreateGroup={handleCreate} />

      <ItemGroupStats total={stats.total} active={stats.active} />

      <ItemGroupManagementFilters filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}/>

      <ItemGroupsTable itemGroups={itemGroups}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateGroup={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      <ItemGroupDialog open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemGroup={selectedGroup}
        allItemGroups={itemGroups}
        onCreated={refetch}
        onUpdated={refetch}/>

      <ItemGroupDetailDialog open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        itemGroup={selectedGroup}/>
    </div>
  );
}

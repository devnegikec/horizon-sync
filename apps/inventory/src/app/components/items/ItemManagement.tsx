import { useItemManagement } from '../../hooks/useItemManagement';
import { apiItemToItem } from '../../utility';

import { ItemDetailDialog } from './ItemDetailDialog';
import { ItemDialog } from './ItemDialog';
import { ItemManagementFilters } from './ItemManagementFilters';
import { ItemManagementHeader } from './ItemManagementHeader';
import { ItemsTable } from './ItemsTable';
import { ItemStats } from './ItemStats';

export function ItemManagement() {
  const {
    filters,
    setFilters,
    items,
    itemGroups,
    loading,
    error,
    refetch,
    stats,
    itemDialogOpen,
    setItemDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedItem,
    tableInstance,
    handleCreateItem,
    handleEditItem,
    handleViewItem,
    handleToggleStatus,
    handleSaveItem,
    handleTableReady,
    serverPaginationConfig
  } = useItemManagement();

  const selectedItemAsItem = selectedItem ? apiItemToItem(selectedItem) : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ItemManagementHeader onCreateItem={handleCreateItem} />

      <ItemStats totalItems={stats.totalItems} activeItems={stats.activeItems} />

      <ItemManagementFilters filters={filters} 
        setFilters={setFilters} 
        itemGroups={itemGroups} 
        tableInstance={tableInstance}/>

      <ItemsTable items={items} 
        loading={loading} 
        error={error} 
        hasActiveFilters={!!filters.search || filters.groupId !== 'all' || filters.status !== 'all'} 
        onView={handleViewItem} 
        onEdit={handleEditItem} 
        onToggleStatus={handleToggleStatus} 
        onCreateItem={handleCreateItem} 
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      <ItemDialog open={itemDialogOpen} 
        onOpenChange={setItemDialogOpen} 
        item={selectedItemAsItem} 
        itemGroups={itemGroups} 
        onSave={handleSaveItem} 
        onCreated={refetch} 
        onUpdated={refetch}/>
      
      <ItemDetailDialog open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
        item={selectedItemAsItem}/>
    </div>
  );
}

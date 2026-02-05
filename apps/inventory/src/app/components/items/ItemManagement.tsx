import { useState } from 'react';

import { useUserStore, hasOrganization } from '@horizon-sync/store';
import { CreateOrganizationModal, OrganizationService, type CreateOrganizationPayload } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import { useItemManagement } from '../../hooks/useItemManagement';
import { apiItemToItem } from '../../utility';

import { ItemDetailDialog } from './ItemDetailDialog';
import { ItemDialog } from './ItemDialog';
import { ItemManagementFilters } from './ItemManagementFilters';
import { ItemManagementHeader } from './ItemManagementHeader';
import { ItemsTable } from './ItemsTable';
import { ItemStats } from './ItemStats';

export function ItemManagement() {
  const { user, accessToken, updateUser } = useUserStore();
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  
  const {
    filters,
    setFilters,
    items,
    itemGroups,
    refetchItemGroups,
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

  const handleCreateItemWithOrgCheck = () => {
    if (!hasOrganization(user)) {
      setCreateOrgModalOpen(true);
      return;
    }
    handleCreateItem();
  };

  const handleBulkUpload = () => {
    if (!hasOrganization(user)) {
      setCreateOrgModalOpen(true);
      return;
    }
    // TODO: Implement bulk upload functionality
    console.log('Bulk upload functionality to be implemented');
  };

  const handleCreateOrganization = async (data: any) => {
    if (!accessToken || !user) {
      throw new Error('Authentication required');
    }

    try {
      // Simple slug generation
      const slug = data.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const payload: CreateOrganizationPayload = {
        name: data.organizationName,
        display_name: data.organizationName,
        slug: slug || `org-${Math.random().toString(36).substring(2, 11)}`,
        description: data.organizationDescription || '',
        website: data.websiteUrl || '',
        industry: data.industry,
        organization_type: 'business',
        status: 'trial',
        email: user.email || '',
        phone: user.phone || '',
        extra_data: {
          company_size: data.companySize,
          logo_url: data.logoUrl,
        },
        settings: {},
      };

      const result = await OrganizationService.createOrganization(
        payload,
        accessToken,
        environment.apiBaseUrl
      );

      // Update user with organization_id if returned
      if (result && typeof result === 'object' && 'id' in result) {
        updateUser({ organization_id: result.id as string });
      }

      // Refetch items after organization creation
      refetch();
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ItemManagementHeader onCreateItem={handleCreateItemWithOrgCheck} />

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
        onCreateItem={handleCreateItemWithOrgCheck}
        onBulkUpload={handleBulkUpload}
        onCreateOrganization={() => setCreateOrgModalOpen(true)}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      <ItemDialog open={itemDialogOpen} 
        onOpenChange={setItemDialogOpen} 
        item={selectedItemAsItem} 
        itemGroups={itemGroups} 
        onSave={handleSaveItem} 
        onCreated={refetch} 
        onUpdated={refetch}
        onItemGroupsRefresh={refetchItemGroups}/>
      
      <ItemDetailDialog open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
        item={selectedItemAsItem}/>

      <CreateOrganizationModal
        open={createOrgModalOpen}
        onOpenChange={setCreateOrgModalOpen}
        onSubmit={handleCreateOrganization}
        title="Create Organization"
        description="You need to create an organization before you can manage inventory items."
      />
    </div>
  );
}

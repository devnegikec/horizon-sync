import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { ChargeTemplate, ChargeTemplateCreate, ChargeTemplateUpdate } from '../../types/charge-template.types';
import { chargeTemplateApi } from '../../api/charge-templates';
import { ChargeTemplateManagementHeader } from './ChargeTemplateManagementHeader';
import { ChargeTemplateManagementFilters } from './ChargeTemplateManagementFilters';
import { ChargeTemplatesTable } from './ChargeTemplatesTable';
import { ChargeTemplateDialog } from './ChargeTemplateDialog';
import { ChargeTemplateDetailDialog } from './ChargeTemplateDetailDialog';
import { DeleteConfirmationDialog } from '../common/DeleteConfirmationDialog';

export function ChargeTemplateManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState({
    search: '',
    charge_type: 'all' as 'all' | string,
    is_active: 'all' as 'all' | 'true' | 'false',
    page: 1,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<ChargeTemplate | null>(null);
  const [editTemplate, setEditTemplate] = React.useState<ChargeTemplate | null>(null);

  // Fetch charge templates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['charge-templates', filters],
    queryFn: () =>
      chargeTemplateApi.list(accessToken || '', filters.page, filters.pageSize, {
        charge_type: filters.charge_type !== 'all' ? filters.charge_type : undefined,
        is_active: filters.is_active !== 'all' ? filters.is_active === 'true' : undefined,
      }),
    enabled: !!accessToken,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ChargeTemplateCreate) => chargeTemplateApi.create(accessToken || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-templates'] });
      toast({ title: 'Success', description: 'Charge template created successfully' });
      setCreateDialogOpen(false);
      setEditTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChargeTemplateUpdate }) =>
      chargeTemplateApi.update(accessToken || '', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-templates'] });
      toast({ title: 'Success', description: 'Charge template updated successfully' });
      setCreateDialogOpen(false);
      setEditTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => chargeTemplateApi.delete(accessToken || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-templates'] });
      toast({ title: 'Success', description: 'Charge template deleted successfully' });
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleView = (template: ChargeTemplate) => {
    setSelectedTemplate(template);
    setDetailDialogOpen(true);
  };

  const handleCreate = () => {
    setEditTemplate(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (template: ChargeTemplate) => {
    setEditTemplate(template);
    setCreateDialogOpen(true);
  };

  const handleDelete = (template: ChargeTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTemplate) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  const handleSave = async (data: ChargeTemplateCreate | ChargeTemplateUpdate, id?: string) => {
    if (id) {
      await updateMutation.mutateAsync({ id, data: data as ChargeTemplateUpdate });
    } else {
      await createMutation.mutateAsync(data as ChargeTemplateCreate);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const templates = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <ChargeTemplateManagementHeader onCreateNew={handleCreate} onRefresh={() => refetch()} loading={isLoading} />

      <ChargeTemplateManagementFilters filters={filters} onFilterChange={handleFilterChange} />

      <ChargeTemplatesTable
        templates={templates}
        loading={isLoading}
        error={error?.message || null}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateTemplate={handleCreate}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      <ChargeTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        template={editTemplate}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <ChargeTemplateDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        template={selectedTemplate}
        onEdit={handleEdit}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Charge Template"
        description={`Are you sure you want to delete charge template "${selectedTemplate?.template_name}"? This action cannot be undone.`}
      />
    </div>
  );
}

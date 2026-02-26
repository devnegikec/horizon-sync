import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { TaxTemplate, TaxTemplateCreate, TaxTemplateUpdate } from '../../types/tax-template.types';
import { taxTemplateApi } from '../../api/tax-templates';
import { TaxTemplateManagementHeader } from './TaxTemplateManagementHeader';
import { TaxTemplateManagementFilters } from './TaxTemplateManagementFilters';
import { TaxTemplatesTable } from './TaxTemplatesTable';
import { TaxTemplateDialog } from './TaxTemplateDialog';
import { TaxTemplateDetailDialog } from './TaxTemplateDetailDialog';
import { DeleteConfirmationDialog } from '../common/DeleteConfirmationDialog';

export function TaxTemplateManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState({
    search: '',
    tax_category: 'all' as 'all' | 'Input' | 'Output',
    is_active: 'all' as 'all' | 'true' | 'false',
    page: 1,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<TaxTemplate | null>(null);
  const [editTemplate, setEditTemplate] = React.useState<TaxTemplate | null>(null);

  // Fetch tax templates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tax-templates', filters],
    queryFn: () =>
      taxTemplateApi.list(accessToken || '', filters.page, filters.pageSize, {
        tax_category: filters.tax_category !== 'all' ? filters.tax_category : undefined,
        is_active: filters.is_active !== 'all' ? filters.is_active === 'true' : undefined,
      }),
    enabled: !!accessToken,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TaxTemplateCreate) => taxTemplateApi.create(accessToken || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-templates'] });
      toast({ title: 'Success', description: 'Tax template created successfully' });
      setCreateDialogOpen(false);
      setEditTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxTemplateUpdate }) =>
      taxTemplateApi.update(accessToken || '', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-templates'] });
      toast({ title: 'Success', description: 'Tax template updated successfully' });
      setCreateDialogOpen(false);
      setEditTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => taxTemplateApi.delete(accessToken || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-templates'] });
      toast({ title: 'Success', description: 'Tax template deleted successfully' });
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleView = (template: TaxTemplate) => {
    setSelectedTemplate(template);
    setDetailDialogOpen(true);
  };

  const handleCreate = () => {
    setEditTemplate(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (template: TaxTemplate) => {
    setEditTemplate(template);
    setCreateDialogOpen(true);
  };

  const handleDelete = (template: TaxTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTemplate) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  const handleSave = async (data: TaxTemplateCreate | TaxTemplateUpdate, id?: string) => {
    if (id) {
      await updateMutation.mutateAsync({ id, data: data as TaxTemplateUpdate });
    } else {
      await createMutation.mutateAsync(data as TaxTemplateCreate);
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
      <TaxTemplateManagementHeader onCreateNew={handleCreate} onRefresh={() => refetch()} loading={isLoading} />

      <TaxTemplateManagementFilters filters={filters} onFilterChange={handleFilterChange} />

      <TaxTemplatesTable
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

      <TaxTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        template={editTemplate}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <TaxTemplateDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        template={selectedTemplate}
        onEdit={handleEdit}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Tax Template"
        description={`Are you sure you want to delete tax template "${selectedTemplate?.template_name}"? This action cannot be undone.`}
      />
    </div>
  );
}

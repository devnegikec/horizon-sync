import * as React from 'react';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import type { TaxTemplate } from '../../types/tax-template.types';

interface TaxTemplatesTableProps {
  templates: TaxTemplate[];
  loading: boolean;
  error: string | null;
  onView: (template: TaxTemplate) => void;
  onEdit: (template: TaxTemplate) => void;
  onDelete: (template: TaxTemplate) => void;
  onCreateTemplate: () => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
}

export function TaxTemplatesTable({
  templates,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  onCreateTemplate,
  pagination,
  onPageChange,
}: TaxTemplatesTableProps) {
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-8 text-destructive">Error: {error}</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg">
        <p className="text-lg font-medium mb-2">No tax templates found</p>
        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first tax template</p>
        <Button onClick={onCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tax Template
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Template Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Template Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Rules</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Default</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{template.template_code}</td>
                  <td className="px-4 py-3 text-sm">{template.template_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      template.tax_category === 'Output' 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {template.tax_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{template.tax_rules.length}</td>
                  <td className="px-4 py-3 text-center">
                    {template.is_default && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      template.is_active
                        ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onView(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(template)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} templates
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

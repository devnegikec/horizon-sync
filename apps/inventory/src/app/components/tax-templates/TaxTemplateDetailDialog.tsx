import * as React from 'react';
import { Edit, Receipt } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import type { TaxTemplate } from '../../types/tax-template.types';

interface TaxTemplateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaxTemplate | null;
  onEdit: (template: TaxTemplate) => void;
}

export function TaxTemplateDetailDialog({ open, onOpenChange, template, onEdit }: TaxTemplateDetailDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Receipt className="h-5 w-5" />
              Tax Template Details
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Template Code</p>
              <p className="text-lg font-semibold">{template.template_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Template Name</p>
              <p className="text-lg font-semibold">{template.template_name}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{template.tax_category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{template.is_active ? 'Active' : 'Inactive'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Default</p>
              <p className="font-medium">{template.is_default ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {template.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{template.description}</p>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Tax Rules</h3>
            <div className="rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Rule Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tax Type</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Rate (%)</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Compound</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {template.tax_rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3 text-sm">{rule.rule_name}</td>
                      <td className="px-4 py-3 text-sm">{rule.tax_type}</td>
                      <td className="px-4 py-3 text-sm text-right">{rule.tax_rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {rule.is_compound && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            Yes
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => onEdit(template)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

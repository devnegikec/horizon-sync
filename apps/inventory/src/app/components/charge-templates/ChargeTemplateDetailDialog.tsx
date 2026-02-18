import * as React from 'react';
import { Edit, DollarSign } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import type { ChargeTemplate } from '../../types/charge-template.types';

interface ChargeTemplateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ChargeTemplate | null;
  onEdit: (template: ChargeTemplate) => void;
}

export function ChargeTemplateDetailDialog({ open, onOpenChange, template, onEdit }: ChargeTemplateDetailDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <DollarSign className="h-5 w-5" />
              Charge Template Details
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
              <p className="text-sm text-muted-foreground">Charge Type</p>
              <p className="font-medium">{template.charge_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Calculation Method</p>
              <p className="font-medium">{template.calculation_method}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{template.is_active ? 'Active' : 'Inactive'}</p>
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
            <h3 className="text-lg font-medium mb-4">Calculation Details</h3>
            <div className="rounded-lg border p-4 space-y-3">
              {template.calculation_method === 'FIXED' ? (
                <div>
                  <p className="text-sm text-muted-foreground">Fixed Amount</p>
                  <p className="text-2xl font-bold">${template.fixed_amount?.toFixed(2)}</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Percentage Rate</p>
                    <p className="text-2xl font-bold">{template.percentage_rate?.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Base On</p>
                    <p className="text-lg font-medium">{template.base_on?.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Account Head ID</p>
              <p className="font-mono text-sm">{template.account_head_id}</p>
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

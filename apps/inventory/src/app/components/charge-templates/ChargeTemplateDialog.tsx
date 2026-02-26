import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Checkbox,
} from '@horizon-sync/ui/components';

import type { ChargeTemplate, ChargeTemplateCreate, ChargeTemplateUpdate, ChargeType, CalculationMethod, BaseOn } from '../../types/charge-template.types';

// Validation schema
const chargeTemplateFormSchema = z.object({
  template_code: z.string()
    .min(1, 'Template code is required')
    .max(50, 'Template code must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Template code must be alphanumeric with hyphens or underscores'),
  template_name: z.string().min(1, 'Template name is required').max(200, 'Template name must be 200 characters or less'),
  description: z.string().optional(),
  charge_type: z.enum(['Shipping', 'Handling', 'Packaging', 'Insurance', 'Custom']),
  calculation_method: z.enum(['FIXED', 'PERCENTAGE']),
  fixed_amount: z.number().min(0, 'Amount must be 0 or greater').optional(),
  percentage_rate: z.number().min(0, 'Rate must be 0 or greater').max(100, 'Rate cannot exceed 100').optional(),
  base_on: z.enum(['Net_Total', 'Grand_Total']).optional(),
  account_head_id: z.string().min(1, 'Account head is required'),
  is_active: z.boolean(),
}).refine((data) => {
  if (data.calculation_method === 'FIXED') {
    return data.fixed_amount !== undefined && data.fixed_amount > 0;
  }
  return true;
}, {
  message: 'Fixed amount is required and must be greater than 0',
  path: ['fixed_amount'],
}).refine((data) => {
  if (data.calculation_method === 'PERCENTAGE') {
    return data.percentage_rate !== undefined && data.percentage_rate > 0;
  }
  return true;
}, {
  message: 'Percentage rate is required and must be greater than 0',
  path: ['percentage_rate'],
}).refine((data) => {
  if (data.calculation_method === 'PERCENTAGE') {
    return data.base_on !== undefined;
  }
  return true;
}, {
  message: 'Base on is required for percentage calculation',
  path: ['base_on'],
});

type ChargeTemplateFormData = z.infer<typeof chargeTemplateFormSchema>;

interface ChargeTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ChargeTemplate | null;
  onSave: (data: ChargeTemplateCreate | ChargeTemplateUpdate, id?: string) => Promise<void>;
  saving: boolean;
}

export function ChargeTemplateDialog({ open, onOpenChange, template, onSave, saving }: ChargeTemplateDialogProps) {
  const isEdit = !!template;

  const form = useForm<ChargeTemplateFormData>({
    resolver: zodResolver(chargeTemplateFormSchema),
    defaultValues: {
      template_code: '',
      template_name: '',
      description: '',
      charge_type: 'Shipping',
      calculation_method: 'FIXED',
      fixed_amount: 0,
      percentage_rate: 0,
      base_on: 'Net_Total',
      account_head_id: '',
      is_active: true,
    },
  });

  const { control, handleSubmit, formState: { errors }, watch, reset } = form;
  const calculationMethod = watch('calculation_method');

  // Reset form when dialog opens or template changes
  React.useEffect(() => {
    if (template) {
      reset({
        template_code: template.template_code,
        template_name: template.template_name,
        description: template.description || '',
        charge_type: template.charge_type,
        calculation_method: template.calculation_method,
        fixed_amount: template.fixed_amount || 0,
        percentage_rate: template.percentage_rate || 0,
        base_on: template.base_on || 'Net_Total',
        account_head_id: template.account_head_id,
        is_active: template.is_active,
      });
    } else {
      reset({
        template_code: '',
        template_name: '',
        description: '',
        charge_type: 'Shipping',
        calculation_method: 'FIXED',
        fixed_amount: 0,
        percentage_rate: 0,
        base_on: 'Net_Total',
        account_head_id: '',
        is_active: true,
      });
    }
  }, [template, open, reset]);

  const onSubmit = async (data: ChargeTemplateFormData) => {
    const payload: ChargeTemplateCreate | ChargeTemplateUpdate = {
      template_code: data.template_code,
      template_name: data.template_name,
      description: data.description || undefined,
      charge_type: data.charge_type,
      calculation_method: data.calculation_method,
      account_head_id: data.account_head_id,
      is_active: data.is_active,
    };

    if (data.calculation_method === 'FIXED') {
      payload.fixed_amount = data.fixed_amount;
    } else {
      payload.percentage_rate = data.percentage_rate;
      payload.base_on = data.base_on;
    }

    if (isEdit && template) {
      await onSave(payload as ChargeTemplateUpdate, template.id);
    } else {
      await onSave(payload as ChargeTemplateCreate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Charge Template' : 'Create Charge Template'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template_code">
                  Template Code <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="template_code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="template_code"
                      placeholder="e.g., SHIP_STANDARD"
                      disabled={isEdit}
                    />
                  )}
                />
                {errors.template_code && (
                  <p className="text-sm text-destructive">{errors.template_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_name">
                  Template Name <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="template_name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="template_name"
                      placeholder="e.g., Standard Shipping"
                    />
                  )}
                />
                {errors.template_name && (
                  <p className="text-sm text-destructive">{errors.template_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Optional description..."
                    rows={2}
                  />
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="charge_type">
                  Charge Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="charge_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="charge_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shipping">Shipping</SelectItem>
                        <SelectItem value="Handling">Handling</SelectItem>
                        <SelectItem value="Packaging">Packaging</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.charge_type && (
                  <p className="text-sm text-destructive">{errors.charge_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_head_id">
                  Account Head <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="account_head_id"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="account_head_id"
                      placeholder="Account ID"
                    />
                  )}
                />
                {errors.account_head_id && (
                  <p className="text-sm text-destructive">{errors.account_head_id.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          {/* Calculation Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Calculation Method</h3>
            
            <div className="space-y-2">
              <Label htmlFor="calculation_method">
                Calculation Method <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="calculation_method"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="calculation_method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {calculationMethod === 'FIXED' && (
              <div className="space-y-2">
                <Label htmlFor="fixed_amount">
                  Fixed Amount <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="fixed_amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="fixed_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.fixed_amount && (
                  <p className="text-sm text-destructive">{errors.fixed_amount.message}</p>
                )}
              </div>
            )}

            {calculationMethod === 'PERCENTAGE' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="percentage_rate">
                    Percentage Rate (%) <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="percentage_rate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="percentage_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                  {errors.percentage_rate && (
                    <p className="text-sm text-destructive">{errors.percentage_rate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_on">
                    Base On <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="base_on"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="base_on">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Net_Total">Net Total</SelectItem>
                          <SelectItem value="Grand_Total">Grand Total</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.base_on && (
                    <p className="text-sm text-destructive">{errors.base_on.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

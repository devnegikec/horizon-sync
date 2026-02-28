import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
  Separator,
  Textarea,
  Checkbox,
} from '@horizon-sync/ui/components';

import type { TaxTemplate, TaxTemplateCreate, TaxTemplateUpdate, TaxCategory } from '../../types/tax-template.types';

// Validation schema
const taxRuleSchema = z.object({
  rule_name: z.string().min(1, 'Rule name is required'),
  tax_type: z.string().min(1, 'Tax type is required'),
  description: z.string().optional(),
  tax_rate: z.number().min(0, 'Rate must be 0 or greater').max(100, 'Rate cannot exceed 100'),
  account_head_id: z.string().min(1, 'Account head is required'),
  is_compound: z.boolean(),
  sequence: z.number().int().positive(),
});

const taxTemplateFormSchema = z.object({
  template_code: z.string()
    .min(1, 'Template code is required')
    .max(50, 'Template code must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Template code must be alphanumeric with hyphens or underscores'),
  template_name: z.string().min(1, 'Template name is required').max(200, 'Template name must be 200 characters or less'),
  description: z.string().optional(),
  tax_category: z.enum(['Input', 'Output']),
  is_default: z.boolean(),
  is_active: z.boolean(),
  tax_rules: z.array(taxRuleSchema).min(1, 'At least one tax rule is required'),
});

type TaxTemplateFormData = z.infer<typeof taxTemplateFormSchema>;

interface TaxTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaxTemplate | null;
  onSave: (data: TaxTemplateCreate | TaxTemplateUpdate, id?: string) => Promise<void>;
  saving: boolean;
}

const TAX_TYPES = ['GST', 'VAT', 'CGST', 'SGST', 'IGST', 'Sales Tax', 'Service Tax', 'Excise', 'Custom'];

export function TaxTemplateDialog({ open, onOpenChange, template, onSave, saving }: TaxTemplateDialogProps) {
  const isEdit = !!template;

  const form = useForm<TaxTemplateFormData>({
    resolver: zodResolver(taxTemplateFormSchema),
    defaultValues: {
      template_code: '',
      template_name: '',
      description: '',
      tax_category: 'Output',
      is_default: false,
      is_active: true,
      tax_rules: [
        {
          rule_name: '',
          tax_type: 'GST',
          description: '',
          tax_rate: 0,
          account_head_id: '',
          is_compound: false,
          sequence: 1,
        },
      ],
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tax_rules',
  });

  const taxRules = watch('tax_rules');

  // Reset form when dialog opens or template changes
  React.useEffect(() => {
    if (template) {
      reset({
        template_code: template.template_code,
        template_name: template.template_name,
        description: template.description || '',
        tax_category: template.tax_category,
        is_default: template.is_default,
        is_active: template.is_active,
        tax_rules: template.tax_rules?.map((rule, index) => ({
          rule_name: rule.rule_name,
          tax_type: rule.tax_type,
          description: rule.description || '',
          tax_rate: rule.tax_rate,
          account_head_id: rule.account_head_id,
          is_compound: rule.is_compound,
          sequence: rule.sequence || index + 1,
        })),
      });
    } else {
      reset({
        template_code: '',
        template_name: '',
        description: '',
        tax_category: 'Output',
        is_default: false,
        is_active: true,
        tax_rules: [
          {
            rule_name: '',
            tax_type: '',
            description: '',
            tax_rate: 0,
            account_head_id: '',
            is_compound: false,
            sequence: 1,
          },
        ],
      });
    }
  }, [template, open, reset]);

  const onSubmit = async (data: TaxTemplateFormData) => {
    const payload = {
      template_code: data.template_code,
      template_name: data.template_name,
      description: data.description || undefined,
      tax_category: data.tax_category,
      is_default: data.is_default,
      is_active: data.is_active,
      tax_rules: data.tax_rules.map((rule) => ({
        rule_name: rule.rule_name,
        tax_type: rule.tax_type,
        description: rule.description || undefined,
        tax_rate: rule.tax_rate,
        account_head_id: rule.account_head_id,
        is_compound: rule.is_compound,
        sequence: rule.sequence,
      })),
    };

    if (isEdit && template) {
      await onSave(payload as TaxTemplateUpdate, template.id);
    } else {
      await onSave(payload as TaxTemplateCreate);
    }
  };

  const handleAddTaxRule = () => {
    append({
      rule_name: '',
      tax_type: 'GST',
      description: '',
      tax_rate: 0,
      account_head_id: '',
      is_compound: false,
      sequence: taxRules.length + 1,
    });
  };

  const handleRemoveTaxRule = (index: number) => {
    if (taxRules.length > 1) {
      remove(index);
      // Update sequences
      taxRules.forEach((_, idx) => {
        if (idx > index) {
          setValue(`tax_rules.${idx - 1}.sequence`, idx);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tax Template' : 'Create Tax Template'}</DialogTitle>
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
                <Controller name="template_code"
                  control={control}
                  render={({ field }) => (
                    <Input {...field}
                      id="template_code"
                      placeholder="e.g., GST_18"
                      disabled={isEdit}/>
                  )}/>
                {errors.template_code && (
                  <p className="text-sm text-destructive">{errors.template_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_name">
                  Template Name <span className="text-destructive">*</span>
                </Label>
                <Controller name="template_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field}
                      id="template_name"
                      placeholder="e.g., GST 18%"/>
                  )}/>
                {errors.template_name && (
                  <p className="text-sm text-destructive">{errors.template_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Controller name="description"
                control={control}
                render={({ field }) => (
                  <Textarea {...field}
                    id="description"
                    placeholder="Optional description..."
                    rows={2}/>
                )}/>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tax_category">
                  Tax Category <span className="text-destructive">*</span>
                </Label>
                <Controller name="tax_category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tax_category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Output">Output (Sales)</SelectItem>
                        <SelectItem value="Input">Input (Purchase)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}/>
                {errors.tax_category && (
                  <p className="text-sm text-destructive">{errors.tax_category.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Controller name="is_default"
                  control={control}
                  render={({ field }) => (
                    <Checkbox id="is_default"
                      checked={field.value}
                      onCheckedChange={field.onChange}/>
                  )}/>
                <Label htmlFor="is_default" className="cursor-pointer">
                  Set as Default
                </Label>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Controller name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Checkbox id="is_active"
                      checked={field.value}
                      onCheckedChange={field.onChange}/>
                  )}/>
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tax Rules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Tax Rules <span className="text-destructive">*</span>
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTaxRule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Rule
              </Button>
            </div>

            {errors.tax_rules && typeof errors.tax_rules.message === 'string' && (
              <p className="text-sm text-destructive">{errors.tax_rules.message}</p>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Rule {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTaxRule(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`tax_rules.${index}.rule_name`}>
                        Rule Name <span className="text-destructive">*</span>
                      </Label>
                      <Controller name={`tax_rules.${index}.rule_name`}
                        control={control}
                        render={({ field }) => (
                          <Input {...field}
                            placeholder="e.g., CGST"/>
                        )}/>
                      {errors.tax_rules?.[index]?.rule_name && (
                        <p className="text-sm text-destructive">
                          {errors.tax_rules[index]?.rule_name?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tax_rules.${index}.tax_type`}>
                        Tax Type <span className="text-destructive">*</span>
                      </Label>
                      <Controller name={`tax_rules.${index}.tax_type`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax type" />
                            </SelectTrigger>
                            <SelectContent>
                              {TAX_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}/>
                      {errors.tax_rules?.[index]?.tax_type && (
                        <p className="text-sm text-destructive">
                          {errors.tax_rules[index]?.tax_type?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`tax_rules.${index}.tax_rate`}>
                        Tax Rate (%) <span className="text-destructive">*</span>
                      </Label>
                      <Controller name={`tax_rules.${index}.tax_rate`}
                        control={control}
                        render={({ field }) => (
                          <Input {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/>
                        )}/>
                      {errors.tax_rules?.[index]?.tax_rate && (
                        <p className="text-sm text-destructive">
                          {errors.tax_rules[index]?.tax_rate?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tax_rules.${index}.account_head_id`}>
                        Account Head <span className="text-destructive">*</span>
                      </Label>
                      <Controller name={`tax_rules.${index}.account_head_id`}
                        control={control}
                        render={({ field }) => (
                          <Input {...field}
                            placeholder="Account ID"/>
                        )}/>
                      {errors.tax_rules?.[index]?.account_head_id && (
                        <p className="text-sm text-destructive">
                          {errors.tax_rules[index]?.account_head_id?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-8">
                      <Controller name={`tax_rules.${index}.is_compound`}
                        control={control}
                        render={({ field }) => (
                          <Checkbox id={`tax_rules.${index}.is_compound`}
                            checked={field.value}
                            onCheckedChange={field.onChange}/>
                        )}/>
                      <Label htmlFor={`tax_rules.${index}.is_compound`} className="cursor-pointer">
                        Compound Tax
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tax_rules.${index}.description`}>Description</Label>
                    <Controller name={`tax_rules.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field}
                          placeholder="Optional description..."/>
                      )}/>
                  </div>
                </div>
              ))}
            </div>
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

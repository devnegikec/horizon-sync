import * as React from 'react';

import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import type { TaxTemplate } from '../../../types/tax-template.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';

interface Step3TaxAdditionalProps {
  formData: ItemFormData;
  onUpdate: (data: Partial<ItemFormData>) => void;
  salesTaxTemplates?: TaxTemplate[];
  purchaseTaxTemplates?: TaxTemplate[];
  isLoadingTaxTemplates?: boolean;
}

export function Step3TaxAdditional({
  formData,
  onUpdate,
  salesTaxTemplates = [],
  purchaseTaxTemplates = [],
  isLoadingTaxTemplates = false,
}: Step3TaxAdditionalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tax & Additional Info</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure tax templates and custom fields
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Tax Templates</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sales Tax Template</Label>
            <Select value={formData.salesTaxTemplateId || ''}
              onValueChange={(value) => onUpdate({ salesTaxTemplateId: value || null })}
              disabled={isLoadingTaxTemplates}>
              <SelectTrigger>
                <SelectValue placeholder="Select sales tax template" />
              </SelectTrigger>
              <SelectContent>
                {salesTaxTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name} ({template.template_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Purchase Tax Template</Label>
            <Select value={formData.purchaseTaxTemplateId || ''}
              onValueChange={(value) => onUpdate({ purchaseTaxTemplateId: value || null })}
              disabled={isLoadingTaxTemplates}>
              <SelectTrigger>
                <SelectValue placeholder="Select purchase tax template" />
              </SelectTrigger>
              <SelectContent>
                {purchaseTaxTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name} ({template.template_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold border-b pb-2">Custom Fields</h4>
        
        <div className="space-y-2">
          <Label htmlFor="customFields">Custom Fields (JSON)</Label>
          <Textarea id="customFields"
            value={JSON.stringify(formData.customFields, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onUpdate({ customFields: parsed });
              } catch {
                // Invalid JSON, don't update
              }
            }}
            placeholder='{"key": "value"}'
            rows={6}/>
          <p className="text-xs text-muted-foreground">Enter valid JSON format</p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-semibold mb-2">Review Summary</h4>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Item Code:</span> {formData.itemCode || 'Not set'}</p>
          <p><span className="font-medium">Item Name:</span> {formData.name || 'Not set'}</p>
          <p><span className="font-medium">Standard Rate:</span> ${formData.defaultPrice || '0.00'}</p>
          <p><span className="font-medium">Unit:</span> {formData.unitOfMeasure || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}

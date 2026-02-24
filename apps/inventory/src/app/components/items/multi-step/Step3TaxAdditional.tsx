import * as React from 'react';

import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

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


    </div>
  );
}

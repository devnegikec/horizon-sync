import * as React from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { useBrands } from '../../../features/qr-management/hooks/useBrands';
import type { TaxTemplate } from '../../../types/tax-template.types';
import type { ItemFormData } from '../../../utility/item-payload-builders';

const QR_TYPE_OPTIONS = [
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'secure_qr_runtime', label: 'Secure QR Runtime' },
  { value: 'static_qr', label: 'Static QR' },
];

const ACTIVATION_METHOD_OPTIONS = [
  { value: 'pre', label: 'Pre-Activated' },
  { value: 'post', label: 'Post-Activated' },
];

const SR_NUMBER_TYPE_OPTIONS = [
  { value: 'random_6_alpha_numeric', label: 'Random-6 Digit Alpha Numeric' },
  { value: 'random_8_alpha_numeric', label: 'Random-8 Digit Alpha Numeric' },
  { value: 'sequential', label: 'Sequential' },
  { value: 'custom', label: 'Custom' },
];

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
  const { data: brandsData, loading: brandsLoading } = useBrands();
  const brands = brandsData?.brands ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tax & Additional Info</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure tax templates and product QR details
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-primary">QR / Product Details</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select value={formData.brandId || ''}
              onValueChange={(value) => onUpdate({ brandId: value })}
              disabled={brandsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={brandsLoading ? 'Loading brands…' : 'Select brand'} />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>GTIN</Label>
            <Input value={formData.gtin ?? ''}
              onChange={(e) => onUpdate({ gtin: e.target.value })}
              placeholder="e.g. 012345678901" />
          </div>

          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={formData.industry ?? ''}
              onChange={(e) => onUpdate({ industry: e.target.value })}
              placeholder="e.g. Pharmaceuticals" />
          </div>

          <div className="space-y-2">
            <Label>Warranty Period (Months)</Label>
            <Input type="number" min="0"
              value={formData.warrantyPeriodMonths ?? ''}
              onChange={(e) => onUpdate({ warrantyPeriodMonths: e.target.value })}
              placeholder="e.g. 10" />
          </div>

          <div className="space-y-2">
            <Label>QR Type</Label>
            <Select value={formData.qrType || ''}
              onValueChange={(value) => onUpdate({ qrType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select QR type" />
              </SelectTrigger>
              <SelectContent>
                {QR_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Activation Method</Label>
            <Select value={formData.activationMethod || 'pre'}
              onValueChange={(value) => onUpdate({ activationMethod: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVATION_METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Serial Number Type</Label>
            <Select value={formData.srNumberType || ''}
              onValueChange={(value) => onUpdate({ srNumberType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {SR_NUMBER_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Landing Page URL</Label>
            <Input type="url" value={formData.landingPage ?? ''}
              onChange={(e) => onUpdate({ landingPage: e.target.value })}
              placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-primary">Tax Templates</h4>

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

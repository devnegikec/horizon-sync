import * as React from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Switch } from '@horizon-sync/ui/components/ui/switch';

import { CollapsibleSection } from './CollapsibleSection';
import type { SectionProps } from './types';
import type { CustomField } from '../../../types/landing-page.types';

const PRODUCT_TOGGLES = [
  ['show_gtin', 'GTIN'],
  ['show_batch', 'Batch Number'],
  ['show_mfg_date', 'Mfg. Date'],
  ['show_expiry_date', 'Expiry Date'],
  ['show_serial_number', 'Serial Number'],
] as const;

/**
 * Product Details section: toggles for GTIN, Batch, Mfg Date, Expiry, Serial Number,
 * plus custom fields CRUD.
 */
export function ProductDetailsSection({ config, setConfig }: SectionProps) {
  const pd = config.product_details;

  const toggle = (key: keyof typeof pd) => {
    setConfig((c) => ({
      ...c,
      product_details: { ...c.product_details, [key]: !c.product_details[key] },
    }));
  };

  const addCustomField = () => {
    setConfig((c) => ({
      ...c,
      product_details: {
        ...c.product_details,
        custom_fields: [...c.product_details.custom_fields, { label: '', value: '' }],
      },
    }));
  };

  const updateCustomField = (idx: number, field: 'label' | 'value', val: string) => {
    setConfig((c) => {
      const fields = [...c.product_details.custom_fields];
      fields[idx] = { ...fields[idx], [field]: val };
      return { ...c, product_details: { ...c.product_details, custom_fields: fields } };
    });
  };

  const removeCustomField = (idx: number) => {
    setConfig((c) => ({
      ...c,
      product_details: {
        ...c.product_details,
        custom_fields: c.product_details.custom_fields.filter((_, i) => i !== idx),
      },
    }));
  };

  return (
    <CollapsibleSection icon={Info} title="Authentic Product Details" defaultOpen>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {PRODUCT_TOGGLES.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label className="text-xs cursor-pointer" onClick={() => toggle(key)}>
              {label}
            </Label>
            <Switch checked={pd[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </div>

      {/* Custom Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Custom Fields</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addCustomField}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {pd.custom_fields.map((field: CustomField, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={field.label}
              onChange={(e) => updateCustomField(i, 'label', e.target.value)}
              placeholder="Label"
              className="h-7 text-xs flex-1"
            />
            <Input
              value={field.value}
              onChange={(e) => updateCustomField(i, 'value', e.target.value)}
              placeholder="Value"
              className="h-7 text-xs flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => removeCustomField(i)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

import * as React from 'react';
import { Hash, Eye } from 'lucide-react';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import type { NamingSeriesSettings, DocumentType } from '../../../types/organization-settings.types';
import { previewDocumentNumber } from '../../../utils/organization-settings.utils';

interface NamingSeriesSettingsProps {
  namingSeries: NamingSeriesSettings;
  onChange: (namingSeries: NamingSeriesSettings) => void;
  disabled?: boolean;
}

const DOCUMENT_TYPES: { type: DocumentType; label: string; description: string }[] = [
  { type: 'quotation', label: 'Quotation', description: 'Sales quotations sent to customers' },
  { type: 'sales_order', label: 'Sales Order', description: 'Confirmed customer orders' },
  { type: 'pick_list', label: 'Pick List', description: 'Warehouse picking lists' },
  { type: 'delivery_note', label: 'Delivery Note', description: 'Shipment delivery notes' },
  { type: 'invoice', label: 'Invoice', description: 'Sales and purchase invoices' },
  { type: 'payment', label: 'Payment', description: 'Payment transactions' },
  { type: 'purchase_order', label: 'Purchase Order', description: 'Orders placed with suppliers' },
  { type: 'rfq', label: 'RFQ', description: 'Request for quotations to suppliers' },
  { type: 'material_request', label: 'Material Request', description: 'Internal material requisitions' },
  { type: 'purchase_receipt', label: 'Purchase Receipt', description: 'Goods received from suppliers' },
  { type: 'item', label: 'Item', description: 'Inventory item numbers / item codes' },
];

export function NamingSeriesSettings({ namingSeries, onChange, disabled }: NamingSeriesSettingsProps) {
  const handleUpdate = (docType: DocumentType, field: string, value: any) => {
    const config = namingSeries[docType];
    if (!config) return;

    onChange({
      ...namingSeries,
      [docType]: {
        ...config,
        [field]: value,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Numbering Series</CardTitle>
        <CardDescription>
          Configure automatic numbering for documents. The system will generate sequential numbers based on these settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {DOCUMENT_TYPES.map(({ type, label, description }) => {
          const config = namingSeries[type];
          if (!config) return null;

          const preview = previewDocumentNumber(type, { 
            naming_series: namingSeries,
            currencies: [],
            address: {
              street_address: '',
              city: '',
              state_province: '',
              postal_code: '',
              country: '',
            }
          });

          return (
            <div key={type} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">{label}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
                <Badge variant="outline" className="gap-2">
                  <Eye className="h-3 w-3" />
                  {preview}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Prefix</Label>
                  <Input
                    value={config.prefix}
                    onChange={(e) => handleUpdate(type, 'prefix', e.target.value)}
                    disabled={disabled}
                    placeholder="INV-"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Current Number</Label>
                  <Input
                    type="number"
                    value={config.current_number}
                    onChange={(e) => handleUpdate(type, 'current_number', Number(e.target.value))}
                    disabled={disabled}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Next: {config.current_number + 1}</p>
                </div>

                <div className="space-y-2">
                  <Label>Padding (Zeros)</Label>
                  <Select
                    value={String(config.padding)}
                    onValueChange={(value) => handleUpdate(type, 'padding', Number(value))}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 (001)</SelectItem>
                      <SelectItem value="4">4 (0001)</SelectItem>
                      <SelectItem value="5">5 (00001)</SelectItem>
                      <SelectItem value="6">6 (000001)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${type}-year`}
                    checked={config.include_year || false}
                    onCheckedChange={(checked) => handleUpdate(type, 'include_year', checked)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${type}-year`} className="text-sm font-normal cursor-pointer">
                    Include Year
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${type}-month`}
                    checked={config.include_month || false}
                    onCheckedChange={(checked) => handleUpdate(type, 'include_month', checked)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${type}-month`} className="text-sm font-normal cursor-pointer">
                    Include Month
                  </Label>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

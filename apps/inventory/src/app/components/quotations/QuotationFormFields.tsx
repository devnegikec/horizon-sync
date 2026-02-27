import * as React from 'react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@horizon-sync/ui/components';

import type { QuotationStatus } from '../../types/quotation.types';
import { CurrencySelect, StatusSelect } from '../common';

interface QuotationFormFieldsProps {
  formData: {
    quotation_no: string;
    customer_id: string;
    quotation_date: string;
    valid_until: string;
    currency: string;
    status: QuotationStatus;
    remarks: string;
  };
  customers: Array<{ id: string; customer_name: string }>;
  isEdit: boolean;
  availableStatuses: QuotationStatus[];
  onFieldChange: (field: string, value: string) => void;
}

export function QuotationFormFields({
  formData,
  customers,
  isEdit,
  availableStatuses,
  onFieldChange,
}: QuotationFormFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quotation_no">Quotation #</Label>
            <Input id="quotation_no"
              value={formData.quotation_no}
              onChange={(e) => onFieldChange('quotation_no', e.target.value)}
              disabled={isEdit}
              placeholder={isEdit ? '' : 'Auto-generated if left blank'}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer *</Label>
            <Select value={formData.customer_id || undefined}
              onValueChange={(v) => onFieldChange('customer_id', v)}
              disabled={isEdit}
              required>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="quotation_date">Quotation Date *</Label>
            <Input id="quotation_date"
              type="date"
              value={formData.quotation_date}
              onChange={(e) => onFieldChange('quotation_date', e.target.value)}
              required
              className="[color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
              style={{ accentColor: 'hsl(var(--primary))' }}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_until">Valid Until *</Label>
            <Input id="valid_until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => onFieldChange('valid_until', e.target.value)}
              required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <CurrencySelect value={formData.currency}
              onValueChange={(v) => onFieldChange('currency', v)}
              disabled={isEdit}/>
          </div>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <StatusSelect value={formData.status}
              onValueChange={(v) => onFieldChange('status', v)}
              availableStatuses={availableStatuses}/>
          </div>
        )}
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks"
          value={formData.remarks}
          onChange={(e) => onFieldChange('remarks', e.target.value)}
          placeholder="Additional notes..."
          rows={2}/>
      </div>
    </>
  );
}

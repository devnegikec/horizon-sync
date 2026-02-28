import * as React from 'react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, DatePicker } from '@horizon-sync/ui/components';

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
                disabled
                placeholder="Auto-generated"
                className="cursor-not-allowed opacity-60"/>
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
            <DatePicker id="quotation_date"
              value={formData.quotation_date}
              onChange={(v) => onFieldChange('quotation_date', v)}
              required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_until">Valid Until *</Label>
            <DatePicker id="quotation_date"
              value={formData.quotation_date}
              onChange={(v) => onFieldChange('valid_until', v)}
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

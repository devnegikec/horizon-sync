import * as React from 'react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@horizon-sync/ui/components';

import type { SalesOrderStatus } from '../../types/sales-order.types';
import { CurrencySelect, StatusSelect } from '../common';

interface SalesOrderFormFieldsProps {
  formData: {
    sales_order_no: string;
    customer_id: string;
    order_date: string;
    delivery_date: string;
    currency: string;
    status: SalesOrderStatus;
    remarks: string;
  };
  customers: Array<{ id: string; customer_name: string }>;
  isEdit: boolean;
  availableStatuses: SalesOrderStatus[];
  statusLabels: Record<SalesOrderStatus, string>;
  onFieldChange: (field: string, value: string) => void;
}

export function SalesOrderFormFields({
  formData,
  customers,
  isEdit,
  availableStatuses,
  statusLabels,
  onFieldChange,
}: SalesOrderFormFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sales_order_no">Sales Order #</Label>
            <Input
              id="sales_order_no"
              value={formData.sales_order_no}
              onChange={(e) => onFieldChange('sales_order_no', e.target.value)}
              disabled={isEdit}
              placeholder={isEdit ? '' : 'Auto-generated if left blank'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer *</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(v) => onFieldChange('customer_id', v)}
              disabled={isEdit}
              required
            >
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
            <Label htmlFor="order_date">Order Date *</Label>
            <Input
              id="order_date"
              type="date"
              value={formData.order_date}
              onChange={(e) => onFieldChange('order_date', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery_date">Delivery Date</Label>
            <Input
              id="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={(e) => onFieldChange('delivery_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <CurrencySelect
              value={formData.currency}
              onValueChange={(v) => onFieldChange('currency', v)}
              disabled={isEdit}
            />
          </div>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <StatusSelect
              value={formData.status}
              onValueChange={(v) => onFieldChange('status', v)}
              availableStatuses={availableStatuses}
              statusLabels={statusLabels}
            />
          </div>
        )}
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => onFieldChange('remarks', e.target.value)}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>
    </>
  );
}

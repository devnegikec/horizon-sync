import * as React from 'react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, DatePicker } from '@horizon-sync/ui/components';

import { AsnOrderStatus } from '../../types/asn-order.types';
import { StatusSelect } from '../common';

interface AsnOrderFormFieldsProps {
  formData: {
    asn_order_no: string;
    asn_type: 'purchase' | 'internal_transfer' | 'stock_receipt';
    warehouse_id_from: string;
    warehouse_id_to: string;
    order_date: string;
    delivery_date: string;
    status: AsnOrderStatus;
    remarks: string;
  };
  warehousesFrom: Array<{ id: string; name: string }>;
  warehousesTo: Array<{ id: string; name: string }>;
  isEdit: boolean;
  readOnly?: boolean;
  availableStatuses: AsnOrderStatus[];
  statusLabels: Record<AsnOrderStatus, string>;
  onFieldChange: (field: string, value: string) => void;
  warehouseError?: string;
}

export function AsnOrderFormFields({
  formData,
  warehousesFrom,
  warehousesTo,
  isEdit,
  readOnly = false,
  availableStatuses,
  statusLabels,
  onFieldChange,
  warehouseError,
}: AsnOrderFormFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="asn_order_no">ASN Order #</Label>
            <Input id="asn_order_no"
              value={formData.asn_order_no}
              disabled
              placeholder="Auto-generated"
              className="cursor-not-allowed opacity-60" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asn_type">ASN Type *</Label>
            <Select value={formData.asn_type}
              onValueChange={(v) => onFieldChange('asn_type', v)}
              disabled={readOnly || isEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="internal_transfer">Internal Transfer</SelectItem>
                <SelectItem value="stock_receipt">Stock Receipt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.asn_type !== 'stock_receipt' && (
            <div className="space-y-2">
              <Label htmlFor="warehouse_id_from">Source Warehouse *</Label>
              <Select value={formData.warehouse_id_from}
                onValueChange={(v) => onFieldChange('warehouse_id_from', v)}
                disabled={readOnly}
                required>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehousesFrom.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="warehouse_id_to">Target Warehouse *</Label>
            <Select value={formData.warehouse_id_to}
              onValueChange={(v) => onFieldChange('warehouse_id_to', v)}
              disabled={readOnly}
              required>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehousesTo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {warehouseError && (
          <p className="text-sm text-destructive">{warehouseError}</p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="order_date">Order Date *</Label>
            <DatePicker id="order_date"
              value={formData.order_date}
              onChange={(v) => onFieldChange('order_date', v)}
              disabled={readOnly}
              required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery_date">Delivery Date</Label>
            <DatePicker id="delivery_date"
              value={formData.delivery_date}
              onChange={(v) => onFieldChange('delivery_date', v)}
              disabled={readOnly}
              min={formData.order_date || undefined} />
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <CurrencySelect value={formData.currency}
              onValueChange={(v) => onFieldChange('currency', v)}
              disabled={isEdit} />
          </div> */}
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <StatusSelect value={formData.status}
              onValueChange={(v) => onFieldChange('status', v)}
              availableStatuses={availableStatuses}
              statusLabels={statusLabels}
              disabled={readOnly} />
          </div>
        )}
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks"
          value={formData.remarks}
          onChange={(e) => onFieldChange('remarks', e.target.value)}
          disabled={readOnly}
          placeholder="Additional notes..."
          rows={2} />
      </div>
    </>
  );
}

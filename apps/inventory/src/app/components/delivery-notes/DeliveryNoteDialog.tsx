import * as React from 'react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useDeliveryNoteDialog } from '../../hooks/useDeliveryNoteDialog';
import type { DeliveryNote, DeliveryNoteCreate, DeliveryNoteUpdate } from '../../types/delivery-note.types';

import { DeliveryNoteLineItemsSection, DialogField, DialogFieldGroup } from './DeliveryNoteHelpers';

interface DeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: DeliveryNote | null;
  onSave: (data: DeliveryNoteCreate | DeliveryNoteUpdate, id?: string) => void;
  saving?: boolean;
}

export function DeliveryNoteDialog({ open, onOpenChange, deliveryNote, onSave, saving = false }: DeliveryNoteDialogProps) {
  const {
    isEdit,
    formData,
    items,
    customers,
    warehouses,
    handleFieldChange,
    handleItemChange,
    handleItemSerialNoChange,
    addItem,
    removeItem,
    handleSubmit,
  } = useDeliveryNoteDialog({
    open,
    deliveryNote,
    onSave,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Delivery Note' : 'Create Delivery Note'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <DialogFieldGroup title="Basic Information">
            <div className="grid gap-4 md:grid-cols-2">
              <DialogField label="Delivery Note # *" htmlFor="delivery_note_no">
                <Input id="delivery_note_no"
                  value={formData.delivery_note_no}
                  onChange={(event) => handleFieldChange('delivery_note_no', event.target.value)}
                  placeholder="DN-2026-001"
                  required
                  disabled={isEdit} />
              </DialogField>
              <DialogField label="Customer *" htmlFor="customer_id">
                <Select value={formData.customer_id} onValueChange={(value) => handleFieldChange('customer_id', value)} disabled={isEdit} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DialogField>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <DialogField label="Delivery Date *" htmlFor="delivery_date">
                <Input id="delivery_date"
                  type="datetime-local"
                  value={formData.delivery_date}
                  onChange={(event) => handleFieldChange('delivery_date', event.target.value)}
                  required />
              </DialogField>
              <DialogField label="Status" htmlFor="status">
                <Select value={formData.status} onValueChange={(value) => handleFieldChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </DialogField>
              <DialogField label="Warehouse *" htmlFor="warehouse_id">
                <Select value={formData.warehouse_id} onValueChange={(value) => handleFieldChange('warehouse_id', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.warehouse_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DialogField>
            </div>
          </DialogFieldGroup>

          {/* References */}
          {!isEdit && (
            <DialogFieldGroup title="References">
              <div className="grid gap-4 md:grid-cols-3">
                <DialogField label="Pick List ID" htmlFor="pick_list_id">
                  <Input id="pick_list_id"
                    value={formData.pick_list_id}
                    onChange={(event) => handleFieldChange('pick_list_id', event.target.value)}
                    placeholder="UUID" />
                </DialogField>
                <DialogField label="Reference Type" htmlFor="reference_type">
                  <Input id="reference_type"
                    value={formData.reference_type}
                    onChange={(event) => handleFieldChange('reference_type', event.target.value)}
                    placeholder="e.g. Sales Order" />
                </DialogField>
                <DialogField label="Reference ID" htmlFor="reference_id">
                  <Input id="reference_id"
                    value={formData.reference_id}
                    onChange={(event) => handleFieldChange('reference_id', event.target.value)}
                    placeholder="UUID" />
                </DialogField>
              </div>
            </DialogFieldGroup>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks"
              value={formData.remarks}
              onChange={(event) => handleFieldChange('remarks', event.target.value)}
              placeholder="Additional notes..."
              rows={2} />
          </div>

          {/* Line Items (Create only) */}
          {!isEdit && (
            <DeliveryNoteLineItemsSection items={items}
              warehouses={warehouses}
              onAddItem={addItem}
              onUpdateItem={handleItemChange}
              onUpdateSerialNumbers={handleItemSerialNoChange}
              onRemoveItem={removeItem} />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Delivery Note' : 'Create Delivery Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

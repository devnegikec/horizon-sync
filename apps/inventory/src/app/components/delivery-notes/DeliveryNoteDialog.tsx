import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import type { Customer, CustomerResponse } from '../../types/customer.types';
import type { DeliveryNote, DeliveryNoteCreate, DeliveryNoteCreateItem, DeliveryNoteUpdate } from '../../types/delivery-note.types';
import { customerApi, warehouseApi } from '../../utility/api';

interface DeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: DeliveryNote | null;
  onSave: (data: DeliveryNoteCreate | DeliveryNoteUpdate, id?: string) => void;
  saving?: boolean;
}

const emptyItem: DeliveryNoteCreateItem = {
  item_id: '',
  qty: 0,
  uom: 'pcs',
  rate: 0,
  amount: 0,
  warehouse_id: '',
  batch_no: '',
  serial_nos: [],
  sort_order: 0,
};

export function DeliveryNoteDialog({ open, onOpenChange, deliveryNote, onSave, saving = false }: DeliveryNoteDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEdit = !!deliveryNote;

  const [formData, setFormData] = React.useState({
    delivery_note_no: '',
    customer_id: '',
    delivery_date: new Date().toISOString().slice(0, 16),
    status: 'draft' as DeliveryNote['status'],
    warehouse_id: '',
    pick_list_id: '',
    reference_type: '',
    reference_id: '',
    remarks: '',
  });

  const [items, setItems] = React.useState<DeliveryNoteCreateItem[]>([{ ...emptyItem, sort_order: 1 }]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const { data: warehousesData } = useQuery<{ warehouses: { id: string; warehouse_name: string }[] }>({
    queryKey: ['warehouses-list'],
    queryFn: () => warehouseApi.list(accessToken || '', 1, 100) as Promise<{ warehouses: { id: string; warehouse_name: string }[] }>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];
  const warehouses = warehousesData?.warehouses ?? [];

  React.useEffect(() => {
    if (deliveryNote) {
      setFormData({
        delivery_note_no: deliveryNote.delivery_note_no,
        customer_id: deliveryNote.customer_id,
        delivery_date: deliveryNote.delivery_date ? deliveryNote.delivery_date.slice(0, 16) : deliveryNote.shipping_date?.slice(0, 16) || '',
        status: deliveryNote.status,
        warehouse_id: '',
        pick_list_id: '',
        reference_type: '',
        reference_id: '',
        remarks: '',
      });
    } else {
      setFormData({
        delivery_note_no: '',
        customer_id: '',
        delivery_date: new Date().toISOString().slice(0, 16),
        status: 'draft',
        warehouse_id: '',
        pick_list_id: '',
        reference_type: '',
        reference_id: '',
        remarks: '',
      });
      setItems([{ ...emptyItem, sort_order: 1 }]);
    }
  }, [deliveryNote, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof DeliveryNoteCreateItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'qty' || field === 'rate') {
        updated[index].amount = Number(updated[index].qty) * Number(updated[index].rate);
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem, sort_order: prev.length + 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i + 1 })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      const updateData: DeliveryNoteUpdate = {
        delivery_date: new Date(formData.delivery_date).toISOString(),
        status: formData.status,
        warehouse_id: formData.warehouse_id || undefined,
        remarks: formData.remarks || undefined,
      };
      onSave(updateData, deliveryNote.id);
    } else {
      const createData: DeliveryNoteCreate = {
        delivery_note_no: formData.delivery_note_no,
        customer_id: formData.customer_id,
        delivery_date: new Date(formData.delivery_date).toISOString(),
        status: formData.status,
        warehouse_id: formData.warehouse_id,
        pick_list_id: formData.pick_list_id || undefined,
        reference_type: formData.reference_type || undefined,
        reference_id: formData.reference_id || undefined,
        remarks: formData.remarks || undefined,
        items: items.map((item) => ({
          ...item,
          warehouse_id: item.warehouse_id || formData.warehouse_id,
        })),
      };
      onSave(createData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Delivery Note' : 'Create Delivery Note'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery_note_no">Delivery Note # *</Label>
                <Input
                  id="delivery_note_no"
                  value={formData.delivery_note_no}
                  onChange={(e) => handleChange('delivery_note_no', e.target.value)}
                  placeholder="DN-2026-001"
                  required
                  disabled={isEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer *</Label>
                <Select value={formData.customer_id} onValueChange={(v) => handleChange('customer_id', v)} disabled={isEdit} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date *</Label>
                <Input
                  id="delivery_date"
                  type="datetime-local"
                  value={formData.delivery_date}
                  onChange={(e) => handleChange('delivery_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse_id">Warehouse *</Label>
                <Select value={formData.warehouse_id} onValueChange={(v) => handleChange('warehouse_id', v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* References */}
          {!isEdit && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">References</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pick_list_id">Pick List ID</Label>
                  <Input
                    id="pick_list_id"
                    value={formData.pick_list_id}
                    onChange={(e) => handleChange('pick_list_id', e.target.value)}
                    placeholder="UUID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_type">Reference Type</Label>
                  <Input
                    id="reference_type"
                    value={formData.reference_type}
                    onChange={(e) => handleChange('reference_type', e.target.value)}
                    placeholder="e.g. Sales Order"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_id">Reference ID</Label>
                  <Input
                    id="reference_id"
                    value={formData.reference_id}
                    onChange={(e) => handleChange('reference_id', e.target.value)}
                    placeholder="UUID"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Line Items (Create only) */}
          {!isEdit && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem}>
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Item ID *</Label>
                          <Input
                            value={item.item_id}
                            onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                            placeholder="Item UUID"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">UOM</Label>
                          <Input
                            value={item.uom}
                            onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                            placeholder="pcs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Rate</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Amount</Label>
                          <Input value={item.amount.toFixed(2)} disabled />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Warehouse</Label>
                          <Select value={item.warehouse_id} onValueChange={(v) => handleItemChange(index, 'warehouse_id', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Default" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((w) => (
                                <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Batch No</Label>
                          <Input
                            value={item.batch_no}
                            onChange={(e) => handleItemChange(index, 'batch_no', e.target.value)}
                            placeholder="Batch"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Serial Nos</Label>
                          <Input
                            value={item.serial_nos.join(', ')}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[index] = { ...updated[index], serial_nos: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) };
                              setItems(updated);
                            }}
                            placeholder="Comma-separated"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
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

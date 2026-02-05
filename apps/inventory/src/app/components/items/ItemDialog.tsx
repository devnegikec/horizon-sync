import * as React from 'react';

import { Loader2, Package } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { environment } from '../../../environments/environment';
import { useUpdateItem } from '../../hooks/useUpdateItem';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { Item } from '../../types/item.types';
import type { CreateItemPayload, UpdateItemPayload } from '../../types/items-api.types';

const ITEMS_URL = `${environment.apiCoreUrl}/items`;

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  itemGroups: ApiItemGroup[];
  onSave: (item: Partial<Item>) => void;
  onCreated?: () => void;
  onUpdated?: () => void;
}

const unitOfMeasureOptions = ['Piece', 'Box', 'Ream', 'Sheet', 'Kilogram', 'Liter', 'Meter', 'Set'];

function buildCreatePayload(formData: {
  itemCode: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  defaultPrice: string;
  itemGroupId: string;
}): CreateItemPayload {
  const standardRate = parseFloat(formData.defaultPrice) || 0;
  return {
    item_code: formData.itemCode,
    item_name: formData.name,
    description: formData.description,
    item_group_id: formData.itemGroupId,
    item_type: 'stock',
    uom: formData.unitOfMeasure,
    maintain_stock: true,
    valuation_method: 'fifo',
    allow_negative_stock: false,
    has_variants: false,
    variant_of: null,
    variant_attributes: {},
    has_batch_no: false,
    has_serial_no: false,
    batch_number_series: '',
    serial_number_series: '',
    standard_rate: standardRate,
    valuation_rate: 0,
    enable_auto_reorder: false,
    reorder_level: 0,
    reorder_qty: 0,
    min_order_qty: 1,
    max_order_qty: 0,
    weight_per_unit: 0,
    weight_uom: '',
    inspection_required_before_purchase: false,
    inspection_required_before_delivery: false,
    barcode: '',
    status: 'ACTIVE',
    image_url: '',
    images: [],
    tags: [],
    custom_fields: {},
  };
}

function buildUpdatePayload(
  formData: {
    itemCode: string;
    name: string;
    description: string;
    unitOfMeasure: string;
    defaultPrice: string;
    itemGroupId: string;
  },
  itemGroup: ApiItemGroup | undefined,
): UpdateItemPayload {
  const standardRate = parseFloat(formData.defaultPrice) || 0;
  const group =
    itemGroup ??
    ({
      id: formData.itemGroupId,
      code: '',
      name: '',
    } as ApiItemGroup);
  return {
    item_code: formData.itemCode,
    item_name: formData.name,
    description: formData.description,
    item_group_id: formData.itemGroupId,
    item_group: { id: group.id, code: group.code, name: group.name },
    item_type: 'stock',
    uom: formData.unitOfMeasure,
    maintain_stock: true,
    valuation_method: 'fifo',
    allow_negative_stock: false,
    has_variants: false,
    variant_of: null,
    variant_attributes: {},
    has_batch_no: false,
    has_serial_no: false,
    batch_number_series: '',
    serial_number_series: '',
    standard_rate: String(standardRate.toFixed(2)),
    valuation_rate: '0.00',
    enable_auto_reorder: false,
    reorder_level: 0,
    reorder_qty: 0,
    min_order_qty: 1,
    max_order_qty: 0,
    weight_per_unit: '0.000',
    weight_uom: '',
    inspection_required_before_purchase: false,
    inspection_required_before_delivery: false,
    barcode: '',
    status: 'active',
    image_url: '',
    images: [],
    tags: [],
    custom_fields: {},
  };
}

export function ItemDialog({ open, onOpenChange, item, itemGroups, onSave, onCreated, onUpdated }: ItemDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { updateItem, loading: updateLoading } = useUpdateItem();
  const [formData, setFormData] = React.useState({
    itemCode: '',
    name: '',
    description: '',
    unitOfMeasure: 'Piece',
    defaultPrice: '',
    itemGroupId: '',
    itemGroupName: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const submittingOrUpdating = submitting || updateLoading;

  const isEditing = !!item;

  React.useEffect(() => {
    if (item) {
      setFormData({
        itemCode: item.itemCode,
        name: item.name,
        description: item.description,
        unitOfMeasure: item.unitOfMeasure,
        defaultPrice: item.defaultPrice.toString(),
        itemGroupId: item.itemGroupId,
        itemGroupName: item.itemGroupName,
      });
    } else {
      setFormData({
        itemCode: '',
        name: '',
        description: '',
        unitOfMeasure: 'Piece',
        defaultPrice: '',
        itemGroupId: '',
        itemGroupName: '',
      });
    }
    setSubmitError(null);
  }, [item, open]);

  const handleEditSubmit = async () => {
    if (!item?.id) return;
    if (!accessToken) {
      setSubmitError('Not authenticated');
      return;
    }
    setSubmitError(null);
    try {
      const selectedGroup = itemGroups.find((g) => g.id === formData.itemGroupId);
      const payload = buildUpdatePayload(formData, selectedGroup);
      await updateItem(item.id, payload);
      onUpdated?.();
      onOpenChange(false);
    } catch {
      setSubmitError('Failed to update item');
    }
  };

  const handleCreateSubmit = async () => {
    if (!accessToken) {
      setSubmitError('Not authenticated');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildCreatePayload(formData);
      const res = await fetch(ITEMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (isEditing) {
      handleEditSubmit();
    } else {
      handleCreateSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Edit Item' : 'Create New Item'}</DialogTitle>
              <DialogDescription>{isEditing ? 'Update the item details below' : 'Add a new item to your inventory catalog'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code</Label>
                <Input id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  placeholder="e.g., ELEC-001"
                  required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                <Select value={formData.unitOfMeasure} onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOfMeasureOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
                required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
                rows={3}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemGroup">Item Group</Label>
                <Select value={formData.itemGroupId} onValueChange={(value) => setFormData({ ...formData, itemGroupId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultPrice">Default Price</Label>
                <Input id="defaultPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                  placeholder="0.00"
                  required/>
              </div>
            </div>
          </div>
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submittingOrUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingOrUpdating}>
              {submittingOrUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Saving…' : 'Creating…'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

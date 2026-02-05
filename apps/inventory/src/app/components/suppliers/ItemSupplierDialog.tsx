import * as React from 'react';

import { Loader2, Link2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { useItemSupplierMutations } from '../../hooks/useItemSuppliers';
import type { ApiItem } from '../../types/items-api.types';
import type { ItemSupplier, CreateItemSupplierPayload } from '../../types/supplier.types';

// Mock supplier data - in a real app this would come from a suppliers API
interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface ItemSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemSupplier?: ItemSupplier | null;
  items: ApiItem[];
  suppliers: Supplier[];
  onCreated?: () => void;
  onUpdated?: () => void;
}

export function ItemSupplierDialog({ open, onOpenChange, itemSupplier, items, suppliers, onCreated, onUpdated }: ItemSupplierDialogProps) {
  const { createItemSupplier, updateItemSupplier, loading } = useItemSupplierMutations();
  const [formData, setFormData] = React.useState({
    item_id: '',
    supplier_id: '',
    supplier_part_no: '',
    lead_time_days: '',
    is_default: false,
  });
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const isEditing = !!itemSupplier;

  React.useEffect(() => {
    if (itemSupplier) {
      setFormData({
        item_id: itemSupplier.item_id,
        supplier_id: itemSupplier.supplier_id,
        supplier_part_no: itemSupplier.supplier_part_no || '',
        lead_time_days: itemSupplier.lead_time_days?.toString() || '',
        is_default: itemSupplier.is_default,
      });
    } else {
      setFormData({
        item_id: '',
        supplier_id: '',
        supplier_part_no: '',
        lead_time_days: '',
        is_default: false,
      });
    }
    setSubmitError(null);
  }, [itemSupplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: CreateItemSupplierPayload = {
      item_id: formData.item_id,
      supplier_id: formData.supplier_id,
      supplier_part_no: formData.supplier_part_no || undefined,
      lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days, 10) : undefined,
      is_default: formData.is_default,
    };

    try {
      if (isEditing && itemSupplier) {
        await updateItemSupplier(itemSupplier.id, payload);
        onUpdated?.();
      } else {
        await createItemSupplier(payload);
        onCreated?.();
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save item-supplier link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Edit Item-Supplier Link' : 'Link Item to Supplier'}</DialogTitle>
              <DialogDescription>{isEditing ? 'Update the item-supplier relationship' : 'Create a new item-supplier relationship'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item_id">Item</Label>
              <Select value={formData.item_id} onValueChange={(value) => setFormData({ ...formData, item_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name} ({item.item_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_part_no">Supplier Part No.</Label>
                <Input id="supplier_part_no"
                  value={formData.supplier_part_no}
                  onChange={(e) => setFormData({ ...formData, supplier_part_no: e.target.value })}
                  placeholder="e.g., SUP-001"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
                <Input id="lead_time_days"
                  type="number"
                  min="0"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                  placeholder="0"/>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked === true })}/>
              <Label htmlFor="is_default" className="text-sm font-normal">
                Set as default supplier for this item
              </Label>
            </div>
          </div>

          {submitError && <p className="text-sm text-destructive mb-4">{submitError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Link'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

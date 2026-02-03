import * as React from 'react';

import { Loader2, ArrowRightLeft } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useStockMovementMutations } from '../../hooks/useStock';
import type { ApiItem } from '../../types/items-api.types';
import type { Warehouse } from '../../types/warehouse.types';

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: Warehouse[];
  items: ApiItem[];
  onCreated?: () => void;
}

const movementTypeOptions = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'issue', label: 'Issue' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'return', label: 'Return' },
];

export function StockMovementDialog({ open, onOpenChange, warehouses, items, onCreated }: StockMovementDialogProps) {
  const { createMovement, loading } = useStockMovementMutations();
  const [formData, setFormData] = React.useState({
    item_id: '',
    warehouse_id: '',
    movement_type: 'receipt',
    quantity: '',
    unit_cost: '',
    reference_type: '',
    reference_id: '',
    notes: '',
  });
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFormData({
        item_id: '',
        warehouse_id: '',
        movement_type: 'receipt',
        quantity: '',
        unit_cost: '',
        reference_type: '',
        reference_id: '',
        notes: '',
      });
      setSubmitError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      await createMovement({
        item_id: formData.item_id,
        warehouse_id: formData.warehouse_id,
        movement_type: formData.movement_type,
        quantity: parseFloat(formData.quantity) || 0,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : undefined,
        reference_type: formData.reference_type || undefined,
        reference_id: formData.reference_id || undefined,
        notes: formData.notes || undefined,
        performed_at: new Date().toISOString(),
      });
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create movement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Record Stock Movement</DialogTitle>
              <DialogDescription>Record a new stock movement transaction</DialogDescription>
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
              <Label htmlFor="warehouse_id">Warehouse</Label>
              <Select value={formData.warehouse_id} onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="movement_type">Movement Type</Label>
                <Select value={formData.movement_type} onValueChange={(value) => setFormData({ ...formData, movement_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Unit Cost</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference_type">Reference Type</Label>
                <Input
                  id="reference_type"
                  value={formData.reference_type}
                  onChange={(e) => setFormData({ ...formData, reference_type: e.target.value })}
                  placeholder="e.g., PO, SO"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
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
                  Recording...
                </>
              ) : (
                'Record Movement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

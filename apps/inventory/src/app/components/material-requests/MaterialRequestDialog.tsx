import * as React from 'react';

import { Plus, Trash2, Loader2 } from 'lucide-react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useItems } from '../../hooks/useItems';
import { useUOMOptions } from '../../hooks/useUOMOptions';
import { useWarehouses } from '../../hooks/useWarehouses';
import type {
  MaterialRequest,
  CreateMaterialRequestPayload,
  UpdateMaterialRequestPayload,
} from '../../types/material-request.types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LineItemForm {
  item_id: string;
  quantity: number;
  uom: string;
  required_date: string;
  description: string;
  estimated_unit_cost: string;
  requested_for: string;
  requested_for_department: string;
}

const EMPTY_LINE: LineItemForm = {
  item_id: '',
  quantity: 1,
  uom: '',
  required_date: '',
  description: '',
  estimated_unit_cost: '',
  requested_for: '',
  requested_for_department: '',
};

interface MaterialRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialRequest: MaterialRequest | null;
  onSave: (
    data: CreateMaterialRequestPayload | UpdateMaterialRequestPayload,
    id?: string,
  ) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Line item row sub-component (keeps parent complexity ≤ 10)        */
/* ------------------------------------------------------------------ */

interface LineRowProps {
  line: LineItemForm;
  index: number;
  isOnly: boolean;
  items: { id: string; item_name?: string; item_code?: string }[];
  uomOptions: { value: string; label: string }[];
  onChange: (index: number, field: keyof LineItemForm, value: string | number) => void;
  onRemove: (index: number) => void;
}

function LineRow({ line, index, isOnly, items, uomOptions, onChange, onRemove }: LineRowProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      {/* Row A: Item + Qty + UOM + Required Date + Remove */}
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-4 space-y-1">
          <Label className="text-xs">Item *</Label>
          <Select value={line.item_id}
            onValueChange={(v) => onChange(index, 'item_id', v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id}
                  value={item.id}>
                  {item.item_name ?? item.item_code ?? item.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Qty *</Label>
          <Input type="number"
            min="0.001"
            step="any"
            placeholder="1"
            value={line.quantity}
            onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)} />
        </div>

        <div className="col-span-2 space-y-1">
          <Label className="text-xs">UOM</Label>
          <Select value={line.uom || '__none__'}
            onValueChange={(v) => onChange(index, 'uom', v === '__none__' ? '' : v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {uomOptions.map((u) => (
                <SelectItem key={u.value}
                  value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-3 space-y-1">
          <Label className="text-xs">Required Date *</Label>
          <Input type="date"
            value={line.required_date}
            onChange={(e) => onChange(index, 'required_date', e.target.value)} />
        </div>

        <div className="col-span-1 flex items-end">
          <Button type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            disabled={isOnly}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Row B: Est. Cost + Requested For + Dept + Description */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Est. Unit Cost</Label>
          <Input type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={line.estimated_unit_cost}
            onChange={(e) => onChange(index, 'estimated_unit_cost', e.target.value)} />
        </div>

        <div className="col-span-3 space-y-1">
          <Label className="text-xs">Requested For</Label>
          <Input placeholder="Person / project"
            value={line.requested_for}
            onChange={(e) => onChange(index, 'requested_for', e.target.value)} />
        </div>

        <div className="col-span-3 space-y-1">
          <Label className="text-xs">For Department</Label>
          <Input placeholder="Department"
            value={line.requested_for_department}
            onChange={(e) => onChange(index, 'requested_for_department', e.target.value)} />
        </div>

        <div className="col-span-4 space-y-1">
          <Label className="text-xs">Description</Label>
          <Input placeholder="Optional notes for this item"
            value={line.description}
            onChange={(e) => onChange(index, 'description', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dialog                                                        */
/* ------------------------------------------------------------------ */

export function MaterialRequestDialog({
  open,
  onOpenChange,
  materialRequest,
  onSave,
}: MaterialRequestDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEditing = !!materialRequest;

  const [type, setType] = React.useState<'purchase' | 'transfer' | 'issue'>('purchase');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [department, setDepartment] = React.useState('');
  const [requestedBy, setRequestedBy] = React.useState('');
  const [targetWarehouseId, setTargetWarehouseId] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [lineItems, setLineItems] = React.useState<LineItemForm[]>([{ ...EMPTY_LINE }]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { items } = useItems(1, 200);
  const { options: uomOptions } = useUOMOptions(accessToken ?? '');
  const { warehouses } = useWarehouses(1, 200);

  React.useEffect(() => {
    if (!open) return;
    if (materialRequest) {
      setType(materialRequest.type);
      setPriority(materialRequest.priority);
      setDepartment(materialRequest.department ?? '');
      setRequestedBy(materialRequest.requested_by ?? '');
      setTargetWarehouseId(materialRequest.target_warehouse_id ?? '');
      setNotes(materialRequest.notes ?? '');
      setLineItems(
        materialRequest.line_items.length > 0
          ? materialRequest.line_items.map((l) => ({
              item_id: l.item_id,
              quantity: l.quantity,
              uom: l.uom ?? '',
              required_date: l.required_date?.split('T')[0] ?? '',
              description: l.description ?? '',
              estimated_unit_cost: l.estimated_unit_cost != null ? String(l.estimated_unit_cost) : '',
              requested_for: l.requested_for ?? '',
              requested_for_department: l.requested_for_department ?? '',
            }))
          : [{ ...EMPTY_LINE }],
      );
    } else {
      setType('purchase');
      setPriority('medium');
      setDepartment('');
      setRequestedBy('');
      setTargetWarehouseId('');
      setNotes('');
      setLineItems([{ ...EMPTY_LINE }]);
    }
    setError(null);
  }, [open, materialRequest]);

  const handleLineChange = React.useCallback(
    (index: number, field: keyof LineItemForm, value: string | number) => {
      setLineItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const handleAddLine = React.useCallback(() => {
    setLineItems((prev) => [...prev, { ...EMPTY_LINE }]);
  }, []);

  const handleRemoveLine = React.useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    setError(null);
    const validLines = lineItems.filter((l) => l.item_id && l.required_date);
    if (validLines.length === 0) {
      setError('Add at least one line item with an item and required date.');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateMaterialRequestPayload = {
        type,
        priority,
        department: department || null,
        requested_by: requestedBy || null,
        target_warehouse_id: targetWarehouseId || null,
        notes: notes || null,
        line_items: validLines.map((l) => ({
          item_id: l.item_id,
          quantity: l.quantity,
          uom: l.uom || null,
          required_date: l.required_date,
          description: l.description || null,
          estimated_unit_cost: l.estimated_unit_cost ? parseFloat(l.estimated_unit_cost) : null,
          requested_for: l.requested_for || null,
          requested_for_department: l.requested_for_department || null,
        })),
      };
      await onSave(payload, materialRequest?.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}
      onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Material Request' : 'New Material Request'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the material request details.'
              : 'Create a new material request for procurement.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="mr-type">Type *</Label>
              <Select value={type}
                onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger id="mr-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mr-priority">Priority *</Label>
              <Select value={priority}
                onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger id="mr-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mr-department">Department</Label>
              <Input id="mr-department"
                placeholder="e.g. Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="mr-requested-by">Requested By</Label>
              <Input id="mr-requested-by"
                placeholder="Name or employee ID"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)} />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="mr-warehouse">Target Warehouse</Label>
              <Select value={targetWarehouseId || '__none__'}
                onValueChange={(v) => setTargetWarehouseId(v === '__none__' ? '' : v)}>
                <SelectTrigger id="mr-warehouse">
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id}
                      value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="mr-notes">Notes</Label>
              <Textarea id="mr-notes"
                placeholder="Additional notes..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Line Items</h4>
              <Button type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((line, index) => (
                <LineRow key={index}
                  line={line}
                  index={index}
                  isOnly={lineItems.length === 1}
                  items={items}
                  uomOptions={uomOptions}
                  onChange={handleLineChange}
                  onRemove={handleRemoveLine} />
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}
            disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isEditing ? 'Update' : 'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

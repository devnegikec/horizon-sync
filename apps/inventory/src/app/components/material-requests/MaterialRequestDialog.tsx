import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
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
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { useItems } from '../../hooks/useItems';
import type { MaterialRequest, CreateMaterialRequestPayload, UpdateMaterialRequestPayload } from '../../types/material-request.types';

interface MaterialRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialRequest: MaterialRequest | null;
  onSave: (data: CreateMaterialRequestPayload | UpdateMaterialRequestPayload, id?: string) => Promise<void>;
}

interface LineItemForm {
  item_id: string;
  quantity: number;
  required_date: string;
  description: string;
}

export function MaterialRequestDialog({
  open,
  onOpenChange,
  materialRequest,
  onSave,
}: MaterialRequestDialogProps) {
  const { items = [] } = useItems();
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'purchase' | 'transfer' | 'issue'>('purchase');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [department, setDepartment] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { item_id: '', quantity: 1, required_date: '', description: '' },
  ]);

  useEffect(() => {
    if (materialRequest) {
      setNotes(materialRequest.notes || '');
      setType(materialRequest.type);
      setPriority(materialRequest.priority);
      setDepartment(materialRequest.department || '');
      setLineItems(
        materialRequest.line_items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          required_date: item.required_date,
          description: item.description || '',
        }))
      );
    } else {
      setNotes('');
      setType('purchase');
      setPriority('medium');
      setDepartment('');
      setLineItems([{ item_id: '', quantity: 1, required_date: '', description: '' }]);
    }
  }, [materialRequest, open]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { item_id: '', quantity: 1, required_date: '', description: '' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: keyof LineItemForm, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleSubmit = async () => {
    // Validation
    const hasEmptyItems = lineItems.some((item) => !item.item_id || !item.required_date || item.quantity <= 0);
    if (hasEmptyItems) {
      return;
    }

    const payload: CreateMaterialRequestPayload = {
      type,
      priority,
      department: department || null,
      notes: notes || null,
      line_items: lineItems.map((item) => ({
        item_id: item.item_id,
        quantity: item.quantity,
        uom: null,
        required_date: item.required_date,
        description: item.description || null,
        estimated_unit_cost: null,
        requested_for: null,
        requested_for_department: null,
      })),
    };

    setSaving(true);
    try {
      if (materialRequest) {
        await onSave(payload, materialRequest.id);
      } else {
        await onSave(payload);
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{materialRequest ? 'Edit Material Request' : 'New Material Request'}</DialogTitle>
          <DialogDescription>
            {materialRequest
              ? 'Update the material request details and line items.'
              : 'Create a new material request to signal demand for materials.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Request Type</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enter department name"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or requirements..."
              rows={3}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                  <div className="col-span-4">
                    <Label htmlFor={`item-${index}`}>Item</Label>
                    <Select
                      value={item.item_id}
                      onValueChange={(value) => handleLineItemChange(index, 'item_id', value)}
                    >
                      <SelectTrigger id={`item-${index}`}>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((itm) => (
                          <SelectItem key={itm.id} value={itm.id}>
                            {itm.item_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="col-span-3">
                    <Label htmlFor={`date-${index}`}>Required Date</Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={item.required_date}
                      onChange={(e) => handleLineItemChange(index, 'required_date', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

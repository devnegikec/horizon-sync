import * as React from 'react';

import { Loader2, FileText, Plus, Trash2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useStockEntryMutations } from '../../hooks/useStock';
import type { ApiItem } from '../../types/items-api.types';
import type { StockEntry, StockEntryItem, StockEntryStatus } from '../../types/stock.types';
import type { Warehouse } from '../../types/warehouse.types';

interface StockEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: StockEntry | null;
  warehouses: Warehouse[];
  items: ApiItem[];
  onCreated?: () => void;
  onUpdated?: () => void;
}

const entryTypeOptions = [
  { value: 'material_receipt', label: 'Material Receipt' },
  { value: 'material_issue', label: 'Material Issue' },
  { value: 'material_transfer', label: 'Material Transfer' },
  { value: 'manufacture', label: 'Manufacture' },
  { value: 'repack', label: 'Repack' },
];

interface ItemLineProps {
  item: Partial<StockEntryItem>;
  index: number;
  warehouses: Warehouse[];
  items: ApiItem[];
  onChange: (index: number, field: string, value: string | number) => void;
  onRemove: (index: number) => void;
}

function ItemLine({ item, index, warehouses, items, onChange, onRemove }: ItemLineProps) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end border-b pb-3">
      <div className="col-span-3 space-y-1">
        <Label className="text-xs">Item</Label>
        <Select value={item.item_id || ''} onValueChange={(value) => onChange(index, 'item_id', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.item_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">Source WH</Label>
        <Select value={item.source_warehouse_id || 'none'}
          onValueChange={(value) => onChange(index, 'source_warehouse_id', value === 'none' ? '' : value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">Target WH</Label>
        <Select value={item.target_warehouse_id || 'none'}
          onValueChange={(value) => onChange(index, 'target_warehouse_id', value === 'none' ? '' : value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">Qty</Label>
        <Input type="number"
          className="h-8 text-xs"
          value={item.qty || ''}
          onChange={(e) => onChange(index, 'qty', parseFloat(e.target.value) || 0)}
          placeholder="0"/>
      </div>
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">Rate</Label>
        <Input type="number"
          step="0.01"
          className="h-8 text-xs"
          value={item.basic_rate || ''}
          onChange={(e) => onChange(index, 'basic_rate', parseFloat(e.target.value) || 0)}
          placeholder="0.00"/>
      </div>
      <div className="col-span-1">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function StockEntryDialog({ open, onOpenChange, entry, warehouses, items, onCreated, onUpdated }: StockEntryDialogProps) {
  const { createEntry, updateEntry, loading } = useStockEntryMutations();
  const [formData, setFormData] = React.useState({
    stock_entry_no: '',
    stock_entry_type: 'material_receipt',
    from_warehouse_id: '',
    to_warehouse_id: '',
    posting_date: new Date().toISOString().split('T')[0],
    status: 'draft' as StockEntryStatus,
    remarks: '',
  });
  const [lineItems, setLineItems] = React.useState<Partial<StockEntryItem>[]>([{ item_id: '', qty: 0, basic_rate: 0 }]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const isEditing = !!entry;

  React.useEffect(() => {
    if (entry) {
      setFormData({
        stock_entry_no: entry.stock_entry_no,
        stock_entry_type: entry.stock_entry_type,
        from_warehouse_id: entry.from_warehouse_id || '',
        to_warehouse_id: entry.to_warehouse_id || '',
        posting_date: entry.posting_date.split('T')[0],
        status: (entry.status as StockEntryStatus) || 'draft',
        remarks: entry.remarks || '',
      });
      setLineItems(entry.items.length > 0 ? entry.items : [{ item_id: '', qty: 0, basic_rate: 0 }]);
    } else {
      setFormData({
        stock_entry_no: '',
        stock_entry_type: 'material_receipt',
        from_warehouse_id: '',
        to_warehouse_id: '',
        posting_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        remarks: '',
      });
      setLineItems([{ item_id: '', qty: 0, basic_rate: 0 }]);
    }
    setSubmitError(null);
  }, [entry, open]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleAddItem = () => {
    setLineItems((prev) => [...prev, { item_id: '', qty: 0, basic_rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const getPayload = () => {
    const items = lineItems
      .filter((item): item is StockEntryItem => !!item.item_id)
      .map((item) => ({
        item_id: item.item_id,
        source_warehouse_id: item.source_warehouse_id || undefined,
        target_warehouse_id: item.target_warehouse_id || undefined,
        qty: item.qty || 0,
        basic_rate: item.basic_rate || 0,
        uom: item.uom,
      }));

    return {
      stock_entry_no: formData.stock_entry_no || undefined,
      stock_entry_type: formData.stock_entry_type,
      from_warehouse_id: formData.from_warehouse_id || undefined,
      to_warehouse_id: formData.to_warehouse_id || undefined,
      posting_date: new Date(formData.posting_date).toISOString(),
      status: formData.status,
      remarks: formData.remarks || undefined,
      items,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload = getPayload();

    try {
      if (isEditing && entry) {
        await updateEntry(entry.id, payload);
        onUpdated?.();
      } else {
        await createEntry(payload);
        onCreated?.();
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save entry');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Edit Stock Entry' : 'Create Stock Entry'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update the stock entry details' : 'Create a new stock entry for transfers, receipts, or issues'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_entry_no">Entry No.</Label>
                <Input id="stock_entry_no"
                  value={formData.stock_entry_no}
                  onChange={(e) => setFormData({ ...formData, stock_entry_no: e.target.value })}
                  placeholder="Auto-generated"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_entry_type">Entry Type</Label>
                <Select value={formData.stock_entry_type} onValueChange={(value) => setFormData({ ...formData, stock_entry_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entryTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="posting_date">Posting Date</Label>
                <Input id="posting_date"
                  type="date"
                  value={formData.posting_date}
                  onChange={(e) => setFormData({ ...formData, posting_date: e.target.value })}
                  required/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_warehouse_id">From Warehouse</Label>
                <Select value={formData.from_warehouse_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, from_warehouse_id: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_warehouse_id">To Warehouse</Label>
                <Select value={formData.to_warehouse_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, to_warehouse_id: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Additional remarks..."
                rows={2}/>
            </div>

            {/* Line Items */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Line Items</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <ItemLine key={index}
                    item={item}
                    index={index}
                    warehouses={warehouses}
                    items={items}
                    onChange={handleItemChange}
                    onRemove={handleRemoveItem}/>
                ))}
              </div>
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
                'Create Entry'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';

import { Loader2, FileText } from 'lucide-react';

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
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useStockEntryMutations } from '../../hooks/useStock';
import { useWarehouses } from '../../hooks/useWarehouses';
import type { StockEntry, StockEntryStatus } from '../../types/stock.types';

import { StockEntryCsvImport } from './StockEntryCsvImport';
import type { StockEntryLineRow } from './StockEntryLineItemsTable';
import { StockEntryLineItemsTable } from './StockEntryLineItemsTable';

/* ------------------------------------------------------------------ */
/*  Constants & types                                                  */
/* ------------------------------------------------------------------ */

const ENTRY_TYPE_OPTIONS = [
  { value: 'material_receipt', label: 'Material Receipt' },
  { value: 'material_issue', label: 'Material Issue' },
  { value: 'material_transfer', label: 'Material Transfer' },
  { value: 'manufacture', label: 'Manufacture' },
  { value: 'repack', label: 'Repack' },
] as const;

interface FormState {
  stock_entry_no: string;
  stock_entry_type: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  posting_date: string;
  status: StockEntryStatus;
  remarks: string;
}

const DEFAULT_FORM: FormState = {
  stock_entry_no: '',
  stock_entry_type: 'material_receipt',
  from_warehouse_id: '',
  to_warehouse_id: '',
  posting_date: new Date().toISOString().split('T')[0],
  status: 'draft',
  remarks: '',
};

const EMPTY_LINE: StockEntryLineRow = {
  item_id: '',
  qty: 1,
  uom: 'pcs',
  basic_rate: 0,
  amount: 0,
  sort_order: 1,
};

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                       */
/* ------------------------------------------------------------------ */

function buildFormFromEntry(entry: StockEntry): FormState {
  return {
    stock_entry_no: entry.stock_entry_no,
    stock_entry_type: entry.stock_entry_type,
    from_warehouse_id: entry.from_warehouse_id || '',
    to_warehouse_id: entry.to_warehouse_id || '',
    posting_date: entry.posting_date.split('T')[0],
    status: entry.status || 'draft',
    remarks: entry.remarks || '',
  };
}

function buildLinesFromEntry(entry: StockEntry): StockEntryLineRow[] {
  if (!entry.items || entry.items.length === 0) return [{ ...EMPTY_LINE }];
  return entry.items.map((item, idx) => ({
    item_id: item.item_id,
    qty: item.qty || 0,
    uom: item.uom || 'pcs',
    basic_rate: item.basic_rate || 0,
    amount: (item.qty || 0) * (item.basic_rate || 0),
    sort_order: idx + 1,
  }));
}

function buildPayload(form: FormState, lines: StockEntryLineRow[]) {
  const items = lines
    .filter((row) => !!row.item_id)
    .map((row) => ({
      item_id: row.item_id,
      qty: row.qty || 0,
      uom: row.uom || 'pcs',
      basic_rate: row.basic_rate || 0,
    }));

  return {
    stock_entry_no: form.stock_entry_no || undefined,
    stock_entry_type: form.stock_entry_type,
    from_warehouse_id: form.from_warehouse_id || undefined,
    to_warehouse_id: form.to_warehouse_id || undefined,
    posting_date: new Date(form.posting_date).toISOString(),
    status: form.status,
    remarks: form.remarks || undefined,
    items,
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Header fields (entry no, type, date)                */
/* ------------------------------------------------------------------ */

interface HeaderFieldsProps {
  form: FormState;
  onFieldChange: (field: keyof FormState, value: string) => void;
}

function HeaderFields({ form, onFieldChange }: HeaderFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="stock_entry_no">Entry No.</Label>
        <Input id="stock_entry_no"
          value={form.stock_entry_no}
          onChange={(e) => onFieldChange('stock_entry_no', e.target.value)}
          placeholder="Auto-generated" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stock_entry_type">Entry Type</Label>
        <Select value={form.stock_entry_type}
          onValueChange={(v) => onFieldChange('stock_entry_type', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {ENTRY_TYPE_OPTIONS.map((opt) => (
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
          value={form.posting_date}
          onChange={(e) => onFieldChange('posting_date', e.target.value)}
          required />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Warehouse selector                                  */
/* ------------------------------------------------------------------ */

interface WarehouseSelectorProps {
  label: string;
  htmlId: string;
  value: string;
  onChange: (value: string) => void;
}

function WarehouseSelector({ label, htmlId, value, onChange }: WarehouseSelectorProps) {
  const { warehouses, loading } = useWarehouses(1, 100);

  return (
    <div className="space-y-2">
      <Label htmlFor={htmlId}>{label}</Label>
      <Select value={value || 'none'}
        onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Select warehouse" />
        </SelectTrigger>
        <SelectContent>
          <div className="max-h-[200px] overflow-y-auto">
            <SelectItem value="none">None</SelectItem>
            {loading ? (
              <div className="p-2 text-xs text-muted-foreground text-center">Loading...</div>
            ) : (
              warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Conditional warehouse fields by entry type          */
/* ------------------------------------------------------------------ */

interface WarehouseFieldsProps {
  form: FormState;
  onFieldChange: (field: keyof FormState, value: string) => void;
}

function WarehouseFields({ form, onFieldChange }: WarehouseFieldsProps) {
  const entryType = form.stock_entry_type;

  // Material Receipt → only "To Warehouse"
  if (entryType === 'material_receipt') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <WarehouseSelector label="To Warehouse (Destination)"
          htmlId="to_warehouse_id"
          value={form.to_warehouse_id}
          onChange={(v) => onFieldChange('to_warehouse_id', v)} />
      </div>
    );
  }

  // Material Issue → only "From Warehouse"
  if (entryType === 'material_issue') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <WarehouseSelector label="From Warehouse (Source)"
          htmlId="from_warehouse_id"
          value={form.from_warehouse_id}
          onChange={(v) => onFieldChange('from_warehouse_id', v)} />
      </div>
    );
  }

  // Transfer, Manufacture, Repack → both warehouses
  return (
    <div className="grid grid-cols-2 gap-4">
      <WarehouseSelector label="From Warehouse (Source)"
        htmlId="from_warehouse_id"
        value={form.from_warehouse_id}
        onChange={(v) => onFieldChange('from_warehouse_id', v)} />
      <WarehouseSelector label="To Warehouse (Destination)"
        htmlId="to_warehouse_id"
        value={form.to_warehouse_id}
        onChange={(v) => onFieldChange('to_warehouse_id', v)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dialog component                                              */
/* ------------------------------------------------------------------ */

interface StockEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: StockEntry | null;
  onCreated?: () => void;
  onUpdated?: () => void;
}

export function StockEntryDialog({
  open,
  onOpenChange,
  entry,
  onCreated,
  onUpdated,
}: StockEntryDialogProps) {
  const { createEntry, updateEntry, loading } = useStockEntryMutations();
  const isEditing = !!entry;

  const [form, setForm] = React.useState<FormState>({ ...DEFAULT_FORM });
  const [lineItems, setLineItems] = React.useState<StockEntryLineRow[]>([{ ...EMPTY_LINE }]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  /* Reset form when dialog opens / entry changes */
  React.useEffect(() => {
    if (entry) {
      setForm(buildFormFromEntry(entry));
      setLineItems(buildLinesFromEntry(entry));
    } else {
      setForm({ ...DEFAULT_FORM, posting_date: new Date().toISOString().split('T')[0] });
      setLineItems([{ ...EMPTY_LINE }]);
    }
    setSubmitError(null);
  }, [entry, open]);

  /* Field change handler — clears irrelevant warehouse on type switch */
  const handleFieldChange = React.useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'stock_entry_type') {
        if (value === 'material_receipt') next.from_warehouse_id = '';
        if (value === 'material_issue') next.to_warehouse_id = '';
      }
      return next;
    });
  }, []);

  /* CSV import handler — appends imported rows to existing items */
  const handleCsvImport = React.useCallback((rows: StockEntryLineRow[]) => {
    setLineItems((prev) => {
      const existing = prev.filter((r) => !!r.item_id);
      const offset = existing.length;
      const imported = rows.map((r, i) => ({ ...r, sort_order: offset + i + 1 }));
      return existing.length > 0 ? [...existing, ...imported] : imported;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const payload = buildPayload(form, lineItems);
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

  const grandTotal = React.useMemo(
    () => lineItems.reduce((sum, r) => sum + (r.amount || 0), 0),
    [lineItems],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <HeaderFields form={form} onFieldChange={handleFieldChange} />
          <WarehouseFields form={form} onFieldChange={handleFieldChange} />

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks"
              value={form.remarks}
              onChange={(e) => handleFieldChange('remarks', e.target.value)}
              placeholder="Additional remarks..."
              rows={2} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Line Items</h4>
              <StockEntryCsvImport onImport={handleCsvImport} />
            </div>
            <StockEntryLineItemsTable items={lineItems}
              onItemsChange={setLineItems} />
          </div>

          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <DialogFooter>
            <Button type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}>
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

import * as React from 'react';

import { FileText } from 'lucide-react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useStockEntryMutations } from '../../hooks/useStock';
import type { StockEntry, StockEntryFormState } from '../../types/stock.types';
import { stockEntryApi } from '../../utility/api/stock';
import { parseStockEntryCsv, STOCK_ENTRY_SAMPLE_CSV } from '../../utility/stockEntryCsvParser';
import type { BulkUploadResult } from '../shared/CsvImporter';
import { CsvImporter } from '../shared/CsvImporter';
import { StockEntryHeader, StockEntryFooter } from '../stock-entry';

import type { StockEntryLineRow } from './StockEntryLineItemsTable';
import { StockEntryLineItemsTable } from './StockEntryLineItemsTable';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_FORM: StockEntryFormState = {
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

function buildFormFromEntry(entry: StockEntry): StockEntryFormState {
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

function buildPayload(form: StockEntryFormState, lines: StockEntryLineRow[]) {
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

async function saveEntry(
  isEditing: boolean,
  entry: StockEntry | null | undefined,
  payload: ReturnType<typeof buildPayload>,
  createEntry: (data: ReturnType<typeof buildPayload>) => Promise<{ id: string }>,
  updateEntry: (id: string, data: ReturnType<typeof buildPayload>) => Promise<{ id: string }>,
): Promise<string> {
  if (isEditing && entry) {
    const updated = await updateEntry(entry.id, payload);
    return updated.id;
  }
  const created = await createEntry(payload);
  return created.id;
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
  const accessToken = useUserStore((s) => s.accessToken);
  const isEditing = !!entry;

  const [form, setForm] = React.useState<StockEntryFormState>({ ...DEFAULT_FORM });
  const [lineItems, setLineItems] = React.useState<StockEntryLineRow[]>([{ ...EMPTY_LINE }]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [csvPreviewActive, setCsvPreviewActive] = React.useState(false);

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
  const handleFieldChange = React.useCallback((field: keyof StockEntryFormState, value: string) => {
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

  const handleBulkUpload = React.useCallback(async (file: File): Promise<BulkUploadResult> => {
    if (!accessToken) throw new Error('Not authenticated');
    const result = await stockEntryApi.bulkUpload(accessToken, file) as BulkUploadResult;
    onCreated?.();
    return result;
  }, [accessToken, onCreated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const wantsSubmit = form.status === 'submitted';
    const payload = buildPayload(
      wantsSubmit ? { ...form, status: 'draft' } : form,
      lineItems,
    );
    try {
      const savedId = await saveEntry(isEditing, entry, payload, createEntry, updateEntry);
      if (wantsSubmit && accessToken) {
        await stockEntryApi.submit(accessToken, savedId);
      }
      if (isEditing) {
        onUpdated?.();
      } else {
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
          <StockEntryHeader form={form} isEditing={isEditing} onFieldChange={handleFieldChange} />

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
              <CsvImporter<StockEntryLineRow> parseRows={parseStockEntryCsv}
                onImport={handleCsvImport}
                onFileSelected={handleBulkUpload}
                onPreviewChange={setCsvPreviewActive}
                columnsHint="Columns: Stock Entry Type, Item Code, Quantity, UOM, Basic Rate, ..."
                sampleCsv={STOCK_ENTRY_SAMPLE_CSV}
                sampleFileName="stock-entry-sample.csv"
                previewColumns={[
                  { key: 'item_id', label: 'Item Code' },
                  { key: 'qty', label: 'Qty' },
                  { key: 'uom', label: 'UOM' },
                  { key: 'basic_rate', label: 'Basic Rate' },
                  { key: 'amount', label: 'Amount' },
                ]} />
            </div>
            {!csvPreviewActive && (
              <StockEntryLineItemsTable items={lineItems}
                onItemsChange={setLineItems}
                warehouseId={
                  form.stock_entry_type === 'material_receipt'
                    ? form.to_warehouse_id
                    : form.from_warehouse_id
                } />
            )}
          </div>

          <StockEntryFooter onCancel={() => onOpenChange(false)}
            loading={loading}
            isEditing={isEditing}
            submitError={submitError}
            grandTotal={grandTotal}/>
        </form>
      </DialogContent>
    </Dialog>
  );
}

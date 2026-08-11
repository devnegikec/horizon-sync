import * as React from 'react';

import { FileText, Loader2 } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components';


import { useUserStore, useCurrencyStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
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
import { getCurrencySymbol } from '../../types/currency.types';
import { stockEntryApi } from '../../utility/api/stock';
import { itemApi } from '../../utility/api/items';
import { environment } from '../../../environments/environment';
import { parseStockEntryCsv, buildStockEntrySampleCsv } from '../../utility/stockEntryCsvParser';
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
    item_name: item.item_name || undefined,
    item_code: item.item_code || undefined,
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
  viewMode?: boolean;
  onCreated?: () => void;
  onUpdated?: () => void;
}

export function StockEntryDialog({
  open,
  onOpenChange,
  entry,
  viewMode = false,
  onCreated,
  onUpdated,
}: StockEntryDialogProps) {
  const { createEntry, updateEntry, loading } = useStockEntryMutations();
  const accessToken = useUserStore((s) => s.accessToken);
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency || 'USD');
  const isEditing = !!entry;

  const [form, setForm] = React.useState<StockEntryFormState>({ ...DEFAULT_FORM });
  const [lineItems, setLineItems] = React.useState<StockEntryLineRow[]>([{ ...EMPTY_LINE }]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [csvPreviewActive, setCsvPreviewActive] = React.useState(false);
  const [sampleItems, setSampleItems] = React.useState<Array<{ item_code: string; item_name: string; uom?: string }>>([]);
  const [warehouseMap, setWarehouseMap] = React.useState<Record<string, string>>({});
  const [importStatus, setImportStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importing, setImporting] = React.useState(false);

  /* Fetch a few items for the sample CSV */
  React.useEffect(() => {
    if (!accessToken) return;
    itemApi.list(accessToken, 1, 5).then((resp: unknown) => {
      const data = resp as { items?: Array<{ item_code: string; item_name: string; uom?: string }> } | null;
      if (data?.items) setSampleItems(data.items);
    }).catch(() => { /* non-critical */ });

    // Fetch warehouse codes for sample CSV (id → code lookup)
    fetch(`${environment.apiCoreUrl}/api/v1/warehouse-users/my-warehouses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data: { warehouses?: Array<{ id: string; code: string }> }) => {
        const map: Record<string, string> = {};
        for (const wh of data.warehouses ?? []) map[wh.id] = wh.code;
        setWarehouseMap(map);
      })
      .catch(() => { /* non-critical */ });
  }, [accessToken]);

  const sampleCsvContent = React.useMemo(() => {
    const whId = form.to_warehouse_id || form.from_warehouse_id || '';
    const whCode = warehouseMap[whId] || undefined;
    return buildStockEntrySampleCsv(sampleItems.length > 0 ? sampleItems : undefined, whCode);
  }, [sampleItems, warehouseMap, form.to_warehouse_id, form.from_warehouse_id]);

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

  /* Field change handler — clears irrelevant warehouse on type switch, resets items on warehouse change */
  const handleFieldChange = React.useCallback((field: keyof StockEntryFormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'stock_entry_type') {
        if (value === 'material_receipt') next.from_warehouse_id = '';
        if (value === 'material_issue') next.to_warehouse_id = '';
      }
      return next;
    });

    // Reset line items when warehouse changes (stock levels are warehouse-specific)
    if ((field === 'from_warehouse_id' || field === 'to_warehouse_id') && value) {
      setLineItems([{ ...EMPTY_LINE }]);
    }
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
    const text = await file.text();
    const { rows, errors } = parseStockEntryCsv(text);

    const whId = form.stock_entry_type === 'material_receipt' ? form.to_warehouse_id : form.from_warehouse_id;

    if (rows.length > 0 && whId && accessToken) {
      setImporting(true);
      try {
        const resolveItem = async (row: StockEntryLineRow): Promise<StockEntryLineRow> => {
          if (!row.item_id || !accessToken) return row;
          try {
            const url = `${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(row.item_id)}&warehouse_id=${encodeURIComponent(whId)}`;
            const response = await fetch(url, {
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            });
            if (!response.ok) return row;
            const data = await response.json();
            const match = data.items?.find((item: { item_code?: string }) =>
              item.item_code?.toLowerCase() === row.item_id?.toLowerCase()
            ) || data.items?.[0];
            if (match) {
              return {
                ...row,
                item_id: match.id,
                item_name: match.item_name,
                item_code: match.item_code || row.item_id,
                uom: match.uom || row.uom || 'pcs',
                basic_rate: row.basic_rate || parseFloat(match.standard_rate || '0') || 0,
                amount: row.qty * (row.basic_rate || parseFloat(match.standard_rate || '0') || 0),
              };
            }
          } catch {
            // ignore resolution failures
          }
          return row;
        };

        const resolvedRows = await Promise.all(rows.map(resolveItem));

        const resolvedCount = resolvedRows.filter((r) => !!r.item_name).length;
        const unresolvedCount = rows.length - resolvedCount;

        handleCsvImport(resolvedRows);

        if (unresolvedCount > 0) {
          setImportStatus({ type: 'error', message: `${unresolvedCount} item(s) could not be auto-resolved — please select them manually` });
        } else if (resolvedCount > 0) {
          setImportStatus({ type: 'success', message: `${resolvedCount} item(s) imported successfully` });
        }
      } finally {
        setImporting(false);
      }
    } else if (rows.length > 0) {
      handleCsvImport(rows);
    }

    return {
      total_rows: rows.length,
      created: rows.length,
      failed: errors.length,
      errors,
    };
  }, [handleCsvImport, accessToken, form.stock_entry_type, form.to_warehouse_id, form.from_warehouse_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const hasValidItems = lineItems.some((row) => !!row.item_id);
    if (!hasValidItems) {
      setSubmitError('Please add at least one item before saving.');
      return;
    }

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

  const hasValidItems = React.useMemo(
    () => lineItems.some((row) => !!row.item_id),
    [lineItems],
  );

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
              <DialogTitle>{viewMode ? 'View Stock Entry' : isEditing ? 'Edit Stock Entry' : 'Create Stock Entry'}</DialogTitle>
              <DialogDescription>
                {viewMode ? 'Stock entry details' : isEditing ? 'Update the stock entry details' : 'Create a new stock entry for transfers, receipts, or issues'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <StockEntryHeader form={form} isEditing={isEditing} onFieldChange={handleFieldChange} disabled={viewMode}
            fromWarehouseName={viewMode && entry?.from_warehouse ? `${entry.from_warehouse.name} (${entry.from_warehouse.code})` : undefined}
            toWarehouseName={viewMode && entry?.to_warehouse ? `${entry.to_warehouse.name} (${entry.to_warehouse.code})` : undefined} />

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks"
              value={form.remarks}
              onChange={(e) => handleFieldChange('remarks', e.target.value)}
              placeholder="Additional remarks..."
              rows={2}
              disabled={viewMode} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Line Items</h4>
              {!viewMode && (
                <div className="flex items-center gap-2 flex-wrap">
                  <CsvImporter<StockEntryLineRow> parseRows={parseStockEntryCsv}
                    onImport={handleCsvImport}
                    onFileSelected={handleBulkUpload}
                    onPreviewChange={setCsvPreviewActive}
                    columnsHint="Columns: Stock Entry Type, Item Code, Quantity, UOM, Basic Rate, ..."
                    sampleCsv={sampleCsvContent}
                    sampleFileName="stock-entry-sample.csv"
                    previewColumns={[
                      { key: 'item_id', label: 'Item Code' },
                      { key: 'qty', label: 'Qty' },
                      { key: 'uom', label: 'UOM' },
                      { key: 'basic_rate', label: 'Basic Rate' },
                      { key: 'amount', label: 'Amount' },
                    ]} />
                  {importing && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Resolving items...
                    </span>
                  )}
                  {importStatus && !importing && (
                    <Badge variant={importStatus.type === 'success' ? 'success' : 'destructive'}>
                      {importStatus.message}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {!csvPreviewActive && (
              <StockEntryLineItemsTable
                key={form.stock_entry_type === 'material_receipt' ? form.to_warehouse_id : form.from_warehouse_id}
                items={lineItems}
                onItemsChange={setLineItems}
                disabled={viewMode}
                warehouseId={
                  form.stock_entry_type === 'material_receipt'
                    ? form.to_warehouse_id
                    : form.from_warehouse_id
                } />
            )}
          </div>

          {!viewMode && (
            <StockEntryFooter onCancel={() => onOpenChange(false)}
              loading={loading}
              isEditing={isEditing}
              submitError={submitError}
              grandTotal={grandTotal}
              disableSubmit={!hasValidItems} />
          )}

          {viewMode && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm font-medium">
                Total: <span className="text-lg">{currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

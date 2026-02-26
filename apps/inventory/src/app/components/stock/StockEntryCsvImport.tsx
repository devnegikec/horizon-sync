import * as React from 'react';

import { Upload, FileText, X, AlertTriangle } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

import type { StockEntryLineRow } from './StockEntryLineItemsTable';

interface StockEntryCsvImportProps {
  onImport: (rows: StockEntryLineRow[]) => void;
}

interface ParseError {
  row: number;
  message: string;
}

function parseCsvText(text: string): { rows: StockEntryLineRow[]; errors: ParseError[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }] };
  }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const itemIdIdx = header.indexOf('item_id');
  const qtyIdx = header.indexOf('qty');
  const uomIdx = header.indexOf('uom');
  const rateIdx = header.indexOf('basic_rate');

  if (itemIdIdx === -1 || qtyIdx === -1) {
    return { rows: [], errors: [{ row: 0, message: 'CSV must have "item_id" and "qty" columns' }] };
  }

  const rows: StockEntryLineRow[] = [];
  const errors: ParseError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const itemId = cols[itemIdIdx];
    const qty = parseFloat(cols[qtyIdx]);

    if (!itemId) {
      errors.push({ row: i + 1, message: 'Missing item_id' });
      continue;
    }
    if (isNaN(qty) || qty <= 0) {
      errors.push({ row: i + 1, message: `Invalid qty "${cols[qtyIdx]}"` });
      continue;
    }

    const rate = rateIdx !== -1 ? parseFloat(cols[rateIdx]) || 0 : 0;
    const uom = uomIdx !== -1 && cols[uomIdx] ? cols[uomIdx] : 'pcs';

    rows.push({
      item_id: itemId,
      qty,
      uom,
      basic_rate: rate,
      amount: qty * rate,
      sort_order: i,
    });
  }

  return { rows, errors };
}

export function StockEntryCsvImport({ onImport }: StockEntryCsvImportProps) {
  const [errors, setErrors] = React.useState<ParseError[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors: parseErrors } = parseCsvText(text);
      setErrors(parseErrors);
      if (rows.length > 0) {
        onImport(rows);
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleClear = () => {
    setFileName(null);
    setErrors([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" />
          Import CSV
        </Button>
        {fileName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <FileText className="h-3 w-3" />
            <span>{fileName}</span>
            <button type="button" onClick={handleClear} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          Columns: item_id, qty, uom (optional), basic_rate (optional)
        </span>
      </div>
      <input ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange} />
      {errors.length > 0 && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-2 space-y-1">
          {errors.map((err) => (
            <div key={err.row} className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Row {err.row}: {err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

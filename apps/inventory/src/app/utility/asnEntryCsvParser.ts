import { AsnEntryLineRow } from '../components/advance stock notice/AsnEntryLineItemsTable';

// ------------------------------------------------------------------ //
//  Types                                                              //
// ------------------------------------------------------------------ //

export interface AsnEntryCsvRow {
  item_name: string;
  item_code: string;
  quantity: number;
  uom: string;
}

export interface ParseResult {
  rows: AsnEntryLineRow[];
  errors: { row: number; message: string }[];
}

// ------------------------------------------------------------------ //
//  Sample CSV                                                         //
// ------------------------------------------------------------------ //

export const ASN_ENTRY_SAMPLE_CSV = [
  'Item Name,Item Code,Quantity,UOM',
  'Test Item A,ITM-2026-00001,10,KG',
  'Test Item B,ITM-2026-00002,5,PCS',
].join('\n');

// ------------------------------------------------------------------ //
//  Column index map                                                   //
// ------------------------------------------------------------------ //

interface ColIdx {
  itemName: number;
  itemCode: number;
  quantity: number;
  uom: number;
}

const REQUIRED_COLS = ['item code', 'quantity'] as const;

function buildColIdx(headerLine: string): ColIdx | null {
  const cols = headerLine.toLowerCase().split(',').map((h) => h.trim());
  const idx = (name: string) => cols.indexOf(name);

  if (REQUIRED_COLS.some((c) => idx(c) === -1)) return null;

  return {
    itemName: idx('item name'),
    itemCode: idx('item code'),
    quantity: idx('quantity'),
    uom: idx('uom'),
  };
}

// ------------------------------------------------------------------ //
//  Row parser                                                         //
// ------------------------------------------------------------------ //

function parseDataRow(
  cols: string[],
  rowNum: number,
  idx: ColIdx,
  sortOrder: number,
): { row: AsnEntryLineRow } | { error: { row: number; message: string } } {
  const itemCode = cols[idx.itemCode]?.trim();
  const qty = parseFloat(cols[idx.quantity]);

  if (!itemCode) return { error: { row: rowNum, message: 'Missing Item Code' } };
  if (isNaN(qty) || qty <= 0) return { error: { row: rowNum, message: `Invalid Quantity "${cols[idx.quantity]}"` } };

  const uom = idx.uom !== -1 && cols[idx.uom]?.trim() ? cols[idx.uom].trim() : 'pcs';
  const itemName = idx.itemName !== -1 && cols[idx.itemName]?.trim() ? cols[idx.itemName].trim() : '';

  return {
    row: {
      item_id: '',
      item_name: itemName || itemCode,
      item_code: itemCode,
      qty,
      uom,
      sort_order: sortOrder,
    },
  };
}

// ------------------------------------------------------------------ //
//  Public parser                                                      //
// ------------------------------------------------------------------ //

export function parseAsnEntryCsv(text: string): ParseResult {
  const lines = text.trim().split('\n');

  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }] };
  }

  const idx = buildColIdx(lines[0]);
  if (!idx) {
    return { rows: [], errors: [{ row: 0, message: 'CSV must contain "Item Code" and "Quantity" columns' }] };
  }

  const rows: AsnEntryLineRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip blank lines
    const cols = line.split(',');
    const result = parseDataRow(cols, i + 1, idx, i);
    if ('error' in result) errors.push(result.error);
    else rows.push(result.row);
  }

  return { rows, errors };
}

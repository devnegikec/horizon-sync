import type { StockEntryLineRow } from '../components/stock/StockEntryLineItemsTable';

// ------------------------------------------------------------------ //
//  Types                                                              //
// ------------------------------------------------------------------ //

export interface StockEntryCsvRow {
  stock_entry_type: string;
  posting_date: string;
  posting_time: string;
  from_warehouse_code: string;
  to_warehouse_code: string;
  item_code: string;
  description: string;
  remarks: string;
  quantity: number;
  uom: string;
  basic_rate: number;
  valuation_rate: number;
  batch_number: string;
}

export interface ParseResult {
  rows: StockEntryLineRow[];
  errors: { row: number; message: string }[];
}

// ------------------------------------------------------------------ //
//  Sample CSV                                                         //
// ------------------------------------------------------------------ //

export const STOCK_ENTRY_SAMPLE_CSV = [
  'Stock Entry Type,Posting Date,Posting Time,From Warehouse Code,To Warehouse Code,Item Code,Description,Remarks,Quantity,UOM,Basic Rate,Valuation Rate,Batch Number',
  'material_receipt,2026-02-25,09:00,,WH-MXR-02,ITM-2026-00001,test description,no remarks,10,KG,908.00,807.50,BT-008',
  'material_issue,2026-02-25,09:00,WH-MXR-02,,ITM-2026-00002,another item,,5,PCS,150.00,150.00,',
].join('\n');

// ------------------------------------------------------------------ //
//  Column index map                                                   //
// ------------------------------------------------------------------ //

interface ColIdx {
  stockEntryType: number;
  itemCode: number;
  quantity: number;
  uom: number;
  basicRate: number;
  fromWarehouseCode: number;
  toWarehouseCode: number;
}

const REQUIRED_COLS = ['item code', 'quantity'] as const;

function buildColIdx(headerLine: string): ColIdx | null {
  const cols = headerLine.toLowerCase().split(',').map((h) => h.trim());
  const idx = (name: string) => cols.indexOf(name);

  if (REQUIRED_COLS.some((c) => idx(c) === -1)) return null;

  return {
    stockEntryType: idx('stock entry type'),
    itemCode: idx('item code'),
    quantity: idx('quantity'),
    uom: idx('uom'),
    basicRate: idx('basic rate'),
    fromWarehouseCode: idx('from warehouse code'),
    toWarehouseCode: idx('to warehouse code'),
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
): { row: StockEntryLineRow } | { error: { row: number; message: string } } {
  const itemCode = cols[idx.itemCode]?.trim();
  const qty = parseFloat(cols[idx.quantity]);

  if (!itemCode) return { error: { row: rowNum, message: 'Missing Item Code' } };
  if (isNaN(qty) || qty <= 0) return { error: { row: rowNum, message: `Invalid Quantity "${cols[idx.quantity]}"` } };

  const uom = idx.uom !== -1 && cols[idx.uom]?.trim() ? cols[idx.uom].trim() : 'pcs';
  const basicRate = idx.basicRate !== -1 ? parseFloat(cols[idx.basicRate]) || 0 : 0;

  return {
    row: {
      item_id: itemCode,
      qty,
      uom,
      basic_rate: basicRate,
      amount: qty * basicRate,
      sort_order: sortOrder,
    },
  };
}

// ------------------------------------------------------------------ //
//  Public parser                                                      //
// ------------------------------------------------------------------ //

export function parseStockEntryCsv(text: string): ParseResult {
  const lines = text.trim().split('\n');

  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }] };
  }

  const idx = buildColIdx(lines[0]);
  if (!idx) {
    return { rows: [], errors: [{ row: 0, message: 'CSV must contain "Item Code" and "Quantity" columns' }] };
  }

  const rows: StockEntryLineRow[] = [];
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

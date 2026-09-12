import { AsnEntryLineRow } from '../components/advance stock notice/AsnEntryLineItemsTable';

// ------------------------------------------------------------------ //
//  Types                                                              //
// ------------------------------------------------------------------ //

export interface AsnEntryCsvRow {
  item_name: string;
  sku: string;
  no_of_cases: number;
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
  'Item Name,SKU,Number of Cases,UOM',
  'Test Item A,TEST-SKU-A,5,KG',
  'Test Item B,TEST-SKU-B,2,PCS',
].join('\n');

// ------------------------------------------------------------------ //
//  Column index map                                                   //
// ------------------------------------------------------------------ //

interface ColIdx {
  itemName: number;
  sku: number;
  noOfCases: number;
  uom: number;
}

function buildColIdx(headerLine: string): ColIdx | null {
  const cols = headerLine.toLowerCase().split(',').map((h) => h.trim());
  const idx = (name: string) => cols.indexOf(name);
  const casesIndex = ['number of cases', 'no of cases', 'no_of_cases', 'cases', 'quantity']
    .map((name) => idx(name))
    .find((value) => value !== -1) ?? -1;

  if (idx('sku') === -1 || casesIndex === -1) return null;

  return {
    itemName: idx('item name'),
    sku: idx('sku'),
    noOfCases: casesIndex,
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
  const sku = idx.sku !== -1 ? cols[idx.sku]?.trim() : '';
  const noOfCases = parseFloat(cols[idx.noOfCases]);

  if (!sku) return { error: { row: rowNum, message: 'Missing SKU' } };
  if (isNaN(noOfCases) || noOfCases <= 0) return { error: { row: rowNum, message: `Invalid Number of Cases "${cols[idx.noOfCases]}"` } };

  const uom = idx.uom !== -1 && cols[idx.uom]?.trim() ? cols[idx.uom].trim() : 'pcs';
  const itemName = idx.itemName !== -1 && cols[idx.itemName]?.trim() ? cols[idx.itemName].trim() : '';

  return {
    row: {
      item_id: '',
      item_name: itemName || sku,
      item_code: '',
      sku,
      qty: 0,
      no_of_cases: noOfCases,
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
    return { rows: [], errors: [{ row: 0, message: 'CSV must contain "SKU" and "Number of Cases" columns' }] };
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

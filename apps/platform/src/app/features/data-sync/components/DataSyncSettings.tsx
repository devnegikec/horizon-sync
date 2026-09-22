import * as React from 'react';

import { AlertCircle, Check, Database, FileUp, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Badge, Button, Checkbox, Input, Label, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { environment } from '../../../../environments/environment';
import { UserService, type User, type UsersResponse } from '../../../services/user.service';
import { dataSyncService, type FeatureSummary, type ReceiveAsnStep, type SyncableFeature, type WarehouseUserAssignment } from '../services/dataSyncService';

export interface DataSyncSettingsProps {
  accessToken: string;
  canEdit: boolean;
}

interface FeatureResult {
  key: string;
  label: string;
  summary?: FeatureSummary;
  ok: boolean;
}

interface FeatureRowProps {
  feature: SyncableFeature;
  checked: boolean;
  disabled: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

interface ReceiveAsnRow {
  item_id: string;
  batch: string;
  master_pack_size: string;
  no_of_cases: string;
  quantity: string;
}

interface ReceiveAsnCsvRow {
  item_id?: string;
  sku?: string;
  item_code?: string;
  batch?: string;
  no_of_cases: string;
}

/** Message from a rejected promise, falling back to a caller-supplied string. */
function loadFailureMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

function workerNameFrom(user: User): string {
  const full = `${user.first_name} ${user.last_name}`.trim();
  return user.display_name || full || user.email;
}

/** Users from the settled users request — the endpoint has returned either key. */
function usersFromResult(result: PromiseSettledResult<UsersResponse>): User[] {
  if (result.status !== 'fulfilled') return [];
  return result.value.users ?? result.value.items;
}

/**
 * Split one CSV line into trimmed fields, honouring double-quoted fields so a
 * quoted identifier or batch containing commas does not shift the columns.
 */
function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function parseReceiveAsnCsv(text: string): ReceiveAsnCsvRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must include a header and at least one item row.');

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const indexOf = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const itemIdIndex = indexOf('item_id', 'item id');
  const skuIndex = indexOf('sku');
  const itemCodeIndex = indexOf('item_code', 'item code');
  const batchIndex = indexOf('batch');
  const casesIndex = indexOf('no_of_cases', 'number of cases', 'number_of_cases', 'cases');

  if (itemIdIndex < 0 && skuIndex < 0 && itemCodeIndex < 0) {
    throw new Error('CSV must include item_id, SKU, or item_code.');
  }
  if (casesIndex < 0) throw new Error('CSV must include a number of cases column.');

  return lines.slice(1).map((line, rowIndex) => {
    const columns = splitCsvLine(line);
    const noOfCases = columns[casesIndex] ?? '';
    if (!/^\d+$/.test(noOfCases) || Number(noOfCases) < 1) {
      throw new Error(`Invalid number of cases on CSV row ${rowIndex + 2}.`);
    }
    return {
      item_id: itemIdIndex >= 0 ? columns[itemIdIndex] : undefined,
      sku: skuIndex >= 0 ? columns[skuIndex] : undefined,
      item_code: itemCodeIndex >= 0 ? columns[itemCodeIndex] : undefined,
      batch: batchIndex >= 0 ? columns[batchIndex] : undefined,
      no_of_cases: noOfCases,
    };
  });
}

const INBOUND_STEPS: Array<{ key: ReceiveAsnStep; title: string; description: string }> = [
  {
    key: 'qr_blocks',
    title: 'Create QR block & batch',
    description: 'Generate QR blocks (with batch) for the configured items, or receive existing block IDs.',
  },
  {
    key: 'asn',
    title: 'Create ASN',
    description: 'Create and confirm an Advance Stock Notice from the QR block items.',
  },
  {
    key: 'receiving_slip',
    title: 'Generate receiving slip',
    description: 'Run the inbound scan session and produce a receiving slip.',
  },
  {
    key: 'put_away',
    title: 'Create put-away',
    description: 'Generate a put-away list from the receiving slip (Auto mode, auto-assigned worker).',
  },
];

function FeatureRow({ feature, checked, disabled, onToggle }: FeatureRowProps) {
  const inputId = `data-sync-${feature.key}`;
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50">
      <Checkbox id={inputId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onToggle(feature.key, value === true)}
        className="mt-0.5" />
      <Label htmlFor={inputId} className="flex cursor-pointer flex-col gap-0.5">
        <span className="text-sm font-medium">{feature.label}</span>
        <span className="text-xs font-normal text-muted-foreground">{feature.description}</span>
      </Label>
    </div>
  );
}

function putAwaySummaryLabel(putAwayCount: number, status?: string): string {
  const plural = putAwayCount === 1 ? '' : 's';
  return `${putAwayCount} put-away list${plural}${status ? ` · ${status}` : ''}`;
}

/** Badge copy for one feature's sync result. */
function syncResultBadge(summary?: FeatureSummary): string {
  if (!summary) return 'done';
  if (summary.put_away_count !== undefined) {
    return putAwaySummaryLabel(summary.put_away_count, summary.put_away_status);
  }
  return `${summary.created ?? 0} created · ${summary.skipped ?? 0} skipped`;
}

function hasPutAwayLists(summary?: FeatureSummary): boolean {
  const listNos = summary?.put_away_list_nos;
  if (listNos && listNos.length > 0) return true;
  return Boolean(summary?.put_away_list_no);
}

function putAwayListsLabel(summary?: FeatureSummary): string {
  return summary?.put_away_list_nos?.join(', ') ?? summary?.put_away_list_no ?? '';
}

function SyncResults({ results }: { results: FeatureResult[] }) {
  if (results.length === 0) return null;
  return (
    <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Last sync result</p>
      {results.map((result) => (
        <React.Fragment key={result.key}>
          <div className="flex items-center justify-between text-sm">
            <span>{result.label}</span>
            <Badge variant="outline">{syncResultBadge(result.summary)}</Badge>
          </div>
          {hasPutAwayLists(result.summary) && (
            <p className="text-xs text-muted-foreground">
              Put-away lists: {putAwayListsLabel(result.summary)}
            </p>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface ReceiveAsnItemOption {
  id: string;
  item_name: string;
  sku?: string | null;
  item_code?: string;
  items_per_master_pack?: number | null;
}

const BATCH_SUFFIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Four random upper-case alphanumeric characters, e.g. `A5U7`. */
function randomBatchSuffix(): string {
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += BATCH_SUFFIX_CHARS[Math.floor(Math.random() * BATCH_SUFFIX_CHARS.length)];
  }
  return suffix;
}

/** Auto batch label in the form `BT-SEP-15-A5U7`. */
function receiveAsnBatchLabel(): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(now.getDate()).padStart(2, '0');
  return `BT-${month}-${day}-${randomBatchSuffix()}`;
}

function effectiveMasterPack(item: ReceiveAsnItemOption | undefined, row: ReceiveAsnRow): string {
  const pack = item?.items_per_master_pack;
  if (pack && pack > 0) return String(pack);
  return row.master_pack_size;
}

function effectiveCaseCount(row: ReceiveAsnRow): string {
  return parseInt(row.no_of_cases, 10) > 0 ? row.no_of_cases : '5';
}

function multipliedQuantity(masterPackSize: string, cases: string): string {
  const pack = parseInt(masterPackSize, 10);
  const count = parseInt(cases, 10);
  return !isNaN(pack) && !isNaN(count) ? String(pack * count) : '0';
}

/** Case count and quantity implied by a directly-typed quantity. */
function quantityToCases(requestedQty: number, masterPack: number, row: ReceiveAsnRow): { noOfCases: string; quantity: string } {
  const usablePack = !isNaN(masterPack) && masterPack > 0;
  if (usablePack && !isNaN(requestedQty)) {
    const noOfCases = Math.max(1, Math.round(requestedQty / masterPack));
    return { noOfCases: String(noOfCases), quantity: String(masterPack * noOfCases) };
  }
  const fallbackCases = parseInt(row.no_of_cases, 10) || 1;
  return {
    noOfCases: String(fallbackCases),
    quantity: usablePack ? String(masterPack * fallbackCases) : String(requestedQty || 0),
  };
}

/** Apply one field edit to a row, recomputing the values derived from it. */
function applyReceiveAsnItemChange(
  row: ReceiveAsnRow,
  field: keyof ReceiveAsnRow,
  value: string,
  items: ReceiveAsnItemOption[],
): ReceiveAsnRow {
  const item = items.find((candidate) => candidate.id === value);
  const masterPackSize = effectiveMasterPack(item, row);

  if (field === 'item_id') {
    const cases = effectiveCaseCount(row);
    return {
      ...row,
      item_id: value,
      batch: receiveAsnBatchLabel(),
      master_pack_size: masterPackSize,
      no_of_cases: cases,
      quantity: multipliedQuantity(masterPackSize, cases),
    };
  }
  if (field === 'no_of_cases') {
    return { ...row, no_of_cases: value, quantity: multipliedQuantity(masterPackSize, value) };
  }
  if (field === 'master_pack_size') {
    // Pack size drives the quantity, so a manual override must recompute it.
    // Persist the case count used for the product too: `effectiveCaseCount`
    // falls back to a default when the field is blank, and submission clamps a
    // blank case count to 1, which would leave quantity and cases disagreeing.
    const cases = effectiveCaseCount(row);
    return { ...row, master_pack_size: value, no_of_cases: cases, quantity: multipliedQuantity(value, cases) };
  }
  if (field === 'quantity') {
    const { noOfCases, quantity } = quantityToCases(parseInt(value, 10), parseInt(masterPackSize, 10), row);
    return { ...row, no_of_cases: noOfCases, quantity };
  }
  return { ...row, [field]: value };
}

function findCsvItem(csvRow: ReceiveAsnCsvRow, items: ReceiveAsnItemOption[]): ReceiveAsnItemOption | undefined {
  const identifier = (csvRow.item_id || csvRow.sku || csvRow.item_code || '').toLowerCase();
  return items.find((candidate) => [candidate.id, candidate.sku, candidate.item_code]
    .filter(Boolean)
    .some((value) => value?.toLowerCase() === identifier));
}

function receiveAsnRowFromCsv(csvRow: ReceiveAsnCsvRow, rowNumber: number, items: ReceiveAsnItemOption[]): ReceiveAsnRow {
  const item = findCsvItem(csvRow, items);
  if (!item) {
    throw new Error(`Item not found for CSV row ${rowNumber}: ${csvRow.item_id || csvRow.sku || csvRow.item_code}`);
  }
  const masterPackSize = Math.max(1, item.items_per_master_pack ?? 1);
  const noOfCases = Math.max(1, Number(csvRow.no_of_cases));
  return {
    item_id: item.id,
    batch: csvRow.batch || receiveAsnBatchLabel(),
    master_pack_size: String(masterPackSize),
    no_of_cases: String(noOfCases),
    quantity: String(masterPackSize * noOfCases),
  };
}

/** Payload rows for the receive-ASN sync, derived from the configured item rows. */
function syncItemRows(rows: ReceiveAsnRow[]) {
  return rows.filter((row) => row.item_id).map((row) => ({
    item_id: row.item_id,
    batch: row.batch,
    quantity: Math.max(1, parseInt(row.quantity, 10) || 1),
    no_of_cases: Math.max(1, parseInt(row.no_of_cases, 10) || 1),
    master_pack_size: row.master_pack_size ? Math.max(1, parseInt(row.master_pack_size, 10) || 1) : 0,
  }));
}

interface ReceiveAsnSyncInput {
  mode: 'items' | 'block_ids';
  steps: Record<string, boolean>;
  qrImage: boolean;
  rows: ReceiveAsnRow[];
  blockIds: string;
  qrType: string;
  asnType: string;
  targetWarehouseId: string;
  sourceWarehouseId: string;
  workerIds: string[];
}

/** Receive-ASN block of the sync request, shaped for the data-sync service. */
function buildReceiveAsnSyncInput(input: ReceiveAsnSyncInput) {
  const usesItems = input.mode === 'items';
  return {
    mode: input.mode,
    steps: INBOUND_STEPS.filter((step) => input.steps[step.key]).map((step) => step.key),
    qr_image: input.qrImage,
    items: usesItems ? syncItemRows(input.rows) : [],
    block_ids: usesItems ? [] : input.blockIds.split(',').map((value) => value.trim()).filter(Boolean),
    qr_type: input.qrType,
    asn_type: input.asnType,
    target_warehouse_id: input.targetWarehouseId || undefined,
    put_away_worker_ids: input.workerIds,
    source_warehouse_id: input.asnType === 'internal_transfer' ? (input.sourceWarehouseId || undefined) : undefined,
  };
}

function featureResultFrom(feature: SyncableFeature, result: Awaited<ReturnType<typeof dataSyncService.sync>>): FeatureResult {
  const summary = result.summary?.[feature.key];
  const usable = typeof summary === 'object' && summary !== null;
  return {
    key: feature.key,
    label: feature.label,
    summary: usable ? (summary as FeatureSummary) : undefined,
    ok: true,
  };
}

interface WarehouseOption {
  id: string;
  name: string;
  code?: string;
}

/** Everything the per-step inbound panels need, threaded from DataSyncSettings. */
interface InboundStepFieldsProps {
  stepKey: string;
  canEdit: boolean;
  syncing: boolean;
  mode: 'items' | 'block_ids';
  onModeChange: (value: 'items' | 'block_ids') => void;
  qrType: string;
  onQrTypeChange: (value: string) => void;
  qrImage: boolean;
  onQrImageChange: (value: boolean) => void;
  itemOptions: ReceiveAsnItemOption[];
  rows: ReceiveAsnRow[];
  onUpdateRow: (idx: number, field: keyof ReceiveAsnRow, value: string) => void;
  onRemoveRow: (idx: number) => void;
  onAddRow: () => void;
  onImportCsv: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  blockIds: string;
  onBlockIdsChange: (value: string) => void;
  asnType: string;
  onAsnTypeChange: (value: string) => void;
  warehouses: WarehouseOption[];
  targetWarehouseId: string;
  onTargetWarehouseChange: (value: string) => void;
  sourceWarehouseId: string;
  onSourceWarehouseChange: (value: string) => void;
  workersLoading: boolean;
  workersError: string | null;
  assignments: WarehouseUserAssignment[];
  selectedWorkerIds: string[];
  onToggleWorker: (userId: string, checked: boolean) => void;
  workerNames: Record<string, string>;
  requiresWorker: boolean;
}

function itemOptionSuffix(item: ReceiveAsnItemOption): string {
  return item.sku ?? item.item_code ?? item.id.slice(0, 8);
}

function QrBlocksFields({
  canEdit,
  syncing,
  mode,
  onModeChange,
  qrType,
  onQrTypeChange,
  qrImage,
  onQrImageChange,
  itemOptions,
  rows,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
  onImportCsv,
  csvInputRef,
  blockIds,
  onBlockIdsChange,
}: InboundStepFieldsProps) {
  const locked = !canEdit || syncing;

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="receive-asn-mode">Mode</Label>
          <Select value={mode} onValueChange={onModeChange} disabled={locked}>
            <SelectTrigger id="receive-asn-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="items">Configured items</SelectItem>
              <SelectItem value="block_ids">Existing block IDs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">QR type</Label>
          <Select value={qrType} onValueChange={onQrTypeChange} disabled={locked}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dynamic">Dynamic</SelectItem>
              <SelectItem value="static">Static</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id="receive-asn-qr-image"
          checked={qrImage}
          disabled={locked}
          onCheckedChange={(value) => onQrImageChange(value === true)}/>
        <Label htmlFor="receive-asn-qr-image" className="cursor-pointer text-sm">
          Generate QR image after QR codes are created
        </Label>
      </div>

      {mode === 'items' ? (
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_64px_64px_72px_36px] items-end gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Item</Label>
                <Select value={row.item_id} onValueChange={(v) => onUpdateRow(idx, 'item_id', v)} disabled={locked}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.item_name} ({itemOptionSuffix(option)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Batch</Label>
                <Input value={row.batch} onChange={(e) => onUpdateRow(idx, 'batch', e.target.value)} disabled={locked} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pack</Label>
                <Input type="number" value={row.master_pack_size} placeholder="Auto" disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Box</Label>
                <Input type="number" min={1} value={row.no_of_cases} onChange={(e) => onUpdateRow(idx, 'no_of_cases', e.target.value)} disabled={locked} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={row.quantity} onChange={(e) => onUpdateRow(idx, 'quantity', e.target.value)} disabled={locked} />
              </div>
              <button type="button"
                onClick={() => onRemoveRow(idx)}
                disabled={locked}
                aria-label="Remove item"
                title="Remove item"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-40">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onAddRow} disabled={locked} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add item
            </Button>
            <Button variant="outline"
              size="sm"
              onClick={() => csvInputRef.current?.click()}
              disabled={locked || itemOptions.length === 0}
              className="gap-1">
              <FileUp className="h-3.5 w-3.5" />
              Import CSV
            </Button>
            <Input ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onImportCsv}
              className="hidden"/>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="receive-asn-block-ids">Block IDs (comma-separated)</Label>
          <Input id="receive-asn-block-ids"
            value={blockIds}
            onChange={(e) => onBlockIdsChange(e.target.value)}
            placeholder="uuid1, uuid2, ..."
            disabled={locked}
            className="font-mono"/>
        </div>
      )}
    </div>
  );
}

function AsnFields({
  canEdit,
  syncing,
  asnType,
  onAsnTypeChange,
  warehouses,
  targetWarehouseId,
  onTargetWarehouseChange,
  sourceWarehouseId,
  onSourceWarehouseChange,
}: InboundStepFieldsProps) {
  const locked = !canEdit || syncing;

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">ASN Type</Label>
          <Select value={asnType} onValueChange={onAsnTypeChange} disabled={locked}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stock_receipt">Stock Receipt</SelectItem>
              <SelectItem value="internal_transfer">Internal Transfer</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Target Warehouse</Label>
          <Select value={targetWarehouseId} onValueChange={onTargetWarehouseChange} disabled={locked}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code ?? wh.id.slice(0, 8)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {asnType === 'internal_transfer' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Source Warehouse</Label>
            <Select value={sourceWarehouseId} onValueChange={onSourceWarehouseChange} disabled={locked}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code ?? wh.id.slice(0, 8)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

function workerTriggerLabel(workersLoading: boolean, count: number): string {
  if (workersLoading) return 'Loading workers...';
  if (count === 0) return 'Select at least one worker';
  return `${count} worker${count === 1 ? '' : 's'} selected`;
}

/** Popover body listing the assignable put-away workers. */
function WorkerPickerList({
  workersError,
  assignments,
  hasTarget,
  selectedWorkerIds,
  onToggleWorker,
  workerNames,
}: {
  workersError: string | null;
  assignments: WarehouseUserAssignment[];
  hasTarget: boolean;
  selectedWorkerIds: string[];
  onToggleWorker: (userId: string, checked: boolean) => void;
  workerNames: Record<string, string>;
}) {
  if (workersError) return <p className="p-2 text-sm text-destructive">{workersError}</p>;
  if (assignments.length === 0) {
    return (
      <p className="p-2 text-sm text-muted-foreground">
        {hasTarget ? 'No active workers found for this warehouse.' : 'Select a target warehouse first.'}
      </p>
    );
  }
  return (
    <div className="max-h-56 space-y-1 overflow-y-auto">
      {assignments.map((assignment) => {
        const selectedWorker = selectedWorkerIds.includes(assignment.user_id);
        return (
          <label key={assignment.user_id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted">
            <Checkbox checked={selectedWorker}
              onCheckedChange={(checked) => onToggleWorker(assignment.user_id, checked === true)}/>
            <span>{workerNames[assignment.user_id] ?? assignment.user_id}</span>
            {selectedWorker && <Check className="ml-auto h-4 w-4" />}
          </label>
        );
      })}
    </div>
  );
}

function PutAwayFields({
  canEdit,
  syncing,
  targetWarehouseId,
  workersLoading,
  workersError,
  assignments,
  selectedWorkerIds,
  onToggleWorker,
  workerNames,
  requiresWorker,
}: InboundStepFieldsProps) {
  const locked = !canEdit || syncing;
  const count = selectedWorkerIds.length;
  const triggerDisabled = locked || workersLoading || !targetWarehouseId;

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <Label htmlFor="receive-asn-put-away-workers">Put-away workers *</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button id="receive-asn-put-away-workers"
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
            disabled={triggerDisabled}>
            <span className="truncate">{workerTriggerLabel(workersLoading, count)}</span>
            <span className="ml-2 text-muted-foreground">⌄</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
          <WorkerPickerList workersError={workersError}
            assignments={assignments}
            hasTarget={Boolean(targetWarehouseId)}
            selectedWorkerIds={selectedWorkerIds}
            onToggleWorker={onToggleWorker}
            workerNames={workerNames}/>
        </PopoverContent>
      </Popover>
      {workersError && (
        <p className="text-xs text-destructive">{workersError}</p>
      )}
      {requiresWorker && count === 0 && (
        <p className="text-xs text-destructive">Select at least one active worker before syncing.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Select one or more active workers from the target warehouse. Each worker receives a separate put-away list.
      </p>
    </div>
  );
}

/** The step-specific fields shown under a selected inbound step. */
function InboundStepFields(props: InboundStepFieldsProps) {
  const { stepKey } = props;
  if (stepKey === 'qr_blocks') return <QrBlocksFields {...props} />;
  if (stepKey === 'asn') return <AsnFields {...props} />;
  if (stepKey === 'put_away') return <PutAwayFields {...props} />;
  return null;
}

/** Loading / error / empty states for the sync settings body. */
function SyncBody({ loading, error, isEmpty, onRetry, children }: {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {error}
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }
  if (isEmpty) {
    return <p className="text-sm text-muted-foreground">No syncable data categories are available.</p>;
  }
  return <>{children}</>;
}

/** Warehouse / quantity fields shown for the stock-related features. */
function StockOptions({ selected, locked, warehouses, selectedWarehouseId, onWarehouseChange, stockBoostQty, onStockBoostChange }: {
  selected: Record<string, boolean>;
  locked: boolean;
  warehouses: WarehouseOption[];
  selectedWarehouseId: string;
  onWarehouseChange: (value: string) => void;
  stockBoostQty: string;
  onStockBoostChange: (value: string) => void;
}) {
  return (
    <>
      {selected['stock'] && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <Label htmlFor="sync-warehouse">Warehouse</Label>
          <Select value={selectedWarehouseId} onValueChange={onWarehouseChange} disabled={locked}>
            <SelectTrigger id="sync-warehouse" className="w-full">
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code ?? wh.id.slice(0, 8)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selected['stock_boost'] && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <Label htmlFor="stock-boost-qty">Increase quantity per item</Label>
          <Input id="stock-boost-qty"
            type="number"
            min={1}
            value={stockBoostQty}
            onChange={(e) => onStockBoostChange(e.target.value)}
            disabled={locked}
            className="w-full"/>
        </div>
      )}
    </>
  );
}

/** Last-sync results followed by the select-all / sync controls. */
function SyncActions({ results, locked, selectedCount, syncDisabled, syncing, onSelectAll, onClearAll, onSync }: {
  results: FeatureResult[] | null;
  locked: boolean;
  selectedCount: number;
  syncDisabled: boolean;
  syncing: boolean;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSync: () => void;
}) {
  return (
    <>
      {results && <SyncResults results={results} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={locked} onClick={onSelectAll}>
            Select all
          </Button>
          <Button variant="ghost" size="sm" disabled={locked} onClick={onClearAll}>
            Clear
          </Button>
        </div>
        <Button disabled={syncDisabled} onClick={onSync}>
          {syncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing…
            </>
          ) : (
            `Sync ${selectedCount} selected`
          )}
        </Button>
      </div>
    </>
  );
}

export function DataSyncSettings({ accessToken, canEdit }: DataSyncSettingsProps) {
  const { toast } = useToast();  const [features, setFeatures] = React.useState<SyncableFeature[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [results, setResults] = React.useState<FeatureResult[] | null>(null);
  const [warehouses, setWarehouses] = React.useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState('');
  const [stockBoostQty, setStockBoostQty] = React.useState('100');
  const [items, setItems] = React.useState<ReceiveAsnItemOption[]>([]);
  const [receiveAsnMode, setReceiveAsnMode] = React.useState<'items' | 'block_ids'>('items');
  const [receiveAsnSteps, setReceiveAsnSteps] = React.useState<Record<string, boolean>>({
    qr_blocks: true,
    asn: true,
    receiving_slip: true,
    put_away: false,
  });
  const [receiveAsnQrImage, setReceiveAsnQrImage] = React.useState(true);
  const [receiveAsnItems, setReceiveAsnItems] = React.useState<ReceiveAsnRow[]>([]);
  const [receiveAsnQrType, setReceiveAsnQrType] = React.useState('dynamic');
  const [receiveAsnBlockIds, setReceiveAsnBlockIds] = React.useState('');
  const [receiveAsnType, setReceiveAsnType] = React.useState('purchase');
  const [receiveAsnTargetWarehouseId, setReceiveAsnTargetWarehouseId] = React.useState('');
  const [receiveAsnSourceWarehouseId, setReceiveAsnSourceWarehouseId] = React.useState('');
  const [warehouseUserAssignments, setWarehouseUserAssignments] = React.useState<WarehouseUserAssignment[]>([]);
  const [selectedPutAwayWorkerIds, setSelectedPutAwayWorkerIds] = React.useState<string[]>([]);
  const [workerNames, setWorkerNames] = React.useState<Record<string, string>>({});
  const [workersLoading, setWorkersLoading] = React.useState(false);
  const [workersError, setWorkersError] = React.useState<string | null>(null);
  const receiveAsnCsvInputRef = React.useRef<HTMLInputElement>(null);
  const locked = !canEdit || syncing;

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalog = await dataSyncService.listFeatures(accessToken);
      setFeatures(catalog);
      setSelected(Object.fromEntries(catalog.map((feature) => [feature.key, false])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data sync features');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const fetchWarehouses = async () => {
      if (!accessToken) return;
      try {
        const url = `${environment.apiCoreUrl}/api/v1/warehouses?page=1&page_size=100&is_active=true&scope=all`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          const list: Array<{ id: string; name: string; code?: string }> = data.warehouses || [];
          setWarehouses(list);
          if (!selectedWarehouseId && list.length > 0) {
            setSelectedWarehouseId(list[0].id);
          }
          if (!receiveAsnTargetWarehouseId && list.length > 0) {
            setReceiveAsnTargetWarehouseId(list[0].id);
          }
        }
      } catch {
        // warehouse selector is best-effort
      }
    };
    void fetchWarehouses();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setSelectedPutAwayWorkerIds([]);
    setWarehouseUserAssignments([]);
    setWorkersError(null);
    if (!accessToken || !receiveAsnTargetWarehouseId) return;

    let cancelled = false;
    setWorkersLoading(true);
    void Promise.allSettled([
      dataSyncService.listWarehouseUsers(accessToken, receiveAsnTargetWarehouseId),
      UserService.getUsers(1, 100, accessToken),
    ]).then(([assignmentsResult, usersResult]) => {
      if (cancelled) return;
      if (assignmentsResult.status === 'rejected') {
        setWorkersError(loadFailureMessage(assignmentsResult.reason, 'Failed to load workers for the selected warehouse.'));
        return;
      }
      const assignments = Array.isArray(assignmentsResult.value) ? assignmentsResult.value : [];
      const users = usersFromResult(usersResult);
      setWarehouseUserAssignments(assignments.filter((assignment) => assignment.user_id));
      setWorkerNames(Object.fromEntries(users.map((user) => [user.id, workerNameFrom(user)])));
      if (usersResult.status === 'rejected') {
        setWorkersError('Workers loaded, but their names could not be loaded. User IDs are shown instead.');
      }
    }).finally(() => {
      if (!cancelled) setWorkersLoading(false);
    });

    return () => { cancelled = true; };
  }, [accessToken, receiveAsnTargetWarehouseId]);

  React.useEffect(() => {
    const fetchItems = async () => {
      if (!accessToken) return;
      try {
        const fetchPage = async (page: number) => {
          const url = `${environment.apiCoreUrl}/api/v1/items?page=${page}&page_size=100`;
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          });
          if (!response.ok) return null;
          return await response.json();
        };

        const firstPage = await fetchPage(1);
        if (!firstPage) return;
        let list: Array<{ id: string; item_name: string; sku?: string | null; item_code?: string }> = firstPage.items || [];
        const totalPages = firstPage.pagination?.total_pages ?? 1;
        for (let page = 2; page <= totalPages; page++) {
          const nextPage = await fetchPage(page);
          if (!nextPage) break;
          list = list.concat(nextPage.items || []);
        }
        setItems(list);
      } catch {
        // item selector is best-effort
      }
    };
    void fetchItems();
  }, [accessToken]);

  const selectedKeys = features.filter((feature) => selected[feature.key]).map((feature) => feature.key);

  const toggleFeature = (key: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [key]: checked }));
  };

  const selectAll = () => {
    setSelected(Object.fromEntries(features.map((feature) => [feature.key, true])));
  };

  const clearAll = () => {
    setSelected(Object.fromEntries(features.map((feature) => [feature.key, false])));
  };

  const updateReceiveAsnItem = (idx: number, field: keyof ReceiveAsnRow, value: string) => {
    setReceiveAsnItems((prev) => prev.map((row, i) => (i === idx ? applyReceiveAsnItemChange(row, field, value, items) : row)));
  };

  const addReceiveAsnItem = () => {
    setReceiveAsnItems((prev) => [...prev, { item_id: '', batch: '', master_pack_size: '', quantity: '', no_of_cases: '1' }]);
  };

  const importReceiveAsnItems = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const importedRows = parseReceiveAsnCsv(String(reader.result ?? ''));
        const rows = importedRows.map((csvRow, index) => receiveAsnRowFromCsv(csvRow, index + 2, items));
        setReceiveAsnItems(rows);
        toast({ title: 'ASN items imported', description: `${rows.length} item${rows.length === 1 ? '' : 's'} loaded from ${file.name}.` });
      } catch (err) {
        toast({
          title: 'ASN CSV import failed',
          description: err instanceof Error ? err.message : 'Could not import ASN items.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const removeReceiveAsnItem = (idx: number) => {
    setReceiveAsnItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const togglePutAwayWorker = (userId: string, checked: boolean) => {
    setSelectedPutAwayWorkerIds((current) => (checked ? [...current, userId] : current.filter((id) => id !== userId)));
  };

  const toggleInboundStep = (key: string, checked: boolean) => {
    setReceiveAsnSteps((prev) => {
      const next = { ...prev, [key]: checked };
      if (!checked) {
        // Unselecting a step also disables every later step (they depend on it).
        const idx = INBOUND_STEPS.findIndex((step) => step.key === key);
        for (let i = idx + 1; i < INBOUND_STEPS.length; i++) {
          next[INBOUND_STEPS[i].key] = false;
        }
      }
      return next;
    });
  };

  const handleSync = async () => {
    if (selectedKeys.length === 0) return;
    setSyncing(true);
    setResults(null);
    try {
      const result = await dataSyncService.sync(
        accessToken,
        selectedKeys,
        'USD',
        selected['stock'] ? selectedWarehouseId : undefined,
        selected['stock_boost'] ? Math.max(1, parseInt(stockBoostQty, 10) || 100) : undefined,
        selected['receive_asn']
          ? buildReceiveAsnSyncInput({
            mode: receiveAsnMode,
            steps: receiveAsnSteps,
            qrImage: receiveAsnQrImage,
            rows: receiveAsnItems,
            blockIds: receiveAsnBlockIds,
            qrType: receiveAsnQrType,
            asnType: receiveAsnType,
            targetWarehouseId: receiveAsnTargetWarehouseId,
            sourceWarehouseId: receiveAsnSourceWarehouseId,
            workerIds: selectedPutAwayWorkerIds,
          })
          : undefined
      );
      setResults(features.filter((feature) => selected[feature.key]).map((feature) => featureResultFrom(feature, result)));
      toast({
        title: 'Data sync complete',
        description: result.message,
      });
    } catch (err) {
      toast({
        title: 'Data sync failed',
        description: err instanceof Error ? err.message : 'Failed to sync data',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const putAwayRequiresWorker = selected['receive_asn'] && receiveAsnSteps.put_away;
  const syncDisabled = !canEdit || syncing || selectedKeys.length === 0 || Boolean(putAwayRequiresWorker && selectedPutAwayWorkerIds.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sync
        </CardTitle>
        <CardDescription>
          Seed default master data on demand. Pick a category below and sync it — syncing is idempotent, so existing records are skipped and only
          missing data is created.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <SyncBody loading={loading}
          error={error}
          isEmpty={features.length === 0}
          onRetry={() => void load()}>
          <>
            <div className="space-y-1">
              {features.map((feature) => (
                <FeatureRow key={feature.key}
                  feature={feature}
                  checked={Boolean(selected[feature.key])}
                  disabled={locked}
                  onToggle={toggleFeature} />
              ))}
            </div>

            <StockOptions selected={selected}
              locked={locked}
              warehouses={warehouses}
              selectedWarehouseId={selectedWarehouseId}
              onWarehouseChange={setSelectedWarehouseId}
              stockBoostQty={stockBoostQty}
              onStockBoostChange={setStockBoostQty}/>

            {selected['receive_asn'] && (
              <div className="space-y-3 rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Inbound Automation runs the selected steps in sequence — each step depends on the previous one.
                </p>

                {INBOUND_STEPS.map((step, index) => {
                  const stepSelected = Boolean(receiveAsnSteps[step.key]);
                  const previousSelected =
                    index === 0 || Boolean(receiveAsnSteps[INBOUND_STEPS[index - 1].key]);
                  return (
                    <div key={step.key} className="rounded-md border border-border bg-muted/20 p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox id={`inbound-step-${step.key}`}
                          checked={stepSelected}
                          disabled={!canEdit || syncing || !previousSelected}
                          onCheckedChange={(value) => toggleInboundStep(step.key, value === true)}
                          className="mt-0.5"/>
                        <Label htmlFor={`inbound-step-${step.key}`} className="flex cursor-pointer flex-col gap-0.5">
                          <span className="text-sm font-medium">
                            Step {index + 1}: {step.title}
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">{step.description}</span>
                        </Label>
                      </div>

                      {stepSelected && (
                        <InboundStepFields stepKey={step.key}
                          canEdit={canEdit}
                          syncing={syncing}
                          mode={receiveAsnMode}
                          onModeChange={setReceiveAsnMode}
                          qrType={receiveAsnQrType}
                          onQrTypeChange={setReceiveAsnQrType}
                          qrImage={receiveAsnQrImage}
                          onQrImageChange={setReceiveAsnQrImage}
                          itemOptions={items}
                          rows={receiveAsnItems}
                          onUpdateRow={updateReceiveAsnItem}
                          onRemoveRow={removeReceiveAsnItem}
                          onAddRow={addReceiveAsnItem}
                          onImportCsv={importReceiveAsnItems}
                          csvInputRef={receiveAsnCsvInputRef}
                          blockIds={receiveAsnBlockIds}
                          onBlockIdsChange={setReceiveAsnBlockIds}
                          asnType={receiveAsnType}
                          onAsnTypeChange={setReceiveAsnType}
                          warehouses={warehouses}
                          targetWarehouseId={receiveAsnTargetWarehouseId}
                          onTargetWarehouseChange={setReceiveAsnTargetWarehouseId}
                          sourceWarehouseId={receiveAsnSourceWarehouseId}
                          onSourceWarehouseChange={setReceiveAsnSourceWarehouseId}
                          workersLoading={workersLoading}
                          workersError={workersError}
                          assignments={warehouseUserAssignments}
                          selectedWorkerIds={selectedPutAwayWorkerIds}
                          onToggleWorker={togglePutAwayWorker}
                          workerNames={workerNames}
                          requiresWorker={putAwayRequiresWorker}/>
                      )}




                    </div>
                  );
                })}
              </div>
            )}

            <SyncActions results={results}
              locked={locked}
              selectedCount={selectedKeys.length}
              syncDisabled={syncDisabled}
              syncing={syncing}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              onSync={() => void handleSync()}/>
          </>
        </SyncBody>
      </CardContent>
    </Card>
  );
}

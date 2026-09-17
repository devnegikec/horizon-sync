import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { Badge, Button } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import type { PickList, PickListItem } from '../../types/pick-list.types';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from '../wms/QRDetailDialog';

import { PickListDetailFooter } from './PickListDetailFooter';
import { PickListStatusBadge } from './PickListStatusBadge';
import { RaiseExceptionDialog } from './RaiseExceptionDialog';

const EMPTY = '\u2014';
const EXCEPTION_SAVED_DESCRIPTION = 'The pick exception was recorded against the audit trail.';

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return EMPTY;
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Picked/ordered quantities come back as strings; render them at fixed precision. */
function fixedQty(value: string | number | null | undefined): string {
  return (Number(value) || 0).toFixed(3);
}

// ─── Pick list items → generic rows ───────────────────────────────────────────

/** Each field falls back to the legacy flat property the API also returns. */
function itemName(item: PickListItem): string {
  return item.item?.name ?? item.item_name ?? EMPTY;
}

function itemCode(item: PickListItem): string {
  return item.item?.code ?? item.item_code ?? EMPTY;
}

function warehouseName(item: PickListItem): string {
  return item.warehouse?.name ?? item.warehouse_name ?? EMPTY;
}

function warehouseCode(item: PickListItem): string {
  return item.warehouse?.code ?? item.warehouse_code ?? EMPTY;
}

/** A pick-list line maps to a single parent row (nothing to expand into). */
function itemToRow(item: PickListItem): QRDetailRow {
  return {
    id: item.id,
    name: itemName(item),
    sku: itemCode(item),
    batch: item.batch_no,
    quantity: Number(item.qty) || 0,
    meta: { item },
  };
}

// ─── Extra columns ────────────────────────────────────────────────────────────

function itemOf(row: QRDetailRow): PickListItem | undefined {
  return row.meta?.item as PickListItem | undefined;
}

function PickedCell({ row }: { row: QRDetailRow }) {
  const item = itemOf(row);
  if (!item) return null;
  return <span className="text-sm font-medium">{fixedQty(item.picked_qty)}</span>;
}

function WarehouseCell({ row }: { row: QRDetailRow }) {
  const item = itemOf(row);
  if (!item) return null;
  return (
    <div className="min-w-0">
      <p className="truncate text-sm">{warehouseName(item)}</p>
      <p className="truncate font-mono text-[11px] text-muted-foreground">{warehouseCode(item)}</p>
    </div>
  );
}

function UomCell({ row }: { row: QRDetailRow }) {
  const uom = itemOf(row)?.uom;
  if (!uom) return null;
  return <Badge variant="outline" className="text-xs">{uom}</Badge>;
}

function ActionsCell({ row, onReport }: { row: QRDetailRow; onReport: (item: PickListItem) => void }) {
  const item = itemOf(row);
  if (!item) return null;

  return (
    <Button type="button"
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={() => onReport(item)}
      title="Raise exception for this line">
      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
      Report
    </Button>
  );
}

// ─── Summary block ────────────────────────────────────────────────────────────

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function sumQty(items: PickListItem[], key: 'qty' | 'picked_qty'): number {
  return items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
}

/** `picked / ordered`, so a short pick is visible without scanning the table. */
function ProgressSummary({ items }: { items: PickListItem[] }) {
  const picked = sumQty(items, 'picked_qty');
  const ordered = sumQty(items, 'qty');
  const isShort = picked < ordered;

  return (
    <p className="text-sm">
      <span className={isShort ? 'font-medium text-amber-600' : 'font-medium text-green-600'}>{fixedQty(picked)}</span>
      <span className="text-muted-foreground"> / </span>
      <span className="text-muted-foreground">{fixedQty(ordered)}</span>
    </p>
  );
}

function ReferenceChip({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">{label}: {value}</span>;
}

function ReferenceChips({ pickList }: { pickList: PickList }) {
  const { reference, reference_type: referenceType } = pickList;
  if (!referenceType && !reference?.name && !reference?.code) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <ReferenceChip label="Type" value={referenceType} />
      <ReferenceChip label="Ref" value={reference?.name} />
      <ReferenceChip label="Ref Code" value={reference?.code} />
    </div>
  );
}

function PickListSummary({ pickList }: { pickList: PickList }) {
  const items = pickList.items ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3 text-sm">
        <SummaryCard label="Status">
          <PickListStatusBadge status={pickList.status} />
        </SummaryCard>
        <SummaryCard label="Warehouse">
          <p className="text-sm font-medium">{pickList.warehouse?.name ?? EMPTY}</p>
          {pickList.warehouse?.code && <p className="font-mono text-xs text-muted-foreground">{pickList.warehouse.code}</p>}
        </SummaryCard>
        <SummaryCard label="Pick Date">
          <p className="text-sm font-medium">{formatDateTime(pickList.pick_date)}</p>
        </SummaryCard>
        <SummaryCard label="Picked / Ordered">
          <ProgressSummary items={items} />
        </SummaryCard>
      </div>

      <ReferenceChips pickList={pickList} />

      {pickList.remarks && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Remarks: </span>
          {pickList.remarks}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Created: {formatDateTime(pickList.created_at)} &middot; Updated: {formatDateTime(pickList.updated_at)}
        {pickList.completed_at ? ` \u00b7 Completed: ${formatDateTime(pickList.completed_at)}` : ''}
      </p>
    </div>
  );
}

// ─── Pick list detail dialog ──────────────────────────────────────────────────

export interface PickListDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pick list being viewed. `null` closes the dialog. */
  pickList: PickList | null;
  onCreateDeliveryNote?: (pickList: PickList) => void;
}

export function PickListDetailDialog({ open, onOpenChange, pickList, onCreateDeliveryNote }: PickListDetailDialogProps) {
  const { toast } = useToast();
  const [raiseItem, setRaiseItem] = React.useState<PickListItem | null>(null);

  // Drop any open exception when the selected pick list changes, so a line from a
  // previous pick list is never submitted against the new pick list's id.
  React.useEffect(() => {
    setRaiseItem(null);
  }, [pickList?.id]);

  const rows = React.useMemo(() => (pickList?.items ?? []).map(itemToRow), [pickList]);

  const columns = React.useMemo<QRDetailColumn[]>(
    () => [
      { id: 'picked', header: 'Picked', align: 'right', cell: (row) => <PickedCell row={row} /> },
      { id: 'uom', header: 'UOM', cell: (row) => <UomCell row={row} /> },
      { id: 'warehouse', header: 'Warehouse', cell: (row) => <WarehouseCell row={row} /> },
      { id: 'actions', header: 'Actions', align: 'right', cell: (row) => <ActionsCell row={row} onReport={setRaiseItem} /> },
    ],
    [],
  );

  if (!pickList) return null;

  return (
    <>
      <QRDetailDialog open={open}
        onOpenChange={onOpenChange}
        title={`Pick List \u2014 ${pickList.pick_list_no}`}
        rows={rows}
        columns={columns}
        emptyMessage="No items in this pick list"
        summary={<PickListSummary pickList={pickList} />}
        footer={<PickListDetailFooter pickList={pickList} onClose={() => onOpenChange(false)} onCreateDeliveryNote={onCreateDeliveryNote} />}/>

      <RaiseExceptionDialog open={Boolean(raiseItem)}
        onOpenChange={(next) => {
          if (!next) setRaiseItem(null);
        }}
        item={raiseItem}
        onSaved={() => {
          toast({ title: 'Exception reported', description: EXCEPTION_SAVED_DESCRIPTION });
        }}/>
    </>
  );
}


import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type {
  BinStockGroup,
  BinStockGroupItem,
  BinStockParent,
  BinStockParentChild,
  BinStockParentsResponse,
  LocationTree,
} from '../../types/wms.types';
import { binStockApi } from '../../utility/api/wms';

import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from './QRDetailDialog';
import { ConditionBadge, FlagBadge } from './receiving-slips';
import { getGroupCondition, getGroupFlag } from './receiving-slips/groupAggregates';
import { WMSStatusBadge } from './WMSStatusBadge';

interface BinStockDialogProps {
  bin: LocationTree | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Bin stock → generic rows ─────────────────────────────────────────────────

function itemToChildRow(item: BinStockGroupItem, productName: string): QRDetailRow {
  return {
    id: item.id,
    name: item.name ?? productName,
    sku: item.sku,
    batch: item.batch_number,
    serialNumber: item.serial_number,
    manufacturingDate: item.manufacturing_date ?? null,
    expiryDate: item.expiry_date ?? null,
    quantity: item.quantity,
    meta: {
      flag: item.flag,
      conditionCode: item.condition_code ?? null,
      inventoryStatus: item.inventory_status,
    },
  };
}

/** Box identity, read once so the row mapping below stays flat. */
function boxInfo(group: BinStockGroup) {
  const parent = group.parent_qseal;
  return {
    id: parent?.id ?? null,
    serialNumber: parent?.serial_number ?? null,
    capacity: parent?.capacity ?? null,
  };
}

/** Box-level flag/condition are aggregated from the units stored in it. */
function groupToRow(group: BinStockGroup, index: number): QRDetailRow {
  const items = Array.isArray(group.items) ? group.items : [];
  const box = boxInfo(group);
  const first = items[0];

  return {
    id: box.id ?? `group-${index}`,
    name: group.product_name,
    sku: first?.sku ?? null,
    batch: first?.batch_number ?? null,
    serialNumber: box.serialNumber,
    quantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    meta: {
      flag: getGroupFlag(group),
      conditionCode: getGroupCondition(group),
      capacity: box.capacity,
    },
    children: items.map((item) => itemToChildRow(item, group.product_name)),
  };
}

// ─── Legacy flat response ─────────────────────────────────────────────────────

/** Pre-`groups` payload: a box carried its units directly and had no flag/condition. */
function legacyChildToRow(child: BinStockParentChild, parent: BinStockParent, index: number): QRDetailRow {
  return {
    id: child.serial_number || `${parent.parent_id}-${index}`,
    name: parent.parent_name,
    sku: child.sku ?? null,
    batch: child.batch_number,
    serialNumber: child.serial_number,
    manufacturingDate: child.manufacturing_date,
    expiryDate: child.expiry_date,
    quantity: Number(child.quantity_on_hand) || 0,
    meta: { inventoryStatus: child.inventory_status },
  };
}

function legacyToRow(parent: BinStockParent): QRDetailRow {
  return {
    id: parent.parent_id,
    name: parent.parent_name,
    sku: parent.sku ?? null,
    serialNumber: parent.parent_serial,
    quantity: Number(parent.quantity_on_hand) || 0,
    meta: { capacity: parent.capacity },
    children: (parent.children ?? []).map((child, index) => legacyChildToRow(child, parent, index)),
  };
}

/** Maps the grouped response into rows, falling back to the legacy flat shape. */
function binStockToRows(data: BinStockParentsResponse): QRDetailRow[] {
  if (Array.isArray(data.groups) && data.groups.length > 0) {
    return data.groups.map(groupToRow);
  }
  return (Array.isArray(data.parents) ? data.parents : []).map(legacyToRow);
}

/** Total units across every box in the bin. */
function countUnits(rows: QRDetailRow[]): number {
  return rows.reduce((sum, row) => sum + (row.quantity ?? 0), 0);
}

// ─── Extra columns ────────────────────────────────────────────────────────────

function FlagCell({ row }: { row: QRDetailRow }) {
  return <FlagBadge flag={(row.meta?.flag as string) ?? 'ok'} />;
}

function ConditionCell({ row }: { row: QRDetailRow }) {
  return <ConditionBadge code={(row.meta?.conditionCode as string | null) ?? null} />;
}

/** Box-level column: renders nothing on the serialised child rows. */
function CapacityCell({ row }: { row: QRDetailRow }) {
  const capacity = row.meta?.capacity as number | null | undefined;
  if (capacity === undefined || capacity === null) return null;
  return <span className="tabular-nums text-muted-foreground">{capacity}</span>;
}

/** Child-level column: renders nothing on the box rows. */
function StatusCell({ row }: { row: QRDetailRow }) {
  const status = row.meta?.inventoryStatus as string | undefined;
  if (!status) return null;
  return <WMSStatusBadge status={status} />;
}

// ─── Summary block ────────────────────────────────────────────────────────────

function BinStockSummary({ totalBoxes, totalUnits }: { totalBoxes: number; totalUnits: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Parent Boxes</p>
          <p className="text-lg font-semibold tabular-nums">{totalBoxes}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Total Units</p>
          <p className="text-lg font-semibold tabular-nums">{totalUnits}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Bin stock dialog ─────────────────────────────────────────────────────────

export function BinStockDialog({ bin, open, onOpenChange }: BinStockDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<BinStockParentsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !bin || !accessToken) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    binStockApi
      .getParents(accessToken, bin.id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load bin stock');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, bin, accessToken]);

  const rows = React.useMemo(() => (data ? binStockToRows(data) : []), [data]);

  const columns = React.useMemo<QRDetailColumn[]>(
    () => [
      { id: 'flag', header: 'Flag', cell: (row) => <FlagCell row={row} /> },
      { id: 'condition', header: 'Condition', cell: (row) => <ConditionCell row={row} /> },
      { id: 'status', header: 'Status', cell: (row) => <StatusCell row={row} /> },
      { id: 'capacity', header: 'Capacity', align: 'center', cell: (row) => <CapacityCell row={row} /> },
    ],
    [],
  );

  return (
    <QRDetailDialog open={open}
      onOpenChange={onOpenChange}
      title={bin ? `Bin Stock — ${bin.code}` : 'Bin Stock'}
      loading={loading}
      loadingMessage="Loading bin stock..."
      subtitle={bin ? (
        <p className="text-sm text-muted-foreground">
          Stock in <span className="font-mono font-medium text-foreground">{bin.code}</span>
          {bin.full_path ? ` · ${bin.full_path}` : ''}
        </p>
      ) : undefined}
      rows={rows}
      columns={columns}
      emptyMessage={error ?? 'No stock in this bin.'}
      summary={data && !error ? <BinStockSummary totalBoxes={data.total_parent_boxes ?? 0} totalUnits={countUnits(rows)} /> : undefined}/>
  );
}

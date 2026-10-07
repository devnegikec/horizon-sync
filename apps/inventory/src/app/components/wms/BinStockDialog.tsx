import * as React from 'react';

import { Loader2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';

import { BIN_STOCK_SHOW_PARENT_QR } from '../../constants/feature-flags';
import type {
  BinStockGroup,
  BinStockGroupItem,
  BinStockParent,
  BinStockParentChild,
  BinStockParentsResponse,
  LocationTree,
} from '../../types/wms.types';
import { featureFlagApi } from '../../utility/api/feature-flags';
import { binStockApi } from '../../utility/api/wms';

import { generateQRDataUrl } from './locationQrShared';
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
      qrCodeUrl: item.parent_qr_code_url ?? null,
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
    qrCodeUrl: parent?.qr_code_url ?? null,
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
      qrCodeUrl: box.qrCodeUrl,
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

/**
 * Generates the scannable parent-box QR for a row. The value is already a
 * public scan URL (`https://pollux.ciphercode.ai/qseal/{serial}`), so it is
 * encoded as-is. Memoised so a parent re-render never remounts the row and
 * regenerates the image. Clicking the thumbnail opens the enlarged view.
 */
const ParentQrCode = React.memo(function ParentQrCode({ value, onOpen }: { value: string; onOpen: (value: string) => void }) {
  const [img, setImg] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    setImg('');
    generateQRDataUrl(value, 64)
      .then((url) => {
        if (!cancelled) setImg(url);
      })
      .catch(() => {
        // Ignore image generation failures — the cell just stays empty.
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <button type="button"
      onClick={() => onOpen(value)}
      className="rounded border p-0.5 transition-shadow hover:ring-2 hover:ring-primary/40"
      title="View QR code"
      aria-label="View QR code">
      {img ? (
        <img src={img} alt="Parent QR" className="h-16 w-16 rounded" />
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      )}
    </button>
  );
});

/** Parent-box QR column: renders the box's QR on box and child rows alike. */
function ParentQrCell({ row, onOpen }: { row: QRDetailRow; onOpen: (value: string) => void }) {
  const value = row.meta?.qrCodeUrl as string | null | undefined;
  if (!value) return null;
  return <ParentQrCode value={value} onOpen={onOpen} />;
}

/** Large, scannable view of a parent-box QR, shown when a cell QR is clicked. */
function ParentQrDialog({ url, onClose }: { url: string | null; onClose: () => void }) {
  const [img, setImg] = React.useState<string>('');

  React.useEffect(() => {
    if (!url) {
      setImg('');
      return;
    }
    let cancelled = false;
    generateQRDataUrl(url, 220)
      .then((u) => {
        if (!cancelled) setImg(u);
      })
      .catch(() => {
        // Ignore image generation failures — the dialog just stays empty.
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const serial = url ? url.split('/').pop() : '';

  return (
    <Dialog open={url !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Parent QR Code</DialogTitle>
          {serial ? <DialogDescription className="font-mono">{serial}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {img ? (
            <img src={img} alt="Parent QR Code" width="220" height="220" className="rounded border" />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {url ? (
            <code className="max-w-full break-all text-center font-mono text-xs text-muted-foreground">{url}</code>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  const [showParentQr, setShowParentQr] = React.useState(false);
  const [enlargedQrUrl, setEnlargedQrUrl] = React.useState<string | null>(null);

  // Evaluate the Parent QR feature flag once per open. Deny by default so the
  // column only appears when the backend explicitly confirms it is enabled.
  React.useEffect(() => {
    if (!open || !accessToken) {
      setShowParentQr(false);
      return;
    }
    let cancelled = false;
    featureFlagApi
      .evaluate(accessToken, BIN_STOCK_SHOW_PARENT_QR)
      .then((res) => {
        if (!cancelled) setShowParentQr(res.enabled === true);
      })
      .catch(() => {
        if (!cancelled) setShowParentQr(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, accessToken]);

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
    () => {
      const base: QRDetailColumn[] = [
        { id: 'flag', header: 'Flag', cell: (row) => <FlagCell row={row} /> },
        { id: 'condition', header: 'Condition', cell: (row) => <ConditionCell row={row} /> },
        { id: 'status', header: 'Status', cell: (row) => <StatusCell row={row} /> },
        { id: 'capacity', header: 'Capacity', align: 'center', cell: (row) => <CapacityCell row={row} /> },
      ];
      if (showParentQr) {
        base.push({ id: 'parent-qr', header: 'Parent QR', align: 'center', cell: (row) => <ParentQrCell row={row} onOpen={setEnlargedQrUrl} /> });
      }
      return base;
    },
    [showParentQr],
  );

  return (
    <>
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
      <ParentQrDialog url={enlargedQrUrl} onClose={() => setEnlargedQrUrl(null)} />
    </>
  );
}

import * as React from 'react';

import type { OutboundOrder, OutboundOrderItem } from '../../../types/wms.types';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from '../QRDetailDialog';
import { WMSStatusBadge } from '../WMSStatusBadge';

const EMPTY = '\u2014';

// ─── Order items → generic rows ───────────────────────────────────────────────

/**
 * An order line maps to a single parent row: items carry no serialised children,
 * so there is nothing to expand into sub-rows.
 */
function itemToRow(item: OutboundOrderItem): QRDetailRow {
  return {
    id: item.id,
    name: item.item_name ?? item.sku ?? EMPTY,
    sku: item.sku,
    batch: item.batch_no,
    quantity: item.qty,
    meta: { item },
  };
}

// ─── Extra columns ────────────────────────────────────────────────────────────

function itemOf(row: QRDetailRow): OutboundOrderItem | undefined {
  return row.meta?.item as OutboundOrderItem | undefined;
}

function AvailableCell({ row }: { row: QRDetailRow }) {
  return <span className="text-sm text-muted-foreground">{itemOf(row)?.available_qty ?? EMPTY}</span>;
}

function StockStatusCell({ row }: { row: QRDetailRow }) {
  const status = itemOf(row)?.stock_status;
  if (!status) return null;
  return <WMSStatusBadge status={status} />;
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

/** `N in stock / M out`, red when any line is unavailable. */
function StockSummary({ order }: { order: OutboundOrder }) {
  const inStock = order.items.filter((item) => item.stock_status === 'in_stock').length;
  const outOfStock = order.items.length - inStock;

  return (
    <p className="text-sm">
      <span className="font-medium text-green-600">{inStock} in stock</span>
      <span className="text-muted-foreground"> / </span>
      <span className={outOfStock > 0 ? 'font-medium text-red-600' : 'text-muted-foreground'}>{outOfStock} out</span>
    </p>
  );
}

function OrderSummary({ order }: { order: OutboundOrder }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3 text-sm">
        <SummaryCard label="Type">
          <p className="font-medium uppercase">{order.order_type}</p>
        </SummaryCard>
        <SummaryCard label="Status">
          <WMSStatusBadge status={order.status} />
        </SummaryCard>
        <SummaryCard label="Invoice Ref">
          <p className="font-mono text-sm font-medium">{order.invoice_reference ?? EMPTY}</p>
        </SummaryCard>
        <SummaryCard label="Stock">
          <StockSummary order={order} />
        </SummaryCard>
      </div>

      {(order.reference_no || order.source_filename) && (
        <div className="flex flex-wrap gap-2">
          {order.reference_no && <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">Ref: {order.reference_no}</span>}
          {order.source_filename && <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">File: {order.source_filename}</span>}
        </div>
      )}

      {order.remarks && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Remarks: </span>
          {order.remarks}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Created: {order.created_at ? new Date(order.created_at).toLocaleString() : EMPTY}</p>
    </div>
  );
}

// ─── Order detail dialog ──────────────────────────────────────────────────────

export interface OrderDetailDialogProps {
  /** Order being viewed. `null` closes the dialog. */
  order: OutboundOrder | null;
  loading: boolean;
  /** Detail fetch failure, shown in place of the line items. */
  error?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ order, loading, error, open, onOpenChange }: OrderDetailDialogProps) {
  const rows = React.useMemo(() => (order?.items ?? []).map(itemToRow), [order]);

  const columns = React.useMemo<QRDetailColumn[]>(
    () => [
      { id: 'available', header: 'Available', align: 'right', cell: (row) => <AvailableCell row={row} /> },
      { id: 'stock', header: 'Stock', cell: (row) => <StockStatusCell row={row} /> },
    ],
    [],
  );

  return (
    <QRDetailDialog open={open}
      onOpenChange={onOpenChange}
      title={order ? `Order — ${order.order_no}` : 'Order'}
      // Only replace the body while nothing is loaded yet: `loading` is a
      // background `isFetching`, so Confirm/Pack would otherwise blank the rows.
      loading={loading && !order}
      loadingMessage="Loading order details..."
      rows={rows}
      columns={columns}
      emptyMessage={error ?? 'No items'}
      summary={order ? <OrderSummary order={order} /> : undefined}/>
  );
}

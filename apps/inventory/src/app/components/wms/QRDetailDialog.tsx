import * as React from 'react';

import type { ColumnDef, Row } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button, DetailDialog } from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';

import { formatDate } from '../../utility';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * Normalised row used by {@link QRDetailDialog}. A row may carry `children`,
 * which render as indented, collapsible sub-rows.
 *
 * This shape intentionally matches the common "detail" payload returned by the
 * receiving-slip, put-away, pick-list and QR-bin APIs so callers only need to
 * map their response into these fields.
 */
export interface QRDetailRow {
  id: string;
  /** Product name (first line of the "Product Name/S.N." cell; truncated at 50 chars). */
  name: string;
  /** SKU — rendered in its own column. */
  sku?: string | null;
  /** Batch/lot number — rendered in its own column. */
  batch?: string | null;
  /** Serial number: under the product name (parent) or the first line (child). */
  serialNumber?: string | null;
  /** Rendered as `Mfg: …` in a child row's first cell. */
  manufacturingDate?: string | null;
  /** Rendered as `Exp: …` in a child row's first cell. */
  expiryDate?: string | null;
  quantity?: number | null;
  /** Child rows (e.g. serialised units under a parent box/item). */
  children?: QRDetailRow[];
  /** Arbitrary values consumed by caller-defined `columns`. */
  meta?: Record<string, unknown>;
}

/** A configurable column rendered after the fixed columns. */
export interface QRDetailColumn {
  id: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Renders the cell for a parent or child row. */
  cell: (row: QRDetailRow) => React.ReactNode;
}

export interface QRDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  /** Optional summary block (cards, badges) rendered above the table. */
  summary?: React.ReactNode;
  /** Parent rows; each may carry `children`. */
  rows: QRDetailRow[];
  /** Extra columns shown after the fixed columns, on both parent and child rows. */
  columns?: QRDetailColumn[];
  /** Parent rows per page. Omit or pass 0 to disable pagination. */
  pageSize?: number;
  /** Start with all parent rows expanded. Defaults to false. */
  defaultExpanded?: boolean;
  emptyMessage?: string;
  contentClassName?: string;
  footer?: React.ReactNode;
}

// ─── Fixed columns ────────────────────────────────────────────────────────────

const EMPTY = '\u2014';
const NAME_MAX_LENGTH = 50;

const ALIGN_CLASS: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/** Truncates long product names so the first column stays readable. */
function truncateName(name: string): string {
  if (name.length <= NAME_MAX_LENGTH) return name;
  return `${name.slice(0, NAME_MAX_LENGTH).trimEnd()}\u2026`;
}

/** `Mfg: <date> · Exp: <date>` for a child row, or '' when neither is set. */
function mfgExpLabel(row: QRDetailRow): string {
  const parts: string[] = [];
  if (row.manufacturingDate) parts.push(`Mfg: ${formatDate(row.manufacturingDate, 'DD-MMM-YY')}`);
  if (row.expiryDate) parts.push(`Exp: ${formatDate(row.expiryDate, 'DD-MMM-YY')}`);
  return parts.join(' \u00b7 ');
}

/** Parent row: product name (truncated) with its serial number underneath. */
function ProductCell({ row }: { row: QRDetailRow }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium" title={row.name}>{truncateName(row.name)}</p>
      {row.serialNumber ? <p className="truncate font-mono text-xs text-muted-foreground">{row.serialNumber}</p> : null}
    </div>
  );
}

/** Child row: its serial number with the manufacturing/expiry details underneath. */
function ChildProductCell({ row }: { row: QRDetailRow }) {
  const dates = mfgExpLabel(row);
  return (
    <div className="min-w-0 leading-tight">
      <p className="truncate font-mono text-[11px]">{row.serialNumber || EMPTY}</p>
      {dates ? <p className="truncate text-[11px] text-muted-foreground">{dates}</p> : null}
    </div>
  );
}

function SkuCell({ value }: { value?: string | null }) {
  return <span className="font-mono text-[11px]">{value || EMPTY}</span>;
}

function TextCell({ value }: { value?: string | null }) {
  return <span className="text-xs">{value || EMPTY}</span>;
}

function QuantityCell({ value }: { value?: number | null }) {
  return <div className="text-right text-sm font-medium">{value ?? EMPTY}</div>;
}

/**
 * Builds the column set: Product Name/S.N., SKU, Batch and Quantity, followed
 * by the caller-defined columns.
 *
 * Parent rows render the product name with its serial underneath; child rows
 * render their serial plus the manufacturing/expiry dates in the same cell.
 */
function buildColumns(extra: QRDetailColumn[]): ColumnDef<QRDetailRow>[] {
  const fixed: ColumnDef<QRDetailRow>[] = [
    {
      id: 'product',
      header: 'Product Name/S.N.',
      cell: ({ row }) => (row.depth > 0 ? <ChildProductCell row={row.original} /> : <ProductCell row={row.original} />),
    },
    {
      id: 'sku',
      header: 'SKU',
      // Children share the parent's SKU, so it is only shown on parent rows.
      cell: ({ row }) => (row.depth > 0 ? null : <SkuCell value={row.original.sku} />),
    },
    {
      id: 'batch',
      header: 'Batch',
      cell: ({ row }) => <TextCell value={row.original.batch} />,
    },
    {
      id: 'quantity',
      header: () => <div className="text-right">Quantity</div>,
      cell: ({ row }) => <QuantityCell value={row.original.quantity} />,
    },
  ];

  const extraColumns: ColumnDef<QRDetailRow>[] = extra.map((col) => {
    const align = ALIGN_CLASS[col.align ?? 'left'];
    return {
      id: col.id,
      header: () => <div className={align}>{col.header}</div>,
      cell: ({ row }: { row: Row<QRDetailRow> }) => <div className={align}>{col.cell(row.original)}</div>,
    };
  });

  return [...fixed, ...extraColumns];
}

// ─── Pager ────────────────────────────────────────────────────────────────────

function QRDetailPager({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

/**
 * Generic detail dialog for receiving slips, put-away lists, pick lists and QR
 * bin details. Renders a summary block plus a configurable table whose parent
 * rows can expand into serialised child rows.
 */
export function QRDetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  loading = false,
  loadingMessage,
  summary,
  rows,
  columns: extraColumns,
  pageSize = 0,
  defaultExpanded = false,
  emptyMessage = 'No records found',
  contentClassName = 'max-w-5xl max-h-[90vh] flex flex-col',
  footer,
}: QRDetailDialogProps) {
  const [page, setPage] = React.useState(1);

  // Return to the first page whenever the dialog opens or its data changes.
  React.useEffect(() => {
    setPage(1);
  }, [open, rows, pageSize]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);

  const pageRows = React.useMemo(
    () => (pageSize > 0 ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : rows),
    [rows, currentPage, pageSize],
  );

  const columns = React.useMemo(() => buildColumns(extraColumns ?? []), [extraColumns]);

  const getSubRows = React.useCallback((row: QRDetailRow) => row.children, []);

  return (
    <DetailDialog open={open}
      onOpenChange={onOpenChange}
      title={title}
      loading={loading}
      loadingMessage={loadingMessage}
      contentClassName={contentClassName}
      footer={footer}>
      <div className="flex flex-col gap-4">
        {subtitle}
        {summary}
        {pageRows.length === 0 ? (
          <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <>
            {/* Halve the default column gutter (px-4 -> px-2) for this detail table. */}
            <div className="[&_th]:px-2 [&_td]:px-2">
              {/* Remount per page so expansion state resets cleanly on page change. */}
              <DataTable key={currentPage}
                columns={columns}
                data={pageRows}
                getSubRows={getSubRows}
                defaultExpanded={defaultExpanded}
                config={{
                  showSerialNumber: false,
                  showPagination: false,
                  enableRowSelection: false,
                  enableColumnVisibility: false,
                  enableSorting: false,
                  enableFiltering: false,
                }} />
            </div>
            {totalPages > 1 && <QRDetailPager page={currentPage} totalPages={totalPages} onPageChange={setPage} />}
          </>
        )}
      </div>
    </DetailDialog>
  );
}

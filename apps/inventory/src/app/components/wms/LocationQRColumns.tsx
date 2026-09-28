/**
 * Columns for the Location QR table.
 *
 * The QR image is the reason this table exists, so it gets its own column rather than a
 * dialog: an operator printing shelf labels wants to see the code that is about to be
 * stuck on the racking.
 */
import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Loader2, Printer } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { WarehouseLocation } from '../../types/wms.types';

import { buildQrPayload, generateQRDataUrl, qrShortCode } from './locationQrShared';

// ── QR image that only renders once the row is near the viewport ──
// Generating a QR PNG is CPU-heavy. Eagerly generating one for every bin in
// the table floods the main thread (and shows up as hundreds of
// `data:image/png;base64` entries in the Network tab), which hangs the UI.
// IntersectionObserver defers generation to the rows actually on screen.
// Declared at module scope (and memoized) so a parent re-render never changes
// its identity and remounts the row, restarting observers and QR generation.
const LazyQrCode = React.memo(function LazyQrCode({ value, size }: { value: string; size: number }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);
  const [img, setImg] = React.useState<string>('');

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    generateQRDataUrl(value, size)
      .then((url) => {
        if (!cancelled) setImg(url);
      })
      .catch(() => { /* ignore image generation failures */ });
    return () => {
      cancelled = true;
    };
  }, [inView, value, size]);

  return (
    <div ref={ref} className="inline-flex items-center justify-center w-[80px] h-[80px]">
      {img ? (
        <img src={img} alt="QR" className="w-[80px] h-[80px] rounded border" />
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      )}
    </div>
  );
});

function PathCell({ loc }: { loc: WarehouseLocation }) {
  return <span className="font-mono text-xs">{loc.full_path || loc.code}</span>;
}

function ShortCodeCell({ loc }: { loc: WarehouseLocation }) {
  return <span className="font-mono text-sm font-bold text-blue-600 tracking-wider">{qrShortCode(loc)}</span>;
}

function CapacityCell({ loc }: { loc: WarehouseLocation }) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {loc.available_capacity}/{loc.total_capacity} {loc.capacity_uom || 'units'}
    </span>
  );
}

function QrCell({ loc }: { loc: WarehouseLocation }) {
  // The image encodes the resolvable JSON payload; the caption is the readable code.
  const payload = React.useMemo(() => buildQrPayload(loc), [loc]);

  return (
    <div className="flex flex-col items-center gap-1">
      <LazyQrCode value={payload} size={120} />
      <span className="font-mono text-[10px] text-muted-foreground">{loc.code}</span>
    </div>
  );
}

export interface LocationQrColumnsOptions {
  /** A print run is in flight; every print action is disabled until it finishes. */
  printing: boolean;
  onPrint: (loc: WarehouseLocation) => void;
}

export function createLocationQRColumns({ printing, onPrint }: LocationQrColumnsOptions): ColumnDef<WarehouseLocation>[] {
  return [
    {
      accessorKey: 'full_path',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Path" />,
      cell: ({ row }) => <PathCell loc={row.original} />,
    },
    {
      accessorKey: 'qr_code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bin Code" />,
      cell: ({ row }) => <ShortCodeCell loc={row.original} />,
    },
    {
      accessorKey: 'total_capacity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Capacity" />,
      cell: ({ row }) => <CapacityCell loc={row.original} />,
    },
    {
      id: 'qr',
      header: () => <div className="text-center">QR Code</div>,
      cell: ({ row }) => <QrCell loc={row.original} />,
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Print</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost"
            size="sm"
            disabled={printing}
            aria-label={`Print QR label for ${row.original.full_path || row.original.code}`}
            onClick={() => onPrint(row.original)}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];
}

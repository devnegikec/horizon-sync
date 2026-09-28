import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Loader2, Printer, QrCode, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableSkeleton,
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { useToast } from '@horizon-sync/ui/hooks';

import type { PaginatedLocations, WarehouseLocation, WMSPagination } from '../../types/wms.types';
import { layoutApi } from '../../utility/api/wms';

import { createLocationQRColumns } from './LocationQRColumns';
import { buildQrPayload, generateQRDataUrl, qrShortCode } from './locationQrShared';

interface LocationQRPanelProps {
  warehouseId?: string;
}

/** The largest page the table's own size selector offers. */
const PAGE_SIZE = 50;

/** Radix rejects an empty string as an item value, so "no filter" needs a sentinel. */
const ALL_FILTERS = 'all';

const STOCK_FILTERS = [
  { value: ALL_FILTERS, label: 'All bins' },
  { value: 'with', label: 'With stock' },
  { value: 'without', label: 'Without stock' },
] as const;

const ACTIVE_FILTERS = [
  { value: ALL_FILTERS, label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

interface LocationPage {
  locations: WarehouseLocation[];
  pagination: WMSPagination | null;
  page: number;
}

/** Keeps the response mapping out of the loader so the effect stays readable. */
function readLocationPage(res: PaginatedLocations, fallbackPage: number): LocationPage {
  return {
    locations: res.locations ?? [],
    pagination: res.pagination ?? null,
    page: res.pagination?.page ?? fallbackPage,
  };
}

/**
 * One label per sheet, each centred and sized for a shelf sticker.
 *
 * The page break goes on every label but the last, so printing a single location does
 * not append a blank sheet.
 */
function printableLabels(locations: WarehouseLocation[], dataUrls: string[]): string {
  const pages = locations.map((loc, index) => {
    const breakStyle = index < locations.length - 1 ? 'page-break-after:always;' : '';
    const label = loc.full_path || loc.code;
    return `<div style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;${breakStyle}">
          <div style="text-align:center;border:1px dashed #ccc;padding:24px;max-width:280px;">
            <div style="font-size:18px;font-weight:700;margin-bottom:2px;">${label}</div>
            <div style="font-size:22px;font-weight:700;color:#1A73E8;margin-bottom:4px;font-family:monospace;">${qrShortCode(loc)}</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px;">Bin Location</div>
            <div style="margin:8px 0;"><img src="${dataUrls[index]}" alt="QR" width="200" height="200" style="max-width:100%;height:auto;" /></div>
            <div style="font-size:9px;color:#999;margin-top:4px;">Scan for put-away / picking</div>
          </div>
        </div>`;
  });

  return `
        <html><head><title>Bin Location QR Codes</title><style>
          @media print { body { margin: 0; } }
        </style></head><body>${pages.join('')}</body></html>
      `;
}

/**
 * Print a standalone HTML document using a hidden iframe.
 *
 * Using `window.open()` + `document.write()` + `print()` is fragile: popup
 * blockers can return null, and calling `print()` on a fixed 250ms timer can
 * race the document load, which freezes the tab while Chrome builds the print
 * preview. The iframe avoids popup blockers and waits for the document (and
 * embedded images) to be ready before invoking print.
 */
function printHTML(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      // Let the print dialog take over before removing the document.
      setTimeout(() => {
        iframe.remove();
        resolve();
      }, 500);
    };

    const contentWindow = iframe.contentWindow;
    const contentDocument = iframe.contentDocument;
    if (!contentWindow || !contentDocument) {
      iframe.remove();
      resolve();
      return;
    }

    contentDocument.open();
    contentDocument.write(html);
    contentDocument.close();

    const doPrint = () => {
      try {
        contentWindow.focus();
        contentWindow.print();
      } catch {
        // ignore — cleanup still runs
      }
      cleanup();
    };

    if (contentDocument.readyState === 'complete') {
      // Give the browser a tick to paint embedded images before printing.
      setTimeout(doPrint, 50);
    } else {
      let fired = false;
      const trigger = () => {
        if (fired) return;
        fired = true;
        setTimeout(doPrint, 50);
      };
      contentWindow.addEventListener('load', trigger);
      // Fallback in case `load` never fires.
      setTimeout(trigger, 800);
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Filters, empty state, bulk bar and table                           */
/* ------------------------------------------------------------------ */

function LocationQrFilters({ stock, active, search, loading, filtered, onStockChange, onActiveChange, onSearchChange, onClear }: {
  stock: string;
  active: string;
  search: string;
  loading: boolean;
  filtered: boolean;
  onStockChange: (value: string) => void;
  onActiveChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="h-8 w-56"
        aria-label="Filter the loaded bin locations"
        placeholder="Filter loaded bins…"
        title="The locations endpoint has no search parameter, so this narrows the rows already loaded"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}/>
      <Select value={stock} onValueChange={onStockChange} disabled={loading}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="All bins" />
        </SelectTrigger>
        <SelectContent>
          {STOCK_FILTERS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={active} onValueChange={onActiveChange} disabled={loading}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Active" />
        </SelectTrigger>
        <SelectContent>
          {ACTIVE_FILTERS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filtered && (
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}

/** Takes the toolbar over while rows are selected, so printing is the only decision left. */
function LocationQrBulkActions({ rows, printing, onPrint, onClear }: {
  rows: WarehouseLocation[];
  printing: boolean;
  onPrint: (rows: WarehouseLocation[]) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">{rows.length} selected</span>
      <Button size="sm" disabled={printing} onClick={() => onPrint(rows)}>
        {printing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Printer className="mr-1 h-4 w-4" />}
        Print labels
      </Button>
      <Button size="sm" variant="ghost" disabled={printing} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

function LocationQrEmpty({ filtered, onClearFilters }: { filtered: boolean; onClearFilters: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<QrCode className="h-12 w-12" />}
            title="No bin locations found"
            description={
              filtered
                ? 'No bins match the selected filters'
                : 'This warehouse has no bin locations to label yet'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationQrTable({ isInitialLoading, rows, columns, serverPagination, pageSize, filtered, onClearFilters, renderFilters, renderBulkActions, onTableReady }: {
  isInitialLoading: boolean;
  rows: WarehouseLocation[];
  columns: ColumnDef<WarehouseLocation>[];
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilters: () => void;
  renderFilters: () => React.ReactNode;
  renderBulkActions: (rows: WarehouseLocation[]) => React.ReactNode;
  onTableReady: (table: Table<WarehouseLocation>) => void;
}) {
  if (isInitialLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={6} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) return <LocationQrEmpty filtered={filtered} onClearFilters={onClearFilters} />;

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
          data={rows}
          config={{
            showSerialNumber: true,
            showPagination: true,
            enableRowSelection: true,
            enableColumnVisibility: true,
            enableSorting: false,
            // Off: the search box below filters the loaded rows itself, because the
            // endpoint has no query parameter to send.
            enableFiltering: false,
            initialPageSize: pageSize,
            serverPagination,
          }}
          renderFilters={renderFilters}
          renderBulkActions={renderBulkActions}
          onTableReady={onTableReady}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}

export function LocationQRPanel({ warehouseId }: LocationQRPanelProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [locations, setLocations] = React.useState<WarehouseLocation[]>([]);
  const [pagination, setPagination] = React.useState<WMSPagination | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);
  const [stockFilter, setStockFilter] = React.useState<string>(ALL_FILTERS);
  const [activeFilter, setActiveFilter] = React.useState<string>('active');
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [printing, setPrinting] = React.useState(false);

  const requestSeqRef = React.useRef(0);
  const tableRef = React.useRef<Table<WarehouseLocation> | null>(null);

  const load = React.useCallback(
    async (targetPage: number) => {
      if (!accessToken || !warehouseId) return;
      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      setLoading(true);
      setError(null);
      try {
        const res = await layoutApi.listLocations(accessToken, {
          warehouse_id: warehouseId,
          location_type: 'bin',
          // `undefined` leaves the parameter off the query, which is what "any" means.
          is_active: activeFilter === ALL_FILTERS ? undefined : activeFilter === 'active',
          has_stock: stockFilter === ALL_FILTERS ? undefined : stockFilter === 'with',
          page: targetPage,
          page_size: pageSize,
        });
        if (seq !== requestSeqRef.current) return;
        const next = readLocationPage(res, targetPage);
        setLocations(next.locations);
        setPagination(next.pagination);
        setPage(next.page);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load bin locations');
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    },
    [accessToken, warehouseId, activeFilter, stockFilter, pageSize],
  );

  // Every filter (or page size) change restarts from the first page.
  React.useEffect(() => {
    void load(1);
  }, [load]);

  // The panel Refresh button re-requests the current page.
  const refresh = React.useCallback(() => {
    void load(page);
  }, [load, page]);

  /**
   * Narrowing the rows is client-side: `GET /warehouse-locations` takes no query
   * parameter, so there is nothing to send the server. It filters the loaded page.
   */
  const visibleLocations = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return locations;
    return locations.filter(
      (loc) =>
        loc.code?.toLowerCase().includes(query) ||
        loc.full_path?.toLowerCase().includes(query) ||
        loc.name?.toLowerCase().includes(query),
    );
  }, [locations, search]);

  // A new set of rows replaces the selection: keys for rows that are gone are dropped by
  // the table, so a stale count would print nothing.
  React.useEffect(() => {
    tableRef.current?.resetRowSelection();
  }, [visibleLocations]);

  const handleTableReady = React.useCallback((table: Table<WarehouseLocation>) => {
    tableRef.current = table;
  }, []);

  const printLocations = React.useCallback(
    async (targets: WarehouseLocation[]) => {
      if (targets.length === 0) {
        toast({ title: 'No locations selected', description: 'Select at least one bin location to print.' });
        return;
      }
      setPrinting(true);
      try {
        const dataUrls = await Promise.all(targets.map((loc) => generateQRDataUrl(buildQrPayload(loc))));
        await printHTML(printableLabels(targets, dataUrls));
        toast({ title: 'Print Ready', description: `${targets.length} QR code(s) sent to printer.` });
      } catch {
        toast({ title: 'Error', description: 'Failed to generate QR codes', variant: 'destructive' });
      } finally {
        setPrinting(false);
      }
    },
    [toast],
  );

  const columns = React.useMemo(
    () => createLocationQRColumns({ printing, onPrint: (loc) => void printLocations([loc]) }),
    [printing, printLocations],
  );

  const serverPagination = React.useMemo<ServerPagination | undefined>(() => {
    if (!pagination) return undefined;

    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (nextPage: number, nextPageSize: number) => {
        setPage(nextPage);
        if (nextPageSize !== pagination.page_size) {
          setPageSize(nextPageSize);
          return;
        }
        void load(nextPage);
      },
    };
  }, [pagination, load]);

  const filtered = stockFilter !== ALL_FILTERS || activeFilter !== ALL_FILTERS || search.trim() !== '';

  const clearFilters = React.useCallback(() => {
    setStockFilter(ALL_FILTERS);
    setActiveFilter(ALL_FILTERS);
    setSearch('');
  }, []);

  const renderFilters = React.useCallback(
    () => (
      <LocationQrFilters stock={stockFilter}
        active={activeFilter}
        search={search}
        loading={loading}
        filtered={filtered}
        onStockChange={setStockFilter}
        onActiveChange={setActiveFilter}
        onSearchChange={setSearch}
        onClear={clearFilters}/>
    ),
    [stockFilter, activeFilter, search, loading, filtered, clearFilters],
  );

  const renderBulkActions = React.useCallback(
    (rows: WarehouseLocation[]) => (
      <LocationQrBulkActions rows={rows}
        printing={printing}
        onPrint={printLocations}
        onClear={() => tableRef.current?.resetRowSelection()}/>
    ),
    [printing, printLocations],
  );

  if (!warehouseId) {
    return <p className="text-sm text-muted-foreground text-center py-8">Select a warehouse to view bin locations.</p>;
  }

  const totalLabel = pagination
    ? `${pagination.total_items} bin location${pagination.total_items === 1 ? '' : 's'}`
    : 'Bin locations';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{totalLabel}</p>
        <Button variant="outline" size="sm" disabled={loading} onClick={refresh}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <LocationQrTable isInitialLoading={loading && locations.length === 0}
        rows={visibleLocations}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={filtered}
        onClearFilters={clearFilters}
        renderFilters={renderFilters}
        renderBulkActions={renderBulkActions}
        onTableReady={handleTableReady}/>
    </div>
  );
}

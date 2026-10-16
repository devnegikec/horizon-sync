import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { PackageX, RefreshCw, TriangleAlert } from 'lucide-react';

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

import { useRefreshOnKey } from '../../../hooks/useRefreshOnKey';
import type {
  BalanceStatus,
  CloseOutcome,
  PaginatedShortBalances,
  ShortBalance,
  ShortBalanceSummary,
  WMSPagination,
} from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';
import { inboundApi } from '../../../utility/api/wms';
import { hasPermission } from '../../../utils/permissions';

import { CloseShortageDialog } from './CloseShortageDialog';
import { createShortageColumns } from './ShortageColumns';
import { ShortageHistoryDialog } from './ShortageHistoryDialog';

const PAGE_SIZE = 20;

/** Radix rejects an empty string as an item value, so "no filter" needs a sentinel. */
const ALL_STATUSES = 'all';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: ALL_STATUSES, label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'written_off', label: 'Written off' },
];

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

interface LedgerPage {
  balances: ShortBalance[];
  pagination: WMSPagination | null;
  summary: ShortBalanceSummary | null;
  page: number;
}

function readPage(res: PaginatedShortBalances, fallbackPage: number): LedgerPage {
  return {
    balances: res.balances ?? [],
    pagination: res.pagination ?? null,
    summary: res.summary ?? null,
    page: res.pagination?.page ?? fallbackPage,
  };
}

/* ------------------------------------------------------------------ */
/*  Presentation                                                       */
/* ------------------------------------------------------------------ */

function ShortageFilters({
  statusFilter,
  onStatusFilterChange,
  skuDraft,
  onSkuDraftChange,
  onApplySku,
  onClearFilters,
  filterActive,
}: {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  skuDraft: string;
  onSkuDraftChange: (sku: string) => void;
  onApplySku: (event: React.FormEvent) => void;
  onClearFilters: () => void;
  filterActive: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <form className="flex items-center gap-2" onSubmit={onApplySku}>
        <Input className="w-56"
          aria-label="Filter by SKU"
          value={skuDraft}
          onChange={(event) => onSkuDraftChange(event.target.value)}
          placeholder="Exact SKU, e.g. PTK-DUK-M009"/>
        <Button type="submit" size="sm" variant="secondary">
          Apply
        </Button>
      </form>
      {filterActive && (
        <Button type="button" size="sm" variant="ghost" onClick={onClearFilters}>
          Clear
        </Button>
      )}
    </div>
  );
}

function LedgerError({ error, onRetry }: { error: NormalizedApiError; onRetry: () => void }) {
  const retryable = error.httpStatus === 0 || error.httpStatus >= 500;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p>{error.message}</p>
        {error.hint && <p className="mt-0.5 text-xs text-muted-foreground">{error.hint}</p>}
        {retryable && (
          <Button size="sm" variant="outline" className="mt-2 h-7 px-2 text-xs" onClick={onRetry}>
            <RefreshCw className="mr-1 h-3 w-3" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}

function ShortageEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageX className="h-12 w-12" />}
            title="No shortages found"
            description={
              filtered
                ? 'No shortages match the selected filters'
                : 'No shortages recorded — every ASN line has been received in full'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Clear filters
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

function ShortageTable({
  isInitialLoading,
  error,
  balances,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onRetry,
  onClearFilter,
}: {
  isInitialLoading: boolean;
  error: NormalizedApiError | null;
  balances: ShortBalance[];
  columns: ColumnDef<ShortBalance>[];
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onRetry: () => void;
  onClearFilter: () => void;
}) {
  if (error && balances.length === 0) return <LedgerError error={error} onRetry={onRetry} />;

  if (isInitialLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={9} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (balances.length === 0) return <ShortageEmpty filtered={filtered} onClearFilter={onClearFilter} />;

  return (
    <div className="space-y-4">
      {error && <LedgerError error={error} onRetry={onRetry} />}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={balances}
            config={{
              showSerialNumber: true,
              showPagination: true,
              enableRowSelection: false,
              enableColumnVisibility: true,
              enableSorting: false,
              enableFiltering: false,
              initialPageSize: pageSize,
              serverPagination,
            }}
            fixedHeader
            maxHeight="auto"/>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ledger                                                             */
/* ------------------------------------------------------------------ */

interface ShortageLedgerProps {
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
  /** Pre-applied SKU filter, used when arriving from the hold/quarantine queue's "Short-close" action. */
  initialSku?: string;
  /** Controlled status filter (e.g. driven by the inbound stat cards). */
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  /**
   * Publishes the server summary so the stat cards above the tab bar can reuse
   * it instead of issuing a second request to the same endpoint.
   */
  onSummaryChange?: (summary: ShortBalanceSummary | null) => void;
}

/**
 * The shortage worklist (`GET /short-balances`). A short receipt creates no
 * hold/quarantine exception — nothing needs disposing of — so residuals are
 * tracked here instead and closed with a manager-approved write-off.
 */
export function ShortageLedger({
  refreshKey,
  initialSku,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
  onSummaryChange,
}: ShortageLedgerProps) {
  const token = useUserStore((state) => state.accessToken);
  const permissions = useUserStore((state) => state.permissions.permissions);
  const { toast } = useToast();
  const canClose = hasPermission(permissions, 'inbound_exception.dispose');

  const [internalStatusFilter, setInternalStatusFilter] = React.useState(ALL_STATUSES);
  const statusFilter = statusFilterProp ?? internalStatusFilter;
  const setStatusFilter = onStatusFilterChange ?? setInternalStatusFilter;

  const [balances, setBalances] = React.useState<ShortBalance[]>([]);
  const [pagination, setPagination] = React.useState<WMSPagination | null>(null);
  const [summary, setSummary] = React.useState<ShortBalanceSummary | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);
  const [skuDraft, setSkuDraft] = React.useState(initialSku ?? '');
  const [sku, setSku] = React.useState(initialSku ?? '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);
  const [historyBalance, setHistoryBalance] = React.useState<ShortBalance | null>(null);
  const [closeBalance, setCloseBalance] = React.useState<ShortBalance | null>(null);

  const requestSeqRef = React.useRef(0);

  const load = React.useCallback(
    async (targetPage: number) => {
      if (!token) return;
      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      setLoading(true);
      setError(null);
      try {
        const res = await inboundApi.listShortBalances(token, {
          status: statusFilter === ALL_STATUSES ? undefined : (statusFilter as BalanceStatus),
          sku: sku || undefined,
          page: targetPage,
          page_size: pageSize,
        });
        if (seq !== requestSeqRef.current) return;
        const next = readPage(res, targetPage);
        setBalances(next.balances);
        setPagination(next.pagination);
        setSummary(next.summary);
        setPage(next.page);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setError(toNormalizedApiError(err));
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    },
    [token, statusFilter, sku, pageSize],
  );

  // Every filter (or page size) change restarts from the first page.
  React.useEffect(() => {
    void load(1);
  }, [load]);

  // The panel Refresh button (above the stat cards) re-requests the current page.
  const refresh = React.useCallback(() => {
    void load(page);
  }, [load, page]);

  useRefreshOnKey(refreshKey, refresh);

  // Share the server totals with the stat cards above the tab bar.
  React.useEffect(() => {
    onSummaryChange?.(summary);
  }, [summary, onSummaryChange]);

  const serverPagination = React.useMemo<ServerPagination | undefined>(() => {
    if (!pagination) return undefined;

    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (nextPage: number, nextPageSize: number) => {
        // A page-size change is handled by the `load` effect via its dependency list.
        if (nextPageSize !== pagination.page_size) {
          setPageSize(nextPageSize);
          setPage(1);
          return;
        }
        void load(nextPage);
      },
    };
  }, [pagination, load]);

  const columns = React.useMemo(
    () => createShortageColumns({ canClose, onHistory: setHistoryBalance, onClose: setCloseBalance }),
    [canClose],
  );

  const applySkuFilter = (event: React.FormEvent) => {
    event.preventDefault();
    setSku(skuDraft.trim());
  };

  const clearFilters = () => {
    setStatusFilter(ALL_STATUSES);
    setSku('');
    setSkuDraft('');
  };

  const handleClosed = async (updated: ShortBalance, outcome: CloseOutcome) => {
    setCloseBalance(null);
    toast({
      title: outcome === 'written_off' ? 'Shortage written off' : 'Shortage closed',
      description:
        outcome === 'written_off'
          ? `${updated.sku} — ${updated.short_qty} unit(s) accepted as a loss.`
          : `${updated.sku} resolved by a later receipt.`,
    });
    await load(page);
  };

  const filterActive = statusFilter !== ALL_STATUSES || sku !== '';
  const isInitialLoading = loading && balances.length === 0;

  return (
    <div className="space-y-4">
      <ShortageFilters statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        skuDraft={skuDraft}
        onSkuDraftChange={setSkuDraft}
        onApplySku={applySkuFilter}
        onClearFilters={clearFilters}
        filterActive={filterActive} />

      <ShortageTable isInitialLoading={isInitialLoading}
        error={error}
        balances={balances}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={filterActive}
        onRetry={() => void load(page)}
        onClearFilter={clearFilters} />

      <ShortageHistoryDialog balance={historyBalance} onOpenChange={(open) => !open && setHistoryBalance(null)} />
      <CloseShortageDialog balance={closeBalance}
        onOpenChange={(open) => !open && setCloseBalance(null)}
        onClosed={handleClosed}
        onStale={() => void load(page)} />
    </div>
  );
}

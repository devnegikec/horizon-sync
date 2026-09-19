import * as React from 'react';

import { ChevronDown, ChevronLeft, ChevronRight, PackageX, RefreshCw, TriangleAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Input, Label } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

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
import { ShortageHistoryDialog } from './ShortageHistoryDialog';
import { EMPTY, shortId, StatusPill } from './shortageShared';

const PAGE_SIZE = 20;
const COLUMN_COUNT = 8;

const STATUS_FILTERS: { value: BalanceStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'written_off', label: 'Written off' },
];

interface AsnGroup {
  asnOrderId: string;
  balances: ShortBalance[];
}

/**
 * Balances arrive flat and paginated, so an ASN with more lines than one page
 * holds appears in several groups. Everything derived from a group is therefore
 * labelled "on this page" — the only trustworthy totals are the server's.
 */
function groupByAsn(balances: ShortBalance[]): AsnGroup[] {
  const buckets = new Map<string, ShortBalance[]>();
  balances.forEach((balance) => {
    const bucket = buckets.get(balance.asn_order_id);
    if (bucket) bucket.push(balance);
    else buckets.set(balance.asn_order_id, [balance]);
  });
  return [...buckets].map(([asnOrderId, rows]) => ({ asnOrderId, balances: rows }));
}

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

function closeLabel(balance: ShortBalance): string {
  return balance.short_qty > 0 ? 'Write off…' : 'Close…';
}

/* ------------------------------------------------------------------ */
/*  Presentation                                                       */
/* ------------------------------------------------------------------ */

function SummaryTiles({ summary }: { summary: ShortBalanceSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
        <p className="text-xs text-muted-foreground">Open shortages</p>
        <p className="text-lg font-semibold text-amber-600">{summary.open_count}</p>
        <p className="text-xs text-muted-foreground">{summary.open_short_qty} unit(s) outstanding</p>
      </div>
      <div className="rounded-lg border px-3 py-2">
        <p className="text-xs text-muted-foreground">Resolved by a later receipt</p>
        <p className="text-lg font-semibold">{summary.resolved_count}</p>
      </div>
      <div className="rounded-lg border px-3 py-2">
        <p className="text-xs text-muted-foreground">Written off</p>
        <p className="text-lg font-semibold">{summary.written_off_count}</p>
      </div>
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

function LedgerRow({
  balance,
  canClose,
  onHistory,
  onClose,
}: {
  balance: ShortBalance;
  canClose: boolean;
  onHistory: (balance: ShortBalance) => void;
  onClose: (balance: ShortBalance) => void;
}) {
  const closureCode = balance.close_reason_code ?? EMPTY;

  return (
    <tr className="hover:bg-muted/20">
      <td className="px-4 py-2 align-top font-mono text-xs">{balance.sku}</td>
      <td className="px-4 py-2 text-center align-top tabular-nums">{balance.expected_qty}</td>
      <td className="px-4 py-2 text-center align-top tabular-nums">{balance.received_qty}</td>
      <td className="px-4 py-2 text-center align-top font-medium tabular-nums text-amber-600">{balance.short_qty}</td>
      <td className="px-4 py-2 align-top"><StatusPill status={balance.status}/></td>
      <td className="px-4 py-2 align-top text-xs text-muted-foreground">{balance.reason_code ?? EMPTY}</td>
      <td className="px-4 py-2 align-top text-xs text-muted-foreground">{closureCode}</td>
      <td className="px-4 py-2 text-right align-top">
        <div className="inline-flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onHistory(balance)}>
            History
          </Button>
          {canClose && balance.status === 'open' && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onClose(balance)}>
              {closeLabel(balance)}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function AsnGroupRows({
  group,
  expanded,
  canClose,
  onToggle,
  onHistory,
  onClose,
}: {
  group: AsnGroup;
  expanded: boolean;
  canClose: boolean;
  onToggle: (asnOrderId: string) => void;
  onHistory: (balance: ShortBalance) => void;
  onClose: (balance: ShortBalance) => void;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <>
      <tr className="border-t bg-muted/40">
        <td colSpan={COLUMN_COUNT} className="px-3 py-2">
          <button type="button" className="flex w-full items-center gap-2 text-left" onClick={() => onToggle(group.asnOrderId)}>
            <Chevron className="h-3.5 w-3.5 shrink-0"/>
            <span className="font-mono text-xs font-medium" title={group.asnOrderId}>ASN {shortId(group.asnOrderId)}</span>
            <span className="text-xs text-muted-foreground">{group.balances.length} line(s) on this page</span>
          </button>
        </td>
      </tr>
      {expanded &&
        group.balances.map((balance) => (
          <LedgerRow key={balance.id}
            balance={balance}
            canClose={canClose}
            onHistory={onHistory}
            onClose={onClose}/>
        ))}
    </>
  );
}

function LedgerTable({
  groups,
  expanded,
  canClose,
  expandedAll,
  onToggle,
  onToggleAll,
  onHistory,
  onClose,
}: {
  groups: AsnGroup[];
  expanded: Set<string>;
  canClose: boolean;
  expandedAll: boolean;
  onToggle: (asnOrderId: string) => void;
  onToggleAll: () => void;
  onHistory: (balance: ShortBalance) => void;
  onClose: (balance: ShortBalance) => void;
}) {
  const ExpandIcon = expandedAll ? ChevronDown : ChevronRight;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">
              <button type="button" className="flex items-center gap-1" onClick={onToggleAll}>
                <ExpandIcon className="h-3.5 w-3.5"/>
                SKU
              </button>
            </th>
            <th className="px-4 py-2 text-center font-medium text-muted-foreground">Expected</th>
            <th className="px-4 py-2 text-center font-medium text-muted-foreground">Received</th>
            <th className="px-4 py-2 text-center font-medium text-muted-foreground">Short</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Dock reason</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Closure reason</th>
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {groups.map((group) => (
            <AsnGroupRows key={group.asnOrderId}
              group={group}
              expanded={expanded.has(group.asnOrderId)}
              canClose={canClose}
              onToggle={onToggle}
              onHistory={onHistory}
              onClose={onClose}/>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LedgerPagination({
  pagination,
  page,
  loading,
  onPrev,
  onNext,
}: {
  pagination: WMSPagination | null;
  page: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!pagination || pagination.total_pages <= 0) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {page} of {pagination.total_pages} · {pagination.total_items} balance(s)
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!pagination.has_prev || loading} onClick={onPrev}>
          <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
        </Button>
        <Button size="sm" variant="outline" disabled={!pagination.has_next || loading} onClick={onNext}>
          Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EmptyLedger({ filterActive }: { filterActive: boolean }) {
  return (
    <p className="flex items-center justify-center gap-2 rounded-lg border py-10 text-center text-sm text-muted-foreground">
      <PackageX className="h-4 w-4" />
      {filterActive
        ? 'No shortages match these filters.'
        : 'No shortages recorded. Every ASN line has been received in full.'}
    </p>
  );
}

function LedgerBody({
  error,
  loading,
  balances,
  groups,
  expanded,
  expandedAll,
  canClose,
  filterActive,
  onRetry,
  onToggle,
  onToggleAll,
  onHistory,
  onClose,
}: {
  error: NormalizedApiError | null;
  loading: boolean;
  balances: ShortBalance[];
  groups: AsnGroup[];
  expanded: Set<string>;
  expandedAll: boolean;
  canClose: boolean;
  filterActive: boolean;
  onRetry: () => void;
  onToggle: (asnOrderId: string) => void;
  onToggleAll: () => void;
  onHistory: (balance: ShortBalance) => void;
  onClose: (balance: ShortBalance) => void;
}) {
  if (error) return <LedgerError error={error} onRetry={onRetry}/>;
  if (loading && balances.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading shortage ledger…</p>;
  }
  if (balances.length === 0) return <EmptyLedger filterActive={filterActive}/>;

  return (
    <LedgerTable groups={groups}
      expanded={expanded}
      canClose={canClose}
      expandedAll={expandedAll}
      onToggle={onToggle}
      onToggleAll={onToggleAll}
      onHistory={onHistory}
      onClose={onClose}/>
  );
}

/* ------------------------------------------------------------------ */
/*  Ledger                                                             */
/* ------------------------------------------------------------------ */

/**
 * The shortage worklist (`GET /short-balances`). A short receipt creates no
 * hold/quarantine exception — nothing needs disposing of — so residuals are
 * tracked here instead and closed with a manager-approved write-off.
 */
export function ShortageLedger() {
  const token = useUserStore((state) => state.accessToken);
  const permissions = useUserStore((state) => state.permissions.permissions);
  const { toast } = useToast();
  const canClose = hasPermission(permissions, 'inbound_exception.dispose');

  const [balances, setBalances] = React.useState<ShortBalance[]>([]);
  const [pagination, setPagination] = React.useState<WMSPagination | null>(null);
  const [summary, setSummary] = React.useState<ShortBalanceSummary | null>(null);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<BalanceStatus | ''>('');
  const [skuDraft, setSkuDraft] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
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
          status: status || undefined,
          sku: sku || undefined,
          page: targetPage,
          page_size: PAGE_SIZE,
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
    [token, status, sku],
  );

  React.useEffect(() => {
    void load(1);
  }, [load]);

  const groups = React.useMemo(() => groupByAsn(balances), [balances]);
  const expandedAll = groups.length > 0 && groups.every((group) => expanded.has(group.asnOrderId));

  const toggleGroup = (asnOrderId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(asnOrderId)) next.delete(asnOrderId);
      else next.add(asnOrderId);
      return next;
    });
  };

  const toggleAll = () => {
    setExpanded(expandedAll ? new Set() : new Set(groups.map((group) => group.asnOrderId)));
  };

  const applySkuFilter = (event: React.FormEvent) => {
    event.preventDefault();
    setSku(skuDraft.trim());
  };

  const clearFilters = () => {
    setStatus('');
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

  const filterActive = status !== '' || sku !== '';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Shortage Ledger</h2>
          <p className="text-sm text-muted-foreground">
            Units missing against an ASN. Nothing is segregated — a residual short stays open until a later receipt covers it or a
            manager writes it off.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load(page)} disabled={loading}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {summary && <SummaryTiles summary={summary}/>}

      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3" onSubmit={applySkuFilter}>
        <div className="space-y-1">
          <Label htmlFor="shortage-status">Status</Label>
          <select id="shortage-status"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as BalanceStatus | '')}>
            {STATUS_FILTERS.map(({ value, label }) => (
              <option key={value || 'all'} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="shortage-sku">SKU</Label>
          <Input id="shortage-sku"
            className="w-56"
            value={skuDraft}
            onChange={(event) => setSkuDraft(event.target.value)}
            placeholder="Exact SKU, e.g. PTK-DUK-M009"/>
        </div>
        <Button type="submit" size="sm" variant="secondary">Apply</Button>
        {filterActive && (
          <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
        )}
      </form>

      <LedgerBody error={error}
        loading={loading}
        balances={balances}
        groups={groups}
        expanded={expanded}
        expandedAll={expandedAll}
        canClose={canClose}
        filterActive={filterActive}
        onRetry={() => void load(page)}
        onToggle={toggleGroup}
        onToggleAll={toggleAll}
        onHistory={setHistoryBalance}
        onClose={setCloseBalance}/>

      <LedgerPagination pagination={pagination}
        page={page}
        loading={loading}
        onPrev={() => void load(page - 1)}
        onNext={() => void load(page + 1)}/>

      <ShortageHistoryDialog balance={historyBalance} onOpenChange={(open) => !open && setHistoryBalance(null)}/>
      <CloseShortageDialog balance={closeBalance}
        onOpenChange={(open) => !open && setCloseBalance(null)}
        onClosed={handleClosed}
        onStale={() => void load(page)}/>
    </div>
  );
}

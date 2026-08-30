import * as React from 'react';

import { AlertTriangle, CheckCircle2, CircleCheck, Eye, ScanLine, X } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { useToast } from '@horizon-sync/ui/hooks';

import { useInboundSession } from '../../hooks/useWMS';
import type { AsnOrderListItem, AsnOrderListResponse } from '../../types/asn-order.types';
import type { AsnReceivingSummary, ScanResult, ScanSession, SessionSummary } from '../../types/wms.types';
import { asnOrderApi } from '../../utility/api/asn-orders';

interface InboundScanPanelProps {
  warehouseId: string;
  onSlipGenerated?: (slipId: string) => void;
}

async function fetchAllAsns(
  accessToken: string,
  warehouseId: string,
  isCancelled: () => boolean,
): Promise<AsnOrderListItem[]> {
  const pageSize = 100;
  const allAsns: AsnOrderListItem[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && !isCancelled()) {
    const response = (await asnOrderApi.list(accessToken, page, pageSize, { warehouse_id: warehouseId })) as AsnOrderListResponse;
    allAsns.push(...response.asn_orders);

    const pagination = response.pagination;
    hasNext = pagination?.has_next ?? page < (pagination?.total_pages ?? 1);
    page += 1;
  }

  return allAsns;
}

function useAvailableAsns(accessToken: string | null, warehouseId: string, enabled: boolean) {
  const [asnOptions, setAsnOptions] = React.useState<AsnOrderListItem[]>([]);
  const [loadingAsns, setLoadingAsns] = React.useState(false);
  const [asnError, setAsnError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accessToken || !warehouseId || !enabled) return;

    let cancelled = false;
    const loadAsnOptions = async () => {
      setLoadingAsns(true);
      setAsnError(null);
      try {
        const allAsns = await fetchAllAsns(accessToken, warehouseId, () => cancelled);
        if (!cancelled) {
          setAsnOptions(allAsns.filter((asn) => asn.status === 'confirmed' || asn.status === 'partially_delivered'));
        }
      } catch (err) {
        if (!cancelled) setAsnError(err instanceof Error ? err.message : 'Failed to load available ASNs');
      } finally {
        if (!cancelled) setLoadingAsns(false);
      }
    };

    void loadAsnOptions();
    return () => {
      cancelled = true;
    };
  }, [accessToken, enabled, warehouseId]);

  return { asnOptions, loadingAsns, asnError };
}

function useLiveReconciliation(accessToken: string | null, session: ScanSession | null) {
  const [summary, setSummary] = React.useState<AsnReceivingSummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const latestRequestRef = React.useRef(0);

  const refresh = React.useCallback(async () => {
    if (!accessToken || !session?.asn_order_id) {
      latestRequestRef.current += 1;
      setSummary(null);
      return;
    }

    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = (await asnOrderApi.getReceivingSummary(accessToken, session.asn_order_id, session.id)) as AsnReceivingSummary;
      if (requestId !== latestRequestRef.current) return;
      setSummary(next);
    } catch (err) {
      if (requestId !== latestRequestRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to refresh live reconciliation');
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [accessToken, session?.asn_order_id, session?.id]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}

function formatQuantity(value: number) {
  return value.toLocaleString();
}

function LiveReconciliationPanel({ summary, loading, error }: { summary: AsnReceivingSummary | null; loading: boolean; error: string | null }) {
  if (loading && !summary) {
    return <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading live reconciliation…</div>;
  }

  if (!summary) {
    return error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null;
  }

  const status = summary.ready_for_receipt_note
    ? {
        label: 'Reconciled — Ready for Receipt Note',
        className: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300',
        icon: <CircleCheck className="h-4 w-4" />,
      }
    : summary.reconciliation_status === 'exception'
      ? {
          label: 'Exception requires review',
          className: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
          icon: <AlertTriangle className="h-4 w-4" />,
        }
      : summary.is_partial_receipt
        ? {
            label: `Partial receipt — ${formatQuantity(summary.short_total_qty)} units remaining`,
            className: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
            icon: <AlertTriangle className="h-4 w-4" />,
          }
        : {
            label: 'Scanning in progress',
            className: 'border-muted bg-muted/40 text-muted-foreground',
            icon: <ScanLine className="h-4 w-4" />,
          };

  const totals = [
    ['Expected', summary.expected_total_qty],
    ['Scanned', summary.scanned_total_qty],
    ['Accepted', summary.accepted_total_qty],
    ['Short', summary.short_total_qty],
    ['Excess', summary.excess_total_qty],
    ['Damaged', summary.damaged_total_qty],
    ['Hold', summary.hold_total_qty],
    ['Rejected', summary.rejected_total_qty],
  ];

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Live ASN Reconciliation</h3>
          <p className="text-sm text-muted-foreground">{summary.asn_order_no}</p>
        </div>
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${status.className}`}>
          {status.icon}
          {status.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {totals.map(([label, value]) => (
          <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{formatQuantity(value as number)}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 text-right font-medium">Expected</th>
              <th className="px-3 py-2 text-right font-medium">Scanned</th>
              <th className="px-3 py-2 text-right font-medium">Accepted</th>
              <th className="px-3 py-2 text-right font-medium">Short</th>
              <th className="px-3 py-2 text-right font-medium">Excess</th>
              <th className="px-3 py-2 text-right font-medium">Damaged</th>
              <th className="px-3 py-2 text-right font-medium">Hold</th>
              <th className="px-3 py-2 text-right font-medium">Rejected</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {summary.line_items.map((item) => (
              <tr key={item.asn_item_id}>
                <td className="px-3 py-2">
                  <p className="font-mono font-medium">{item.sku || '—'}</p>
                  {item.item_name && <p className="text-xs text-muted-foreground">{item.item_name}</p>}
                </td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.expected_qty)}</td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.scanned_qty)}</td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.accepted_qty)}</td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.short_qty)}</td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.excess_qty)}</td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.damaged_qty)}</td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.hold_qty)}</td>
                <td className="px-3 py-2 text-right">{formatQuantity(item.rejected_qty)}</td>
                <td className="px-3 py-2 capitalize">{item.status.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}

function SessionSummaryPanel({ summary, onClose }: { summary: SessionSummary; onClose: () => void }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Session Summary Preview</span>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="px-4 py-3 grid grid-cols-3 gap-4 text-sm border-b">
        <div>
          <p className="text-xs text-muted-foreground">Total Boxes</p>
          <p className="font-semibold text-lg">{summary.total_boxes}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Qty</p>
          <p className="font-semibold text-lg">{summary.total_quantity}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">SKUs</p>
          <p className="font-semibold text-lg">{summary.items.length}</p>
        </div>
      </div>
      <div className="divide-y max-h-48 overflow-y-auto">
        {summary.items.map((sku) => (
          <div key={sku.sku} className="px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium">{sku.sku}</span>
              <span className="text-muted-foreground">
                {sku.total_boxes} boxes · {sku.total_quantity} units
              </span>
            </div>
            {sku.batches.map((b) => (
              <div key={b.batch_number} className="text-xs text-muted-foreground ml-2">
                Batch {b.batch_number}: {b.box_count} boxes, {b.quantity} units
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function InboundSessionStartForm({
  dockLocation,
  onDockLocationChange,
  asnOptions,
  selectedAsnId,
  onSelectedAsnChange,
  loadingAsns,
  asnError,
  sessionError,
  loading,
  onStart,
}: {
  dockLocation: string;
  onDockLocationChange: (value: string) => void;
  asnOptions: AsnOrderListItem[];
  selectedAsnId: string;
  onSelectedAsnChange: (value: string) => void;
  loadingAsns: boolean;
  asnError: string | null;
  sessionError: string | null;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="dock-location">Dock Location (optional)</Label>
        <Input id="dock-location"
          value={dockLocation}
          onChange={(event) => onDockLocationChange(event.target.value)}
          placeholder="e.g. Dock A, Bay 3"/>
      </div>
      <div className="space-y-2">
        <Label htmlFor="inbound-asn">ASN for reconciliation (optional)</Label>
        <select id="inbound-asn"
          value={selectedAsnId}
          onChange={(event) => onSelectedAsnChange(event.target.value)}
          disabled={loadingAsns}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
          <option value="">Receive without an ASN</option>
          {asnOptions.map((asn) => (
            <option key={asn.id} value={asn.id}>
              {asn.asn_order_no} · {asn.status === 'partially_delivered' ? 'Partial receipt open' : 'Expected'}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Select a confirmed or partially delivered ASN to compare every scan with its expected quantities.
        </p>
        {asnError && <p className="text-sm text-destructive">{asnError}</p>}
      </div>
      {sessionError && <p className="text-sm text-destructive">{sessionError}</p>}
      <Button onClick={onStart} disabled={loading} className="gap-2">
        <ScanLine className="h-4 w-4" />
        {loading ? 'Starting...' : 'Start Inbound Session'}
      </Button>
    </div>
  );
}

export function InboundScanPanel({ warehouseId, onSlipGenerated }: InboundScanPanelProps) {
  const { session, loading, error, startSession, recordScan, endSession, getSummary } = useInboundSession();
  const { toast } = useToast();
  const accessToken = useUserStore((s) => s.accessToken);
  const [qrInput, setQrInput] = React.useState('');
  const [dockLocation, setDockLocation] = React.useState('');
  const [selectedAsnId, setSelectedAsnId] = React.useState('');
  const [scans, setScans] = React.useState<ScanResult[]>([]);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<SessionSummary | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { asnOptions, loadingAsns, asnError } = useAvailableAsns(accessToken, warehouseId, !session);
  const reconciliation = useLiveReconciliation(accessToken, session);

  const handleStart = async () => {
    try {
      await startSession(warehouseId, dockLocation || undefined, selectedAsnId || undefined);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      // error shown via hook
    }
  };

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    setScanError(null);
    try {
      const result = await recordScan(qrInput.trim());
      setScans((prev) => [result, ...prev]);
      setQrInput('');
      inputRef.current?.focus();
      await reconciliation.refresh();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
    }
  };

  const handleEnd = async () => {
    if (!window.confirm(`End session? This will generate a receiving slip for ${session?.total_boxes_scanned ?? 0} scanned boxes.`)) return;
    try {
      const slip = await endSession();
      setSummary(null);
      toast({ title: 'Session ended', description: `Receiving slip ${slip.slip_number} created.` });
      onSlipGenerated?.(slip.id);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to end session', variant: 'destructive' });
    }
  };

  const handlePreviewSummary = async () => {
    const result = await getSummary();
    setSummary(result);
  };

  if (!session) {
    return (
      <InboundSessionStartForm dockLocation={dockLocation}
        onDockLocationChange={setDockLocation}
        asnOptions={asnOptions}
        selectedAsnId={selectedAsnId}
        onSelectedAsnChange={setSelectedAsnId}
        loadingAsns={loadingAsns}
        asnError={asnError}
        sessionError={error}
        loading={loading}
        onStart={handleStart}/>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">Session active</span>
          {session.dock_location && <span className="text-sm text-muted-foreground">— {session.dock_location}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">{session.total_boxes_scanned} boxes scanned</span>
          <Button variant="outline"
            size="sm"
            onClick={handlePreviewSummary}
            disabled={loading || session.total_boxes_scanned === 0}
            className="gap-1">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button variant="destructive" size="sm" onClick={handleEnd} disabled={loading || session.total_boxes_scanned === 0}>
            End Session
          </Button>
        </div>
      </div>

      {/* Session summary preview */}
      {summary && <SessionSummaryPanel summary={summary} onClose={() => setSummary(null)} />}
      <LiveReconciliationPanel summary={reconciliation.summary} loading={reconciliation.loading} error={reconciliation.error} />
      <div className="flex gap-2">
        <Input ref={inputRef}
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Scan or paste QR code data..."
          className="font-mono text-sm flex-1"/>
        <Button onClick={handleScan} className="gap-2 shrink-0">
          <ScanLine className="h-4 w-4" />
          Scan
        </Button>
      </div>

      {scanError && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          <X className="h-4 w-4 mt-0.5 shrink-0" />
          {scanError}
        </div>
      )}

      {/* Scan log */}
      {scans.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Scans</div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {scans.map((scan) => (
              <div key={scan.scan_item_id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="font-mono font-medium">{scan.sku}</span>
                <span className="text-muted-foreground">×{scan.quantity}</span>
                <span className="text-muted-foreground text-xs">{scan.batch_number}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {scan.scanned_at ? new Date(scan.scanned_at).toLocaleTimeString() : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

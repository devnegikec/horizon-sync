import * as React from 'react';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useUserStore } from '@horizon-sync/store';
import { Button, Input, Label, Textarea } from '@horizon-sync/ui/components';

import type { InboundException } from '../../types/wms.types';
import { inboundApi } from '../../utility/api/wms';
import { hasPermission } from '../../utils/permissions';

export function InboundExceptionQueue({ warehouseId }: { warehouseId?: string }) {
  const token = useUserStore((state) => state.accessToken);
  const permissions = useUserStore((state) => state.permissions.permissions);
  const [exceptions, setExceptions] = React.useState<InboundException[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [itemId, setItemId] = React.useState('');
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const canDispose = hasPermission(permissions, 'inbound_exception.dispose');

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [hold, quarantine] = await Promise.all([
        inboundApi.listExceptions(token, { warehouse_id: warehouseId, destination: 'HOLD' }),
        inboundApi.listExceptions(token, { warehouse_id: warehouseId, destination: 'QUARANTINE' }),
      ]);
      setExceptions([...hold, ...quarantine].filter((item, index, all) => all.findIndex((x) => x.id === item.id) === index));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exceptions');
    } finally {
      setLoading(false);
    }
  }, [token, warehouseId]);

  React.useEffect(() => { load(); }, [load]);

  const dispose = async (exception: InboundException, action: 'release_to_receiving' | 'move_to_hold' | 'move_to_quarantine' | 'return_to_sender' | 'dispose') => {
    if (!token) return;
    setActiveId(exception.id);
    try {
      await inboundApi.disposeException(token, exception.id, {
        action,
        note: note.trim() || undefined,
        item_id: itemId.trim() || undefined,
      });
      setNote('');
      setItemId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disposition failed');
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Hold / Quarantine Queue</h2>
          <p className="text-sm text-muted-foreground">Non-pickable inbound stock awaiting a manager decision.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
      </div>
      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-2">
        <div><Label htmlFor="exception-note">Decision note (optional)</Label><Textarea id="exception-note" value={note} onChange={(event) => setNote(event.target.value)} /></div>
        <div><Label htmlFor="exception-item-id">Corrected SKU item ID (only if release needs a newly added SKU)</Label><Input id="exception-item-id" value={itemId} onChange={(event) => setItemId(event.target.value)} placeholder="Optional item UUID" /></div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading exception queue…</p>}
      {!loading && exceptions.length === 0 && <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">No hold or quarantine exceptions.</p>}
      <div className="grid gap-3">
        {exceptions.map((exception) => (
          <article key={exception.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-amber-500" />{exception.sku || exception.qr_identifier || 'Unknown identity'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{exception.reason_code} · Qty {exception.quantity} · {exception.destination || 'Unassigned'} · {exception.status}</p>
                {exception.note && <p className="mt-2 text-sm">{exception.note}</p>}
                {exception.evidence.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{exception.evidence.length} evidence file(s) attached</p>}
              </div>
              {canDispose && !['closed', 'released'].includes(exception.status) && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => dispose(exception, 'release_to_receiving')} disabled={activeId === exception.id}>Release to Receiving</Button>
                  <Button size="sm" variant="outline" onClick={() => dispose(exception, 'move_to_hold')} disabled={activeId === exception.id}>Hold</Button>
                  <Button size="sm" variant="outline" onClick={() => dispose(exception, 'move_to_quarantine')} disabled={activeId === exception.id}>Quarantine</Button>
                  <Button size="sm" variant="outline" onClick={() => dispose(exception, 'return_to_sender')} disabled={activeId === exception.id}>Return</Button>
                  <Button size="sm" variant="destructive" onClick={() => dispose(exception, 'dispose')} disabled={activeId === exception.id}>Dispose</Button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

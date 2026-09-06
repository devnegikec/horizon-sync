import * as React from 'react';

import { ChevronDown, ChevronRight, Layers, RefreshCw } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';

import { qrBlockService } from '../../features/qr-management/services/qrBlockService';
import type { QSealAggregationChild, QSealAggregationGroup } from '../../features/qr-management/types/qrBlock.types';
import { getApiErrorMessage } from '../../features/qr-management/utils/apiError';

const PAGE_SIZE = 20;

function ActivationBadge({ activated }: { activated: boolean | null }) {
  if (activated == null) return <span className="text-muted-foreground">—</span>;
  return activated ? <Badge variant="success">Activated</Badge> : <Badge variant="secondary">Not activated</Badge>;
}

function ChildRow({ child }: { child: QSealAggregationChild }) {
  return (
    <tr className="bg-muted/20">
      <td className="px-4 py-1.5 pl-10">
        <span className="font-mono text-xs font-medium">{child.child_serial}</span>
      </td>
      <td className="px-4 py-1.5" colSpan={3}>
        <span className="inline-flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <ActivationBadge activated={child.activated} />
          {child.batch && <span>Batch: <span className="font-mono">{child.batch}</span></span>}
        </span>
      </td>
      <td className="px-4 py-1.5 text-right tabular-nums">{child.scan_count}</td>
    </tr>
  );
}

function GroupRow({ group }: { group: QSealAggregationGroup }) {
  const [expanded, setExpanded] = React.useState(false);
  const filled = group.linked_count ?? 0;
  const capacity = group.parent_capacity;
  const totalScans = group.children.reduce((sum, child) => sum + (child.scan_count ?? 0), 0);

  return (
    <>
      <tr className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setExpanded((e) => !e)}>
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="font-medium">{group.parent_name}</span>
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{group.parent_serial}</td>
        <td className="px-4 py-2 text-sm text-muted-foreground">{group.parent_type}</td>
        <td className="px-4 py-2 text-center">
          <span className={filled === capacity ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
            {filled}/{capacity}
          </span>
        </td>
        <td className="px-4 py-2 text-right tabular-nums font-medium">{totalScans}</td>
      </tr>
      {expanded && group.children.map((child, idx) => (
        <ChildRow key={child.child_serial ?? `child-${idx}`} child={child} />
      ))}
    </>
  );
}

/**
 * Aggregation log — grouped by parent (master pack). Operators see one row per
 * parent and can expand it to inspect the linked child units and their
 * activation state. Units with no parent are listed separately.
 */
export function AggregationManagement() {
  const [groups, setGroups] = React.useState<QSealAggregationGroup[]>([]);
  const [unlinked, setUnlinked] = React.useState<QSealAggregationChild[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const latestRequestRef = React.useRef(0);

  const fetch = React.useCallback(async (p: number) => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await qrBlockService.getAggregationGrouped({ page: p, page_size: PAGE_SIZE });
      if (requestId !== latestRequestRef.current) return;
      setGroups(res.groups ?? []);
      setUnlinked(res.unlinked ?? []);
      setTotalItems(res.pagination.total_items);
    } catch (err: unknown) {
      if (requestId !== latestRequestRef.current) return;
      setError(getApiErrorMessage(err, 'Failed to load aggregation log'));
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetch(page);
  }, [fetch, page]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const isEmpty = groups.length === 0 && unlinked.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aggregation</h2>
          <p className="text-muted-foreground">
            Master pack cascading log — spot wrong or missing links across batches
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetch(page)} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton columns={5} rows={10} showHeader />
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No aggregation entries</p>
              <p className="text-muted-foreground">
                Generate QR blocks and enable master pack cascading to see links here.
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Box</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Serial</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-center px-4 py-2 font-medium text-muted-foreground">Pack Fill</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Scans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groups.map((group) => (
                      <GroupRow key={group.parent_id} group={group} />
                    ))}
                  </tbody>
                </table>
              </div>

              {unlinked.length > 0 && (
                <div className="border rounded-lg overflow-hidden mt-4">
                  <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Unlinked Units ({unlinked.length})
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Serial</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Activation</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">Scans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {unlinked.map((unit, idx) => (
                        <tr key={unit.child_serial ?? `unlinked-${idx}`}>
                          <td className="px-4 py-2 font-mono text-xs">{unit.child_serial}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{unit.batch ?? '—'}</td>
                          <td className="px-4 py-2"><ActivationBadge activated={unit.activated} /></td>
                          <td className="px-4 py-2 text-right tabular-nums">{unit.scan_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {totalItems} total
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

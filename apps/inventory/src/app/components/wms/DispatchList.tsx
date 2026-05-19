import * as React from 'react';

import { RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

import { useDispatches } from '../../hooks/useWMS';

export function DispatchList() {
  const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useDispatches({ page, page_size: 20 });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading dispatches...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && data && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dispatch #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice Ref</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Driver</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.dispatches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No dispatch records found</td>
                  </tr>
                )}
                {data.dispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">{d.dispatch_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.invoice_reference ?? '—'}</td>
                    <td className="px-4 py-3">{d.vehicle_number ?? '—'}</td>
                    <td className="px-4 py-3">{d.driver_name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.dispatched_at ? new Date(d.dispatched_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {data.pagination.page} of {data.pagination.total_pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!data.pagination.has_prev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!data.pagination.has_next} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

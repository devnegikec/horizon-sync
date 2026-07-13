import { useState, useCallback } from 'react';

import { Download, Loader2, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { pickListApi } from '../../utility/api/pick-lists';

interface PickListManagementHeaderProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export function PickListManagementHeader({
  onRefresh,
  isLoading = false,
}: PickListManagementHeaderProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const firstPage = await pickListApi.list(accessToken, 1, 100) as { pick_lists: Record<string, unknown>[]; pagination: { total_pages: number } };
      let all: Record<string, unknown>[] = firstPage.pick_lists ?? [];
      const totalPages = firstPage.pagination?.total_pages ?? 1;
      for (let p = 2; p <= totalPages; p++) {
        const page = await pickListApi.list(accessToken, p, 100) as { pick_lists: Record<string, unknown>[] };
        all = all.concat(page.pick_lists ?? []);
      }

      const headers = ['Pick List No', 'Sales Order No', 'Warehouse', 'Status', 'Created At'];
      const rows = all.map((r) => [
        String(r['pick_list_no'] ?? ''),
        String(r['sales_order_no'] ?? ''),
        String(r['warehouse_name'] ?? ''),
        String(r['status'] ?? ''),
        String(r['created_at'] ?? ''),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pick-lists.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [accessToken]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pick Lists</h1>
        <p className="text-muted-foreground mt-1">
          Manage warehouse pick lists for order fulfillment
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
          {isExporting ? <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</> : <><Download className="h-4 w-4" />Export</>}
        </Button>
      </div>
    </div>
  );
}


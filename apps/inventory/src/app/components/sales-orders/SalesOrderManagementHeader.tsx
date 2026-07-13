import { useState, useCallback } from 'react';

import { Plus, Download, Loader2, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { salesOrderApi } from '../../utility/api';

interface SalesOrderManagementHeaderProps {
  onRefresh: () => void;
  onCreateSalesOrder: () => void;
  isLoading?: boolean;
}

export function SalesOrderManagementHeader({
  onRefresh,
  onCreateSalesOrder,
  isLoading = false,
}: SalesOrderManagementHeaderProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const firstPage = await salesOrderApi.list(accessToken, 1, 100) as { sales_orders: Record<string, unknown>[]; pagination: { total_pages: number } };
      let all: Record<string, unknown>[] = firstPage.sales_orders ?? [];
      const totalPages = firstPage.pagination?.total_pages ?? 1;
      for (let p = 2; p <= totalPages; p++) {
        const page = await salesOrderApi.list(accessToken, p, 100) as { sales_orders: Record<string, unknown>[] };
        all = all.concat(page.sales_orders ?? []);
      }

      const headers = ['Order No', 'Customer', 'Order Date', 'Status', 'Currency', 'Grand Total', 'Created At'];
      const rows = all.map((r) => [
        String(r['sales_order_no'] ?? ''),
        String(r['customer_name'] ?? ''),
        String(r['order_date'] ?? ''),
        String(r['status'] ?? ''),
        String(r['currency'] ?? ''),
        String(r['grand_total'] ?? ''),
        String(r['created_at'] ?? ''),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sales-orders.csv';
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
        <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
        <p className="text-muted-foreground mt-1">Create and manage sales orders</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline"
          className="gap-2"
          onClick={onRefresh}
          disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
          {isExporting ? <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</> : <><Download className="h-4 w-4" />Export</>}
        </Button>
        <Button variant="default"
          className="gap-2 text-primary-foreground shadow-lg"
          onClick={onCreateSalesOrder}>
          <Plus className="h-4 w-4" />
          New Sales Order
        </Button>
      </div>
    </div>
  );
}

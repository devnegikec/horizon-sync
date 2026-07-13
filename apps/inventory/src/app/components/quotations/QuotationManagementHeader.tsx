import { useState, useCallback } from 'react';

import { Plus, Download, Loader2, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { quotationApi } from '../../utility/api';
import type { Quotation } from '../../types/quotation.types';

interface QuotationManagementHeaderProps {
  onRefresh: () => void;
  onCreateQuotation: () => void;
  isLoading?: boolean;
}

export function QuotationManagementHeader({
  onRefresh,
  onCreateQuotation,
  isLoading = false,
}: QuotationManagementHeaderProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      // Fetch all pages (backend max page_size is 100)
      const firstPage = await quotationApi.list(accessToken, 1, 100) as { quotations: Quotation[]; pagination: { total_pages: number } };
      let allQuotations: Quotation[] = firstPage.quotations ?? [];
      const totalPages = firstPage.pagination?.total_pages ?? 1;
      for (let p = 2; p <= totalPages; p++) {
        const page = await quotationApi.list(accessToken, p, 100) as { quotations: Quotation[] };
        allQuotations = allQuotations.concat(page.quotations ?? []);
      }

      const headers = ['Quotation No', 'Customer', 'Date', 'Valid Until', 'Status', 'Currency', 'Grand Total', 'Converted to SO', 'Created At'];
      const rows = allQuotations.map((q) => [
        q.quotation_no ?? '',
        q.customer?.name ?? q.customer_name ?? '',
        q.quotation_date ?? '',
        q.valid_until ?? '',
        q.status ?? '',
        q.currency ?? '',
        q.grand_total ?? '',
        q.converted_to_sales_order ? 'Yes' : 'No',
        q.created_at ?? '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quotations.csv';
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
        <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
        <p className="text-muted-foreground mt-1">Create and manage sales quotations</p>
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
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
            </>
          )}
        </Button>
        <Button variant="default"
          className="gap-2 text-primary-foreground shadow-lg"
          onClick={onCreateQuotation}>
          <Plus className="h-4 w-4" />
          New Quotation
        </Button>
      </div>
    </div>
  );
}


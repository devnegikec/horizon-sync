import { useState } from 'react';

import { Plus, Download, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '../ui/button';
import { cn } from '../../lib';

interface InvoiceManagementHeaderProps {
  onRefresh: () => void;
  onCreateInvoice: () => void;
  onExport?: () => Promise<void>;
  isLoading?: boolean;
}

export function InvoiceManagementHeader({
  onRefresh,
  onCreateInvoice,
  onExport,
  isLoading = false,
}: InvoiceManagementHeaderProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
        <p className="text-muted-foreground mt-1">Create and manage sales and purchase invoices</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
        {onExport && (
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</> : <><Download className="h-4 w-4" />Export</>}
          </Button>
        )}
        <Button variant="default" className="gap-2 text-primary-foreground shadow-lg" onClick={onCreateInvoice}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>
    </div>
  );
}

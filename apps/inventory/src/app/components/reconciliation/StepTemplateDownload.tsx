import * as React from 'react';

import { Download, FileSpreadsheet, Info } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Step component                                                     */
/* ------------------------------------------------------------------ */

interface StepTemplateDownloadProps {
  warehouseName: string;
  warehouseId: string;
  onNext: () => void;
  onBack: () => void;
}

export function StepTemplateDownload({
  warehouseName,
  onNext,
  onBack,
}: StepTemplateDownloadProps) {
  const [downloaded, setDownloaded] = React.useState(false);

  const handleDownload = () => {
    // Generate a minimal CSV template with headers
    const csvContent = [
      'Item Code,Item Name,UOM,System Count,Physical Count,Difference,Notes',
      '# Fill in the Physical Count column with your actual counted quantities',
      '# Do not modify Item Code, Item Name, UOM, or System Count columns',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-reconciliation-${warehouseName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Download the stock template for <span className="font-medium text-foreground">{warehouseName}</span>.
        This file contains live system counts — update the{' '}
        <span className="font-medium text-foreground">Physical Count</span> column with your actual
        counted quantities.
      </p>

      {/* Download CTA */}
      <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/30 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-semibold">Stock Reconciliation Template</p>
          <p className="text-sm text-muted-foreground mt-1">{warehouseName} · CSV format</p>
        </div>
        <Button onClick={handleDownload} className="gap-2" size="lg">
          <Download className="h-4 w-4" />
          Download Current Stock Template
        </Button>
        {downloaded && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Template downloaded
          </p>
        )}
      </div>

      {/* Instruction note */}
      <div className="flex gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          This file contains live system counts. Please update the{' '}
          <strong>Physical Count</strong> column with your actual counted quantities, then upload
          the file in the next step.
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

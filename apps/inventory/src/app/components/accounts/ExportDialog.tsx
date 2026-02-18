import { useState } from 'react';
import { Download, FileText, FileJson, FileSpreadsheet, FileType } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import type { AccountFilters } from '../../types/account.types';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AccountFilters;
}

type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const formatOptions: FormatOption[] = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values, compatible with Excel and spreadsheet applications',
    icon: FileText,
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'JavaScript Object Notation, ideal for data integration and APIs',
    icon: FileJson,
  },
  {
    value: 'xlsx',
    label: 'Excel (XLSX)',
    description: 'Microsoft Excel format with formatting and styling',
    icon: FileSpreadsheet,
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Portable Document Format, ready for printing and sharing',
    icon: FileType,
  },
];

export function ExportDialog({ open, onOpenChange, filters }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('format', selectedFormat);
      
      if (filters.account_type && filters.account_type !== 'all') {
        params.append('account_type', filters.account_type);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.currency && filters.currency !== 'all') {
        params.append('currency', filters.currency);
      }

      // Trigger download
      const url = `/api/v1/accounts/export?${params.toString()}`;
      
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart_of_accounts_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(true);
      
      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export accounts');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Chart of Accounts
          </DialogTitle>
          <DialogDescription>
            Choose a format to export your chart of accounts data. Current filters will be applied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Active Filters Info */}
          {(filters.account_type !== 'all' || filters.status !== 'all' || filters.currency !== 'all') && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <strong>Active filters:</strong>
                {filters.account_type !== 'all' && ` Type: ${filters.account_type}`}
                {filters.status !== 'all' && ` • Status: ${filters.status}`}
                {filters.currency !== 'all' && ` • Currency: ${filters.currency}`}
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3" role="radiogroup" aria-label="Export format">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="export-format"
                    id={option.value}
                    value={option.value}
                    checked={selectedFormat === option.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFormat(e.target.value as ExportFormat)}
                    className="mt-1 h-4 w-4"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg border p-4 transition-colors',
                      selectedFormat === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-md border border-green-500 bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                ✓ Export started successfully! Your download should begin shortly.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

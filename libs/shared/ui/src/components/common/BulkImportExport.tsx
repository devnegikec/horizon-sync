import * as React from 'react';

import { ChevronDown, Download, FileDown, Loader2, Upload } from 'lucide-react';

import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

/** File formats the bulk export dialog can offer. */
export type BulkFileFormat = 'csv' | 'xlsx' | 'json' | 'pdf';

/** Status filter exposed by the export dialog. */
export type BulkStatusFilter = 'all' | 'active' | 'inactive';

export interface BulkColumnOption {
  id: string;
  label: string;
}

export interface BulkExportRequest {
  format: BulkFileFormat;
  fileName: string;
  columns: string[];
  status: BulkStatusFilter;
}

export interface BulkImportOutcome {
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  errors?: Array<{ row: number; message?: string }>;
}

export interface BulkImportExportProps {
  /** Dropdown trigger label, e.g. "Product Export/Import". */
  triggerLabel?: string;
  /** Dropdown menu item labels. */
  exportActionLabel?: string;
  importActionLabel?: string;
  /** Export dialog copy. */
  exportTitle?: string;
  exportDescription?: string;
  /** Import dialog copy. */
  importTitle?: string;
  importDescription?: string;
  /** Formats offered in the export format select (default `['csv', 'xlsx']`). */
  fileFormats?: BulkFileFormat[];
  /** Formats offered for template downloads (default `['csv']`). */
  templateFormats?: BulkFileFormat[];
  defaultExportFileName?: string;
  /** Base name for downloaded templates (default `<defaultExportFileName>-template`). */
  templateFileName?: string;
  /** When provided, the export dialog shows a column picker. */
  columnOptions?: BulkColumnOption[];
  defaultSelectedColumns?: string[];
  /** When true, the export dialog shows an active/inactive status filter. */
  showStatusFilter?: boolean;
  /** `accept` attribute for the file input (default `.csv,.xlsx,.xls`). */
  importAccept?: string;
  /** Small helper text shown under the dropzone. */
  importHint?: string;
  /** Disables the dropdown trigger. */
  disabled?: boolean;
  /** Extra filters rendered inside the export dialog (above the column picker). */
  exportFilters?: React.ReactNode;
  /** Called when the user confirms an export; resolve with the file blob. */
  onExport: (request: BulkExportRequest) => Promise<Blob>;
  /** Called when the user requests the import template; resolve with the blob. */
  onDownloadTemplate?: (format: BulkFileFormat) => Promise<Blob>;
  /** Called with the selected file; resolve with the import summary. */
  onImport: (file: File) => Promise<BulkImportOutcome>;
  /** Invoked after a successful import (e.g. to refetch the list). */
  onImported?: () => void;
}

const FORMAT_LABELS: Record<BulkFileFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel (XLSX)',
  json: 'JSON',
  pdf: 'PDF',
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (err.details && typeof err.details === 'object') {
      const details = err.details as Record<string, unknown>;
      const detail = details.detail || details.message;
      if (detail) return String(detail);
    }
    if (err.message) return String(err.message);
  }
  return fallback;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Reusable bulk "Export / Import" dropdown with matching export and import dialogs.
 *
 * Purely presentational: the host supplies the data-access callbacks
 * (already bound to an access token) and receives typed results back.
 *
 * @example
 * ```tsx
 * <BulkImportExport
 *   triggerLabel="Product Export/Import"
 *   onExport={({ format }) => qrProductApi.exportBulk(token, { format })}
 *   onImport={(file) => qrProductApi.importBulk(token, file)}
 *   onImported={refetch}
 * />
 * ```
 */
export function BulkImportExport({
  triggerLabel = 'Export/Import',
  exportActionLabel = 'Export',
  importActionLabel = 'Import',
  exportTitle = 'Export',
  exportDescription = 'Configure export options and select columns to include in your export file.',
  importTitle = 'Import',
  importDescription = 'Upload a file to import records. Supported formats: CSV or Excel.',
  fileFormats = ['csv', 'xlsx'],
  templateFormats = ['csv'],
  defaultExportFileName = 'export',
  templateFileName,
  columnOptions,
  defaultSelectedColumns,
  showStatusFilter = false,
  importAccept = '.csv,.xlsx,.xls',
  importHint = 'CSV or Excel (.csv, .xlsx, .xls)',
  disabled = false,
  exportFilters,
  onExport,
  onDownloadTemplate,
  onImport,
  onImported,
}: BulkImportExportProps) {
  const { toast } = useToast();

  // Export state
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportFileName, setExportFileName] = React.useState(defaultExportFileName);
  const [exportFileFormat, setExportFileFormat] = React.useState<BulkFileFormat>(
    fileFormats[0] ?? 'csv',
  );
  const [exportStatus, setExportStatus] = React.useState<BulkStatusFilter>('all');
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>(
    defaultSelectedColumns ?? columnOptions?.map((column) => column.id) ?? [],
  );

  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const supportsColumns = Boolean(columnOptions?.length);

  const resetExportState = React.useCallback(() => {
    setExportFileName(defaultExportFileName);
    setExportFileFormat(fileFormats[0] ?? 'csv');
    setExportStatus('all');
    setSelectedColumns(defaultSelectedColumns ?? columnOptions?.map((column) => column.id) ?? []);
  }, [columnOptions, defaultExportFileName, defaultSelectedColumns, fileFormats]);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
    );
  };

  const handleExportSubmit = async () => {
    if (supportsColumns && selectedColumns.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one column to export',
        variant: 'destructive',
      });
      return;
    }

    const fileName = exportFileName.trim() || defaultExportFileName;

    try {
      setIsExporting(true);
      const blob = await onExport({
        format: exportFileFormat,
        fileName,
        columns: selectedColumns,
        status: exportStatus,
      });

      triggerDownload(blob, `${fileName}.${exportFileFormat}`);
      toast({
        title: 'Success',
        description: `File "${fileName}.${exportFileFormat}" exported successfully`,
      });
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: getErrorMessage(error, 'Failed to export file'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async (format: BulkFileFormat) => {
    if (!onDownloadTemplate) return;
    try {
      const blob = await onDownloadTemplate(format);
      triggerDownload(blob, `${templateFileName ?? `${defaultExportFileName}-template`}.${format}`);
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: 'Download Failed',
        description: getErrorMessage(error, 'Failed to download the import template'),
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to import',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsImporting(true);
      const outcome = await onImport(selectedFile);

      // Close dialog and reset the file before toasting so the toast is not
      // unmounted together with the dialog.
      setIsImportDialogOpen(false);
      setSelectedFile(null);

      setTimeout(() => {
        const { totalRows, created, updated, failed } = outcome;
        const succeeded = created + updated;
        const message =
          totalRows > 0
            ? `${succeeded} of ${totalRows} row(s) processed successfully (${
                created
              } created, ${updated} updated)${failed > 0 ? `. ${failed} row(s) failed.` : '.'}`
            : 'Import completed successfully.';

        toast({ title: '✅ Import Successful', description: message });
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: { title: '✅ Import Successful', description: message },
          }),
        );
      }, 100);

      if (onImported) {
        setTimeout(() => onImported(), 1000);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: getErrorMessage(
          error,
          'Failed to import file. Please check the file format and try again.',
        ),
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={disabled}>
            {triggerLabel}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
            <Download className="h-4 w-4" />
            {exportActionLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            {importActionLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Dialog */}
      <Dialog
        open={isExportDialogOpen}
        onOpenChange={(open) => {
          setIsExportDialogOpen(open);
          if (open) resetExportState();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{exportTitle}</DialogTitle>
            <DialogDescription>{exportDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* File Name */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-export-file-name">File Name</Label>
              <Input
                id="bulk-export-file-name"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder={defaultExportFileName}
                disabled={isExporting}
              />
            </div>

            {/* File Format */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-export-file-format">File Format</Label>
              <Select
                value={exportFileFormat}
                onValueChange={(value) => setExportFileFormat(value as BulkFileFormat)}
                disabled={isExporting}
              >
                <SelectTrigger id="bulk-export-file-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {FORMAT_LABELS[format]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            {showStatusFilter && (
              <div className="grid gap-2">
                <Label htmlFor="bulk-export-status">Status</Label>
                <Select
                  value={exportStatus}
                  onValueChange={(value) => setExportStatus(value as BulkStatusFilter)}
                  disabled={isExporting}
                >
                  <SelectTrigger id="bulk-export-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom filters */}
            {exportFilters}

            {/* Column Selection */}
            {supportsColumns && (
              <div className="grid gap-3">
                <Label>Select Columns to Export</Label>
                <div className="grid grid-cols-2 gap-3 border rounded-md p-4">
                  {columnOptions!.map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bulk-col-${column.id}`}
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => handleColumnToggle(column.id)}
                        disabled={isExporting}
                      />
                      <Label
                        htmlFor={`bulk-col-${column.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isExporting && (
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg border border-muted">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="text-sm">
                <p className="font-medium">Exporting your data...</p>
                <p className="text-muted-foreground">
                  Please wait while we prepare your file for download.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportSubmit}
              disabled={isExporting || (supportsColumns && selectedColumns.length === 0)}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Export'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) setSelectedFile(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{importTitle}</DialogTitle>
            <DialogDescription>{importDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Template download */}
            {onDownloadTemplate && (
              <div className="flex items-center justify-between rounded-md border border-dashed p-3 bg-muted/40">
                <div className="text-sm">
                  <p className="font-medium">Need a template?</p>
                  <p className="text-muted-foreground">
                    Download the sample file to see the required format.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 ml-4">
                  {templateFormats.map((format) => (
                    <Button
                      key={format}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(format)}
                      disabled={isImporting}
                      className="gap-1.5"
                    >
                      <FileDown className="h-4 w-4" />
                      Sample {FORMAT_LABELS[format]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="bulk-file-upload" className="text-sm font-medium">
                Select File
              </Label>
              {!selectedFile ? (
                <label
                  htmlFor="bulk-file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-primary">Click to select file</span>
                  <span className="text-xs text-muted-foreground mt-1">{importHint}</span>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <Upload className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isImporting}
                  >
                    Change
                  </Button>
                </div>
              )}
              <input
                id="bulk-file-upload"
                type="file"
                accept={importAccept}
                onChange={handleFileChange}
                disabled={isImporting}
                className="hidden"
              />
            </div>

            {isImporting && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Uploading and processing...</p>
                  <p className="text-muted-foreground">
                    This may take a moment depending on file size.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} disabled={!selectedFile || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

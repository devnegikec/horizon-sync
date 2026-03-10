import * as React from 'react';

import { Upload, FileText, X, AlertTriangle, Download, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@horizon-sync/ui/components/ui/dialog';

// ------------------------------------------------------------------ //
//  Public types                                                       //
// ------------------------------------------------------------------ //

export interface ParseError {
  row: number;
  message: string;
}

export interface BulkUploadResult {
  total_rows: number;
  created: number;
  failed: number;
  errors: { row?: number; message: string }[];
}

export interface CsvImporterProps<T> {
  /** Parse raw CSV text into typed rows + validation errors */
  parseRows: (text: string) => { rows: T[]; errors: ParseError[] };
  /** Called with successfully parsed rows (form-based import, no onFileSelected) */
  onImport: (rows: T[]) => void;
  /**
   * If provided, the file is uploaded via this callback instead of calling onImport.
   * Must return a BulkUploadResult or throw on failure.
   */
  onFileSelected?: (file: File) => Promise<BulkUploadResult>;
  /** Human-readable hint shown next to the button */
  columnsHint?: string;
  /** Sample CSV content — if provided, shows a "Sample CSV" download button */
  sampleCsv?: string;
  /** Filename for the downloaded sample, defaults to "sample.csv" */
  sampleFileName?: string;
  /** Column definitions for the preview table */
  previewColumns?: { key: string; label: string }[];
  /** Called when the preview table is shown or hidden — useful to hide sibling UI */
  onPreviewChange?: (active: boolean) => void;
}

// ------------------------------------------------------------------ //
//  Helpers                                                            //
// ------------------------------------------------------------------ //

const MAX_PREVIEW_ROWS = 10;

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------ //
//  UploadResultDialog                                                 //
// ------------------------------------------------------------------ //

interface ResultSummaryProps {
  result: BulkUploadResult;
}

function ResultSummary({ result }: ResultSummaryProps) {
  return (
    <div className="space-y-3 pt-1">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-muted p-2">
          <div className="text-lg font-semibold">{result.total_rows}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="rounded bg-green-50 p-2">
          <div className="text-lg font-semibold text-green-700">{result.created}</div>
          <div className="text-xs text-green-600">Created</div>
        </div>
        <div className="rounded bg-red-50 p-2">
          <div className="text-lg font-semibold text-red-700">{result.failed}</div>
          <div className="text-xs text-red-600">Failed</div>
        </div>
      </div>
      {result.errors.length > 0 && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-2 space-y-1 max-h-40 overflow-y-auto">
          {result.errors.map((e, i) => (
            <div key={i} className="flex items-start gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>{e.row != null ? `Row ${e.row}: ` : ''}{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface UploadResultDialogProps {
  result: BulkUploadResult | null;
  error: string | null;
  onClose: () => void;
}

function UploadResultDialog({ result, error, onClose }: UploadResultDialogProps) {
  const open = result !== null || error !== null;
  const hasError = !!error || (result !== null && result.failed > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasError
              ? <XCircle className="h-5 w-5 text-destructive" />
              : <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {error ? 'Upload Failed' : result?.failed ? 'Upload Finished with Errors' : 'Upload Complete'}
          </DialogTitle>
          {result && (
            <DialogDescription asChild>
              <ResultSummary result={result} />
            </DialogDescription>
          )}
          {error && (
            <DialogDescription className="text-destructive text-sm pt-1">
              {error}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ //
//  PreviewTable                                                       //
// ------------------------------------------------------------------ //

interface PreviewTableProps {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  onConfirm: () => void;
  onCancel: () => void;
  uploading: boolean;
  fileName: string;
}

function PreviewTable({ rows, columns, onConfirm, onCancel, uploading, fileName }: PreviewTableProps) {
  const visibleRows = rows.slice(0, MAX_PREVIEW_ROWS);
  const extraCount = rows.length - visibleRows.length;

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>{fileName}</span>
          <span className="text-muted-foreground font-normal">
            — {rows.length} row{rows.length !== 1 ? 's' : ''} ready to upload
          </span>
        </div>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-1.5 whitespace-nowrap">
                    {String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {extraCount > 0 && (
        <p className="text-xs text-muted-foreground">
          + {extraCount} more row{extraCount !== 1 ? 's' : ''} not shown
        </p>
      )}

      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={onConfirm} disabled={uploading}>
          {uploading ? 'Uploading...' : `Upload ${rows.length} row${rows.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ //
//  Main component                                                     //
// ------------------------------------------------------------------ //

export function CsvImporter<T>({
  parseRows,
  onImport,
  onFileSelected,
  columnsHint,
  sampleCsv,
  sampleFileName = 'sample.csv',
  previewColumns,
  onPreviewChange,
}: CsvImporterProps<T>) {
  const [parseErrors, setParseErrors] = React.useState<ParseError[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingRows, setPendingRows] = React.useState<T[] | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseErrors([]);
    setPendingRows(null);
    setPendingFile(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseRows(text);
      setParseErrors(errors);
      if (rows.length === 0) return;
      setFileName(file.name);
      if (onFileSelected) {
        setPendingFile(file);
        setPendingRows(rows);
        onPreviewChange?.(true);
      } else {
        onImport(rows);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !onFileSelected) return;
    setUploading(true);
    try {
      const result = await onFileSelected(pendingFile);
      setUploadResult(result);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setPendingFile(null);
      setPendingRows(null);
      setFileName(null);
      onPreviewChange?.(false);
    }
  };

  const handleCancelPreview = () => {
    setPendingFile(null);
    setPendingRows(null);
    setFileName(null);
    setParseErrors([]);
    onPreviewChange?.(false);
  };

  const showPreview = pendingRows !== null && pendingRows.length > 0;

  // Derive preview columns: use provided ones, or fall back to object keys of first row
  const resolvedColumns: { key: string; label: string }[] = React.useMemo(() => {
    if (previewColumns) return previewColumns;
    if (pendingRows && pendingRows.length > 0) {
      return Object.keys(pendingRows[0] as object).map((k) => ({ key: k, label: k }));
    }
    return [];
  }, [previewColumns, pendingRows]);

  return (
    <div className="space-y-2">
      {!showPreview && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            Import CSV
          </Button>

          {sampleCsv && (
            <Button type="button" variant="ghost" size="sm" onClick={() => downloadCsv(sampleCsv, sampleFileName)}>
              <Download className="h-4 w-4 mr-1" />
              Sample CSV
            </Button>
          )}

          {fileName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              <FileText className="h-3 w-3" />
              <span>{fileName}</span>
            </div>
          )}

          {columnsHint && (
            <span className="text-xs text-muted-foreground">{columnsHint}</span>
          )}
        </div>
      )}

      <input ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange} />

      {parseErrors.length > 0 && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-2 space-y-1">
          {parseErrors.map((err) => (
            <div key={err.row} className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Row {err.row}: {err.message}</span>
            </div>
          ))}
        </div>
      )}

      {showPreview && fileName && (
        <PreviewTable rows={pendingRows as Record<string, unknown>[]}
          columns={resolvedColumns}
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelPreview}
          uploading={uploading}
          fileName={fileName} />
      )}

      <UploadResultDialog result={uploadResult}
        error={uploadError}
        onClose={() => { setUploadResult(null); setUploadError(null); }} />
    </div>
  );
}

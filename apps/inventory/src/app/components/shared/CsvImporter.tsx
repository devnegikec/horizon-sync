import * as React from 'react';

import { Upload, FileText, X, AlertTriangle, Download } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

export interface ParseError {
  row: number;
  message: string;
}

export interface CsvImporterProps<T> {
  /** Parse raw CSV text into typed rows + validation errors */
  parseRows: (text: string) => { rows: T[]; errors: ParseError[] };
  /** Called with successfully parsed rows */
  onImport: (rows: T[]) => void;
  /** If provided, also called with the raw File so callers can POST it to an API */
  onFileSelected?: (file: File) => void;
  /** Human-readable hint shown next to the button, e.g. "Columns: item_id, qty" */
  columnsHint?: string;
  /** Sample CSV content to download. If omitted, the Download button is hidden. */
  sampleCsv?: string;
  /** Filename for the downloaded sample, defaults to "sample.csv" */
  sampleFileName?: string;
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvImporter<T>({
  parseRows,
  onImport,
  onFileSelected,
  columnsHint,
  sampleCsv,
  sampleFileName = 'sample.csv',
}: CsvImporterProps<T>) {
  const [errors, setErrors] = React.useState<ParseError[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors: parseErrors } = parseRows(text);
      setErrors(parseErrors);
      if (rows.length > 0) onImport(rows);
    };
    reader.readAsText(file);
    onFileSelected?.(file);
    e.target.value = '';
  };

  const handleClear = () => {
    setFileName(null);
    setErrors([]);
  };

  return (
    <div className="space-y-2">
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
            <button type="button" onClick={handleClear} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {columnsHint && (
          <span className="text-xs text-muted-foreground">{columnsHint}</span>
        )}
      </div>

      <input ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}/>

      {errors.length > 0 && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-2 space-y-1">
          {errors.map((err) => (
            <div key={err.row} className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Row {err.row}: {err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import * as React from 'react';

import { CheckCircle2, FileUp, Upload, X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

/* ------------------------------------------------------------------ */
/*  Upload states                                                      */
/* ------------------------------------------------------------------ */

type UploadState = 'idle' | 'uploading' | 'success';

/* ------------------------------------------------------------------ */
/*  Drop zone                                                          */
/* ------------------------------------------------------------------ */

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-accent',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <FileUp className="h-7 w-7 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-medium">Drop your file here</p>
        <p className="text-sm text-muted-foreground mt-1">or click to browse · CSV files only</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */

function UploadProgress({ filename, progress }: { filename: string; progress: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate max-w-xs">{filename}</span>
        <span className="text-muted-foreground shrink-0 ml-2">{progress}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {progress < 100 ? 'Uploading and verifying...' : 'Verification complete'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Success state                                                      */
/* ------------------------------------------------------------------ */

function UploadSuccess({ filename, onReset }: { filename: string; onReset: () => void }) {
  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            File verified successfully
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5 truncate">
            {filename}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step component                                                     */
/* ------------------------------------------------------------------ */

interface StepUploadVerifyProps {
  warehouseName: string;
  onBack: () => void;
  onFinish: () => void;
}

export function StepUploadVerify({ warehouseName, onBack, onFinish }: StepUploadVerifyProps) {
  const [uploadState, setUploadState] = React.useState<UploadState>('idle');
  const [progress, setProgress] = React.useState(0);
  const [filename, setFilename] = React.useState('');

  const handleFileSelected = (file: File) => {
    setFilename(file.name);
    setUploadState('uploading');
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState('success');
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const handleReset = () => {
    setUploadState('idle');
    setProgress(0);
    setFilename('');
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload the completed template for{' '}
        <span className="font-medium text-foreground">{warehouseName}</span>. The system will
        verify the data and apply the physical counts.
      </p>

      {uploadState === 'idle' && (
        <DropZone onFileSelected={handleFileSelected} />
      )}

      {uploadState === 'uploading' && (
        <UploadProgress filename={filename} progress={progress} />
      )}

      {uploadState === 'success' && (
        <UploadSuccess filename={filename} onReset={handleReset} />
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={uploadState === 'uploading'}>
          Back
        </Button>
        <Button
          onClick={onFinish}
          disabled={uploadState !== 'success'}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Finish Reconciliation
        </Button>
      </div>
    </div>
  );
}

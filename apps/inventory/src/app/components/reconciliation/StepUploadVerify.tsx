import * as React from 'react';

import { CheckCircle2, FileUp, Loader2, Upload, X, AlertTriangle } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { useUploadReconciliation, useConfirmReconciliation } from '../../hooks/useReconciliation';
import type { ReconciliationUploadResponse, ReconciliationLineItem } from '../../types/reconciliation.types';

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) inputRef.current?.click();
    }
  };

  return (
    <div role="button"
      tabIndex={0}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-accent',
        disabled && 'pointer-events-none opacity-50',
      )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <FileUp className="h-7 w-7 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-medium">Drop your file here</p>
        <p className="text-sm text-muted-foreground mt-1">or click to browse · CSV files only</p>
      </div>
      <input ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Discrepancy preview table                                          */
/* ------------------------------------------------------------------ */

interface DiscrepancyPreviewProps {
  data: ReconciliationUploadResponse;
  onReset: () => void;
}

/** Safely resolve the items array regardless of field name the API uses */
function resolveItems(data: ReconciliationUploadResponse): ReconciliationLineItem[] {
  return data.items ?? data.line_items ?? [];
}

/** Normalise difference value — API may use `difference` or `qty_difference` */
function getDifference(li: ReconciliationLineItem): number {
  return li.difference ?? li.qty_difference ?? 0;
}

function getSystemQty(li: ReconciliationLineItem): number {
  return li.system_qty ?? li.current_qty ?? 0;
}

function getActualQty(li: ReconciliationLineItem): number {
  return li.actual_qty ?? li.qty ?? 0;
}

function DiscrepancyPreview({ data, onReset }: DiscrepancyPreviewProps) {
  const allItems = resolveItems(data);
  const discrepancies = allItems.filter((li) => getDifference(li) !== 0);
  const totalItems = data.total_items ?? data.items_count ?? allItems.length;
  const discrepancyCount = data.items_with_discrepancy ?? discrepancies.length;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              File verified{data.reconciliation_no ? ` — ${data.reconciliation_no}` : ''}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
              {totalItems} item(s) parsed · {discrepancyCount} discrepanc{discrepancyCount === 1 ? 'y' : 'ies'} found
            </p>
          </div>
          <button type="button"
            onClick={onReset}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
            aria-label="Remove uploaded file">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Discrepancy table */}
      {discrepancies.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Items with discrepancies
            </span>
          </div>
          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Item</th>
                  <th className="text-right px-4 py-2 font-medium">System Qty</th>
                  <th className="text-right px-4 py-2 font-medium">Actual Qty</th>
                  <th className="text-right px-4 py-2 font-medium">Difference</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((li) => (
                  <DiscrepancyRow key={li.id} item={li} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No discrepancies found — all counts match the system.
        </p>
      )}
    </div>
  );
}

function DiscrepancyRow({ item }: { item: ReconciliationLineItem }) {
  const diff = getDifference(item);
  const isPositive = diff > 0;
  return (
    <tr className="border-t">
      <td className="px-4 py-2">
        <div className="font-medium">{item.item_name ?? item.item_id}</div>
        <div className="text-xs text-muted-foreground">{item.item_code ?? ''}{item.uom ? ` · ${item.uom}` : ''}</div>
      </td>
      <td className="text-right px-4 py-2 tabular-nums">{getSystemQty(item)}</td>
      <td className="text-right px-4 py-2 tabular-nums">{getActualQty(item)}</td>
      <td className={cn(
          'text-right px-4 py-2 tabular-nums font-medium',
          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        )}>
        {isPositive ? '+' : ''}{diff}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Step component                                                     */
/* ------------------------------------------------------------------ */

interface StepUploadVerifyProps {
  warehouseName: string;
  warehouseId: string;
  /** null = create new reconciliation on upload, string = use existing draft */
  reconciliationId: string | null;
  onBack: () => void;
  onFinish: () => void;
}

export function StepUploadVerify({ warehouseName, warehouseId, reconciliationId, onBack, onFinish }: StepUploadVerifyProps) {
  const uploadMutation = useUploadReconciliation();
  const confirmMutation = useConfirmReconciliation();

  const [preview, setPreview] = React.useState<ReconciliationUploadResponse | null>(null);

  const handleFileSelected = (file: File) => {
    setPreview(null);
    uploadMutation.mutate(
      { warehouseId, file, reconciliationId: reconciliationId ?? undefined },
      { onSuccess: (data) => setPreview(data) },
    );
  };

  const handleReset = () => {
    setPreview(null);
    uploadMutation.reset();
  };

  const handleConfirm = () => {
    if (!preview) return;
    confirmMutation.mutate(preview.id, {
      onSuccess: () => onFinish(),
    });
  };

  const isUploading = uploadMutation.isPending;
  const isConfirming = confirmMutation.isPending;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload the completed template for{' '}
        <span className="font-medium text-foreground">{warehouseName}</span>. The system will
        compare actual counts against current stock and show discrepancies for review.
      </p>

      {/* Upload zone — show when no preview yet */}
      {!preview && !isUploading && (
        <DropZone onFileSelected={handleFileSelected} />
      )}

      {/* Uploading state */}
      {isUploading && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium">Uploading and verifying…</p>
        </div>
      )}

      {/* Discrepancy preview */}
      {preview && (
        <DiscrepancyPreview data={preview} onReset={handleReset} />
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isUploading || isConfirming}>
          Back
        </Button>
        <Button onClick={handleConfirm}
          disabled={!preview || isConfirming}
          className="gap-2">
          {isConfirming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isConfirming ? 'Confirming…' : 'Confirm & Apply Adjustments'}
        </Button>
      </div>
    </div>
  );
}

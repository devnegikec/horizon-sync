import * as React from 'react';

import { AlertTriangle, CheckCircle2, FileJson, Loader2, Upload } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import type { LayoutApplyResponse, LayoutExample, LayoutSummary } from '../../../types/layoutDesign.types';
import { useLayoutImport } from '../hooks/useLayoutImport';
import type { ImportAnalysis } from '../services/layoutImport';

import { LayoutDiagnosticsTable } from './LayoutDiagnosticsTable';
import { Preview3DToggle } from './LayoutDocumentPreview3D';

interface ImportLayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  /** Called after a successful apply so the parent can refresh the 3D view. */
  onApplied?: () => void;
}

const SUMMARY_FIELDS: Array<{ key: keyof LayoutSummary; label: string }> = [
  { key: 'zones', label: 'Zones' },
  { key: 'aisles', label: 'Aisles' },
  { key: 'lanes', label: 'Rack rows' },
  { key: 'bays', label: 'Bays' },
  { key: 'active_bays', label: 'Active bays' },
  { key: 'bins', label: 'Bins' },
  { key: 'obstacles', label: 'Obstacles' },
  { key: 'levels', label: 'Levels' },
];

// ─── Small building blocks ────────────────────────────────────────────────────

function SummaryGrid({ summary }: { summary: LayoutSummary }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {SUMMARY_FIELDS.map((field) => (
        <div key={field.key} className="rounded-md border bg-muted/20 p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{field.label}</p>
          <p className="text-sm font-semibold">{summary[field.key]}</p>
        </div>
      ))}
    </div>
  );
}

function SampleCodes({ paths }: { paths: string[] }) {
  if (paths.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Generated WMS codes</p>
      <div className="rounded-md border bg-muted/20 p-2 space-y-0.5">
        {paths.slice(0, 4).map((path) => (
          <p key={path} className="text-[11px] font-mono text-muted-foreground">
            {path}
          </p>
        ))}
      </div>
    </div>
  );
}

function FailureBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      {message}
    </div>
  );
}

function ImportResultBox({ result }: { result: LayoutApplyResponse }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 space-y-1">
      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" /> Layout applied
      </p>
      <p className="text-xs text-muted-foreground">
        {result.locations_created} locations created, {result.locations_updated} updated, {result.locations_deactivated} deactivated — {result.summary.bins} bins.
      </p>
    </div>
  );
}

/** The local compiler's verdict, plus the codes it produced. */
function VerdictPanel({ analysis }: { analysis: ImportAnalysis }) {
  return (
    <div className="space-y-3">
      <SummaryGrid summary={analysis.summary} />
      <SampleCodes paths={analysis.sampleBinPaths} />
      <Preview3DToggle document={analysis.document} />
      <LayoutDiagnosticsTable diagnostics={analysis.diagnostics} />
      {analysis.applyable && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> No blocking errors — ready to apply.
        </p>
      )}
    </div>
  );
}

interface SourceControlsProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileName: string | null;
  examples: LayoutExample[];
  pasted: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadExample: (name: string) => void;
  onPastedChange: (value: string) => void;
  onValidatePasted: () => void;
}

function SourceControls({
  inputRef,
  fileName,
  examples,
  pasted,
  onFileChange,
  onLoadExample,
  onPastedChange,
  onValidatePasted,
}: SourceControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={onFileChange} />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Choose JSON file
        </Button>
        {fileName !== null && <span className="text-xs text-muted-foreground truncate max-w-64">{fileName}</span>}
        {examples.map((example) => (
          <Button key={example.name} variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => onLoadExample(example.name)}>
            <FileJson className="h-3.5 w-3.5" /> {example.name}
          </Button>
        ))}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">…or paste the document</Label>
        <Textarea value={pasted} onChange={(event) => onPastedChange(event.target.value)} placeholder='{ "schemaVersion": 1, "warehouse": { … } }' className="font-mono text-xs h-24" />
        <Button variant="outline" size="sm" className="text-xs" disabled={pasted.trim().length === 0} onClick={onValidatePasted}>
          Validate pasted JSON
        </Button>
      </div>
    </div>
  );
}

interface ApplyOptionsProps {
  planName: string;
  replaceExisting: boolean;
  onPlanNameChange: (value: string) => void;
  onReplaceChange: (value: boolean) => void;
}

function ApplyOptions({ planName, replaceExisting, onPlanNameChange, onReplaceChange }: ApplyOptionsProps) {
  return (
    <div className="space-y-3 border-t pt-3">
      <div className="space-y-1">
        <Label className="text-xs">Plan name</Label>
        <Input value={planName} onChange={(event) => onPlanNameChange(event.target.value)} className="h-8 text-sm" />
      </div>
      <label htmlFor="layout-import-replace" className="flex items-start gap-2 text-xs">
        <Checkbox id="layout-import-replace" checked={replaceExisting} onCheckedChange={(value) => onReplaceChange(value === true)} className="mt-0.5" />
        <span>
          Deactivate locations this document does not contain.
          <span className="block text-muted-foreground">
            Locations are matched by path and updated in place, so bin ids and their stock are preserved.
          </span>
        </span>
      </label>
    </div>
  );
}

function ApplyButtonIcon({ busy }: { busy: boolean }) {
  return busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />;
}

/** Refresh templates when the dialog opens; drop the draft when it closes. */
function useDialogLifecycle(open: boolean, onOpen: () => void, onClose: () => void) {
  React.useEffect(() => {
    if (open) onOpen();
    else onClose();
  }, [open, onOpen, onClose]);
}

/** Read the chosen file, then clear the input so the same file can be re-picked. */
function fileChangeHandler(loadFile: (file: File) => Promise<void>) {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await loadFile(file);
  };
}

/** Apply stays disabled until the document is clean, named and idle. */
function canApplyDocument(analysis: ImportAnalysis | null, planName: string, applying: boolean): boolean {
  return Boolean(analysis?.applyable) && planName.trim().length > 0 && !applying;
}

/** Apply options matter only once a document is loaded and not yet applied. */
function showsApplyOptions(analysis: ImportAnalysis | null, result: LayoutApplyResponse | null): boolean {
  return analysis !== null && result === null;
}

/** A finished import offers Close; an unfinished one offers Cancel. */
function footerCloseLabel(result: LayoutApplyResponse | null): string {
  return result ? 'Close' : 'Cancel';
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

/**
 * Import a warehouse layout from a JSON document.
 *
 * The document is validated with the shared compiler *before* anything is sent, and
 * the server recompiles it on apply - so a clean preview here is a strong hint, but
 * the server's refusal (with its blocking rule code) always wins and is shown verbatim.
 *
 * Design ref: ../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md section 6
 */
export function ImportLayoutDialog({ open, onOpenChange, warehouseId, onApplied }: ImportLayoutDialogProps) {
  const {
    fileName,
    analysis,
    parseError,
    applying,
    result,
    serverDiagnostics,
    error,
    examples,
    loadFile,
    loadText,
    loadExample,
    refreshExamples,
    apply,
    reset,
  } = useLayoutImport({ warehouseId, onApplied });

  const [planName, setPlanName] = React.useState('Imported layout');
  // Off by default: it deactivates locations, and Apply submits whatever is ticked in the
  // same click, so enabling it by default made one ordinary click destructive.
  const [replaceExisting, setReplaceExisting] = React.useState(false);
  const [pasted, setPasted] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // The apply options belong to the draft, so they go when it goes - otherwise a
  // destructive tick from one import survives into the next one.
  const resetDraft = React.useCallback(() => {
    reset();
    setPlanName('Imported layout');
    setReplaceExisting(false);
    setPasted('');
  }, [reset]);

  useDialogLifecycle(open, refreshExamples, resetDraft);

  const handleFileChange = fileChangeHandler(loadFile);
  const canApply = canApplyDocument(analysis, planName, applying);
  const showOptions = showsApplyOptions(analysis, result);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import layout JSON</DialogTitle>
          <DialogDescription>
            Upload or paste a layout document. It is validated first — nothing is written until you apply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SourceControls inputRef={inputRef}
            fileName={fileName}
            examples={examples}
            pasted={pasted}
            onFileChange={handleFileChange}
            onLoadExample={loadExample}
            onPastedChange={setPasted}
            onValidatePasted={() => loadText(pasted)}/>

          {parseError !== null && <FailureBox message={parseError} />}
          {analysis !== null && <VerdictPanel analysis={analysis} />}
          {error !== null && <FailureBox message={error} />}
          {serverDiagnostics.length > 0 && <LayoutDiagnosticsTable diagnostics={serverDiagnostics} />}
          {result !== null && <ImportResultBox result={result} />}

          {showOptions && (
            <ApplyOptions planName={planName}
              replaceExisting={replaceExisting}
              onPlanNameChange={setPlanName}
              onReplaceChange={setReplaceExisting}/>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {footerCloseLabel(result)}
          </Button>
          {result === null && (
            <Button size="sm" className="gap-1.5" disabled={!canApply} onClick={() => apply(planName.trim(), replaceExisting)}>
              <ApplyButtonIcon busy={applying} />
              Apply layout
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

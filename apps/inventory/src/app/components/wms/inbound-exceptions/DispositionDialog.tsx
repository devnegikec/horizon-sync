import * as React from 'react';

import { PackageCheck, Pause, ShieldAlert, Trash2, Truck, type LucideIcon } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@horizon-sync/ui/components';

import type { BulkDispositionAction, InboundException } from '../../../types/wms.types';

import { EMPTY, exceptionIdentity } from './exceptionRows';

export interface DispositionActionOption {
  value: BulkDispositionAction;
  label: string;
  icon: LucideIcon;
  /** Destructive actions are styled apart in menus and buttons. */
  destructive?: boolean;
}

export const DISPOSITION_ACTIONS: DispositionActionOption[] = [
  { value: 'release_to_receiving', label: 'Release to receiving', icon: PackageCheck },
  { value: 'move_to_hold', label: 'Move to hold', icon: Pause },
  { value: 'move_to_quarantine', label: 'Move to quarantine', icon: ShieldAlert },
  { value: 'return_to_sender', label: 'Return to sender', icon: Truck },
  { value: 'dispose', label: 'Dispose', icon: Trash2, destructive: true },
];

export function dispositionLabel(action: BulkDispositionAction): string {
  return DISPOSITION_ACTIONS.find((option) => option.value === action)?.label ?? action;
}

/** Returning stock to the supplier and writing it off both need a written reason. */
export function requiresNote(action: BulkDispositionAction): boolean {
  return action === 'return_to_sender' || action === 'dispose';
}

/** The rows a decision applies to, plus the action chosen from the row menu. */
export interface DispositionTarget {
  exceptions: InboundException[];
  action: BulkDispositionAction;
}

export interface DispositionSubmission {
  action: BulkDispositionAction;
  note?: string;
  /** Only sent when re-releasing a single mis-labelled item. */
  itemId?: string;
}

export interface DispositionDialogProps {
  /** Rows the decision covers. `null` closes the dialog. */
  target: DispositionTarget | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (submission: DispositionSubmission) => Promise<void>;
}

function TargetSummary({ exceptions }: { exceptions: InboundException[] }) {
  const [first] = exceptions;
  if (!first) return null;

  const total = exceptions.reduce((sum, exception) => sum + (exception.quantity || 0), 0);
  const multiple = exceptions.length > 1;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
      <p className="font-medium">{exceptionIdentity(first)}</p>
      <p className="font-mono text-xs text-muted-foreground">{first.sku ?? EMPTY}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {exceptions.length} exception(s) · {total} unit(s) · Batch {first.batch_number ?? EMPTY}
      </p>
      {multiple && <p className="mt-1 text-xs text-muted-foreground">Applies to every unit in this batch.</p>}
    </div>
  );
}

/** The confirm button turns destructive only for the write-off / return decisions. */
function actionButtonVariant(action: BulkDispositionAction): 'destructive' | 'default' {
  return DISPOSITION_ACTIONS.some((option) => option.value === action && option.destructive) ? 'destructive' : 'default';
}

function noteLabelSuffix(required: boolean): string {
  return required ? '' : ' (optional)';
}

function submitLabel(busy: boolean, action: BulkDispositionAction): string {
  return busy ? 'Saving…' : dispositionLabel(action);
}

/** A corrected item is only meaningful when re-releasing one mis-labelled unit. */
function showsItemId(action: BulkDispositionAction, isSingle: boolean): boolean {
  return isSingle && action === 'release_to_receiving';
}

interface DispositionFieldsProps {
  action: BulkDispositionAction;
  note: string;
  itemId: string;
  showItemId: boolean;
  onActionChange: (value: BulkDispositionAction) => void;
  onNoteChange: (value: string) => void;
  onItemIdChange: (value: string) => void;
}

function DispositionFields({ action, note, itemId, showItemId, onActionChange, onNoteChange, onItemIdChange }: DispositionFieldsProps) {
  const noteRequired = requiresNote(action);

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="disposition-action">Action</Label>
        <Select value={action} onValueChange={(value) => onActionChange(value as BulkDispositionAction)}>
          <SelectTrigger id="disposition-action">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISPOSITION_ACTIONS.map(({ value, label, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="disposition-note">Reason{noteLabelSuffix(noteRequired)}</Label>
        <Textarea id="disposition-note"
          value={note}
          maxLength={2000}
          placeholder={noteRequired ? 'Required for return-to-sender and dispose' : 'Add context for the audit trail'}
          onChange={(event) => onNoteChange(event.target.value)}/>
      </div>

      {showItemId && (
        <div className="space-y-1">
          <Label htmlFor="disposition-item-id">Corrected SKU item ID</Label>
          <Input id="disposition-item-id"
            value={itemId}
            placeholder="Optional item UUID"
            onChange={(event) => onItemIdChange(event.target.value)}/>
        </div>
      )}
    </>
  );
}

interface DispositionFooterProps {
  action: BulkDispositionAction;
  busy: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DispositionFooter({ action, busy, canSubmit, onCancel, onConfirm }: DispositionFooterProps) {
  return (
    <DialogFooter>
      <Button variant="ghost" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button variant={actionButtonVariant(action)} disabled={!canSubmit || busy} onClick={onConfirm}>
        {submitLabel(busy, action)}
      </Button>
    </DialogFooter>
  );
}

/**
 * The form body. It is keyed to one target at a time, so every new decision
 * starts from a clean form seeded with the action picked in the row menu.
 */
function DispositionForm({
  target,
  onConfirm,
  onCancel,
}: {
  target: DispositionTarget;
  onConfirm: (submission: DispositionSubmission) => Promise<void>;
  onCancel: () => void;
}) {
  const [action, setAction] = React.useState<BulkDispositionAction>(target.action);
  const [note, setNote] = React.useState('');
  const [itemId, setItemId] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const exceptions = target.exceptions;
  const isSingle = exceptions.length === 1;
  const canSubmit = !requiresNote(action) || note.trim().length > 0;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm({
        action,
        note: note.trim() || undefined,
        itemId: showsItemId(action, isSingle) ? itemId.trim() || undefined : undefined,
      });
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disposition failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Record disposition</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <TargetSummary exceptions={exceptions} />

        <DispositionFields action={action}
          note={note}
          itemId={itemId}
          showItemId={showsItemId(action, isSingle)}
          onActionChange={setAction}
          onNoteChange={setNote}
          onItemIdChange={setItemId}/>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DispositionFooter action={action} busy={busy} canSubmit={canSubmit} onCancel={onCancel} onConfirm={handleConfirm}/>
    </DialogContent>
  );
}

/**
 * Disposition form. The decision itself is picked in the row menu, so the dialog
 * only collects the reason (and, for a single release, the corrected item) and
 * calls the disposition API before closing.
 */
export function DispositionDialog({ target, onOpenChange, onConfirm }: DispositionDialogProps) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      {target && (
        <DispositionForm key={target.exceptions[0]?.id}
          target={target}
          onConfirm={onConfirm}
          onCancel={() => onOpenChange(false)}/>
      )}
    </Dialog>
  );
}

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';

import { useReceivingSlip } from '../../../hooks/useWMS';
import type { ReceivingSlip } from '../../../types/wms.types';

import { discrepancyPhrases, slipDiscrepancies, type SlipDiscrepancies } from './slipDiscrepancies';

function SummaryNotice({ found }: { found: SlipDiscrepancies }) {
  if (found.flagged === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-700">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>No discrepancies flagged on this receipt.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{found.flagged} flagged line(s) on this receipt:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          {discrepancyPhrases(found).map((phrase) => (
            <li key={phrase}>{phrase}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Resolution state for the line detail behind the summary. */
function SummaryState({ loading, error }: { loading: boolean; error?: string | null }) {
  if (loading) return <p className="text-sm text-muted-foreground">Checking flagged lines…</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700">
        Discrepancy summary unavailable — {error}. Approve only if you have already reviewed the note.
      </div>
    );
  }
  return null;
}

export interface ApproveSlipDialogProps {
  /**
   * Slip being approved. `null` closes the dialog. List rows carry no lines, so
   * the full slip is fetched here to build the discrepancy summary.
   */
  slip: ReceivingSlip | null;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Approval is intentionally allowed with discrepancies present — the supervisor
 * sees exactly what will be accepted first. Shortages are flagged per line while
 * the slip is `pending_review`, so this dialog is the last chance to catch them.
 */
export function ApproveSlipDialog({ slip, submitting, onOpenChange, onConfirm }: ApproveSlipDialogProps) {
  // Shares the receiving-slip detail query, so a slip already opened in the
  // detail dialog is served from cache rather than fetched twice.
  const { slip: detail, loading, error } = useReceivingSlip(slip?.id ?? null);
  const found = slipDiscrepancies(detail);
  const showSummary = !loading && !error;

  return (
    <Dialog open={!!slip} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Approve receiving slip</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Approving <span className="font-mono font-medium text-foreground">{slip?.slip_number}</span> moves it to
            put-away and generates its put-away lists. The ASN expectation is never changed by this action.
          </p>

          <SummaryState loading={loading} error={error} />
          {showSummary && <SummaryNotice found={found} />}

          {showSummary && found.shortLines > 0 && (
            <p className="text-xs text-muted-foreground">
              Short units are never stocked. Any residual short stays open against the ASN until a later receipt covers
              it, or a manager writes it off with a reason code.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Approving…' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';

import { Loader2 } from 'lucide-react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';

import { useItems } from '../../hooks/useItems';
import type {
  MaterialRequest,
  MaterialRequestLine,
  MaterialRequestStatus,
} from '../../types/material-request.types';
import { materialRequestApi } from '../../utility/api';
import { formatDate } from '../../utility/formatDate';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MaterialRequestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialRequest: MaterialRequest | null;
}

type ItemMap = Record<string, { item_name?: string; item_code?: string }>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<MaterialRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  partially_quoted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  fully_quoted: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Line row (extracted to keep MRLineItemsTable complexity ≤ 10)     */
/* ------------------------------------------------------------------ */

function RequestedForCell({ line }: { line: MaterialRequestLine }) {
  if (!line.requested_for) return <span>—</span>;
  return (
    <div>
      <p className="text-sm">{line.requested_for}</p>
      {line.requested_for_department && (
        <p className="text-xs text-muted-foreground">{line.requested_for_department}</p>
      )}
    </div>
  );
}

function MRLineRow({ line, idx, itemMap }: { line: MaterialRequestLine; idx: number; itemMap: ItemMap }) {
  const item = itemMap[line.item_id];
  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{item?.item_name ?? '—'}</p>
          {item?.item_code && (
            <p className="text-xs text-muted-foreground font-mono">{item.item_code}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">{line.quantity}</TableCell>
      <TableCell>{line.uom ?? '—'}</TableCell>
      <TableCell>
        {line.required_date ? formatDate(line.required_date, 'DD-MMM-YY') : '—'}
      </TableCell>
      <TableCell className="text-right">
        {line.estimated_unit_cost != null ? Number(line.estimated_unit_cost).toFixed(2) : '—'}
      </TableCell>
      <TableCell><RequestedForCell line={line} /></TableCell>
      <TableCell className="text-muted-foreground text-sm">{line.description ?? '—'}</TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/*  Line items table                                                   */
/* ------------------------------------------------------------------ */

function MRLineItemsTable({ lines, itemMap }: { lines: MaterialRequestLine[]; itemMap: ItemMap }) {
  if (!lines || lines.length === 0) {
    return <p className="text-sm text-muted-foreground">No line items</p>;
  }
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>UOM</TableHead>
            <TableHead>Required Date</TableHead>
            <TableHead className="text-right">Est. Cost</TableHead>
            <TableHead>Requested For</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, idx) => (
            <MRLineRow key={line.id ?? idx} line={line} idx={idx} itemMap={itemMap} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Meta grid (extracted to keep main component complexity ≤ 10)      */
/* ------------------------------------------------------------------ */

function MRMetaGrid({ data }: { data: MaterialRequest }) {
  const statusColor = STATUS_COLORS[data.status as MaterialRequestStatus] ?? '';
  const priorityColor = PRIORITY_COLORS[data.priority] ?? '';
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border bg-muted/40 p-4 text-sm">
      <Field label="Request No" value={<code className="font-mono">{data.request_no}</code>} />
      <Field label="Status" value={<Badge className={statusColor} variant="secondary">{data.status.replace(/_/g, ' ')}</Badge>} />
      <Field label="Type" value={<span className="capitalize">{data.type}</span>} />
      <Field label="Priority" value={<Badge className={priorityColor} variant="secondary">{data.priority}</Badge>} />
      {data.department && <Field label="Department" value={data.department} />}
      {data.requested_by && <Field label="Requested By" value={data.requested_by} />}
      <Field label="Created" value={formatDate(data.created_at, 'DD-MMM-YY', true)} />
      <Field label="Updated" value={formatDate(data.updated_at, 'DD-MMM-YY', true)} />
      {data.notes && (
        <div className="col-span-2">
          <Field label="Notes" value={data.notes} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function MaterialRequestDetailDialog({
  open,
  onOpenChange,
  materialRequest,
}: MaterialRequestDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [fullDetails, setFullDetails] = React.useState<MaterialRequest | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { items } = useItems(1, 200);
  const itemMap = React.useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items],
  );

  React.useEffect(() => {
    if (open && materialRequest && accessToken) {
      setLoading(true);
      setError(null);
      materialRequestApi
        .getById(accessToken, materialRequest.id)
        .then((d) => setFullDetails(d as MaterialRequest))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load details'))
        .finally(() => setLoading(false));
    } else {
      setFullDetails(null);
    }
  }, [open, materialRequest, accessToken]);

  if (!materialRequest) return null;

  const data = fullDetails ?? materialRequest;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Material Request — {data.request_no}</DialogTitle>
          <DialogDescription>
            View complete information about this material request.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <MRMetaGrid data={data} />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Line Items ({data.line_items?.length ?? 0})
              </h3>
              <MRLineItemsTable lines={data.line_items ?? []} itemMap={itemMap} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

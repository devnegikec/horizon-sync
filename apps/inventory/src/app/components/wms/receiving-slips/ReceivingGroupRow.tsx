import * as React from 'react';

import { ChevronDown, ChevronRight, XCircle } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { useToast } from '@horizon-sync/ui/hooks';

import type { ReceivingSlipGroup } from '../../../types/wms.types';

import { FlagBadge } from './FlagBadge';

/* ------------------------------------------------------------------ */
/*  Expandable group row (parent_qseal + items)                       */
/* ------------------------------------------------------------------ */

export function ReceivingGroupRow({ group, boxIndex, totalBoxes, slipId, onRejectItem }: {
  group: ReceivingSlipGroup;
  boxIndex: number;
  totalBoxes: number;
  slipId: string;
  onRejectItem?: (slipId: string, itemId: string, reason: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = React.useState(false);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const sku = group.items[0]?.sku ?? '—';
  const qty = group.items.length;

  // Aggregate the group-level flag from its child items instead of just the
  // first item, so a single rejected child doesn't mark the whole group.
  const itemFlags = group.items.map((i) => i.flag ?? 'ok');
  const allRejected = itemFlags.length > 0 && itemFlags.every((f) => f === 'rejected');
  const anyRejected = itemFlags.some((f) => f === 'rejected');
  const groupFlag = allRejected ? 'rejected' : anyRejected ? 'mixed' : (group.items[0]?.flag ?? 'ok');

  const handleReject = async (item: any) => {
    if (!onRejectItem || !slipId) return;
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    setRejectingId(item.id);
    try {
      await onRejectItem(slipId, item.id, reason);
      toast({ title: 'Item rejected' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' });
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <>
      {/* Group (box) row */}
      <tr className="hover:bg-muted/20 cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}>
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1">
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            }
            <span className="font-medium">{group.product_name}</span>
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{sku}</td>
        <td className="px-4 py-2 font-mono text-xs">{group.parent_qseal.name}</td>
        <td className="px-4 py-2 text-center">
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {boxIndex}/{totalBoxes}
          </span>
        </td>
        <td className="px-4 py-2 text-center font-medium">{qty}</td>
        <td className="px-4 py-2"><FlagBadge flag={groupFlag} /></td>
        <td className="px-4 py-2" />{/* Actions placeholder */}
      </tr>

      {/* Expanded: individual item rows */}
      {expanded && group.items.map((item) => (
        <tr key={item.id} className="bg-muted/20">
          <td className="px-4 py-1.5 pl-10">
            <span className="font-mono text-xs font-medium">{item.serial_number}</span>
          </td>
          <td className="px-4 py-1.5 text-xs text-muted-foreground" colSpan={4}>
            <span className="inline-flex gap-3">
              <span>SKU: <span className="font-mono">{item.sku}</span></span>
              {item.manufacturing_date && (
                <span>Mfg: {new Date(item.manufacturing_date).toLocaleDateString()}</span>
              )}
              {item.expiry_date && (
                <span>Exp: {new Date(item.expiry_date).toLocaleDateString()}</span>
              )}
            </span>
          </td>
          <td className="px-2 py-1.5 text-right">
            {onRejectItem && item.flag !== 'rejected' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                disabled={rejectingId === item.id}
                onClick={(e) => { e.stopPropagation(); handleReject(item); }}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                {rejectingId === item.id ? '...' : 'Reject'}
              </Button>
            )}
            {item.flag === 'rejected' && (
              <span className="text-xs text-destructive font-medium">Rejected</span>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}

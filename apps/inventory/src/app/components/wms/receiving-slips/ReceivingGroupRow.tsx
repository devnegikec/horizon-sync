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
  const flag = group.items[0]?.flag ?? 'ok';
  const qty = group.items.length;

  const handleReject = async (item: any) => {
    if (!onRejectItem || !slipId) return;
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    setRejectingId(item.id);
    try {
      await onRejectItem(slipId, item.serial_number || item.id, reason);
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
        <td className="px-4 py-2"><FlagBadge flag={flag} /></td>
        <td className="px-4 py-2" />{/* Actions placeholder */}
      </tr>

      {/* Expanded: individual item rows */}
      {expanded && group.items.map((item) => (
        <tr key={item.id} className="bg-muted/20">
          <td className="px-4 py-1.5 pl-10">
            <span className="font-mono text-xs font-medium">{item.serial_number}</span>
          </td>
          <td className="px-4 py-1.5 font-mono text-xs">{item.sku}</td>
          <td className="px-4 py-1.5 font-mono text-xs">{item.batch_number}</td>
          <td className="px-4 py-1.5 text-center font-mono text-xs">{item.box_count}</td>
          <td className="px-4 py-1.5 text-center font-mono text-xs">{item.quantity}</td>
          <td className="px-4 py-1.5"><FlagBadge flag={item.flag} /></td>
        </tr>
      ))}
    </>
  );
}

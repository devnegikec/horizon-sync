import * as React from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type { ReceivingSlipGroup } from '../../../types/wms.types';

import { FlagBadge } from './FlagBadge';

/* ------------------------------------------------------------------ */
/*  Expandable group row (parent_qseal + items)                       */
/* ------------------------------------------------------------------ */

export function ReceivingGroupRow({ group, boxIndex, totalBoxes }: {
  group: ReceivingSlipGroup;
  boxIndex: number;
  totalBoxes: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const sku = group.items[0]?.sku ?? '—';
  const flag = group.items[0]?.flag ?? 'ok';
  const qty = group.items.length;

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
      </tr>

      {/* Expanded: individual item rows */}
      {expanded && group.items.map((item) => (
        <tr key={item.id} className="bg-muted/20">
          <td className="px-4 py-1.5 pl-10">
            <span className="font-mono text-xs font-medium">{item.serial_number}</span>
          </td>
          <td className="px-4 py-1.5 text-xs text-muted-foreground" colSpan={5}>
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
        </tr>
      ))}
    </>
  );
}

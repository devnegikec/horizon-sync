import type { ReceivingSlipGroup } from '../../../types/wms.types';

import { ReceivingGroupRow } from './ReceivingGroupRow';

/* ------------------------------------------------------------------ */
/*  Groups table                                                      */
/* ------------------------------------------------------------------ */

export function ReceivingGroupsTable({ groups, slipId, onRejectItem, onExceptionCreated }: {
  groups: ReceivingSlipGroup[];
  slipId: string;
  onRejectItem?: (slipId: string, itemId: string, reason: string) => Promise<void>;
  onExceptionCreated?: () => void;
}) {
  if (groups.length === 0) {
    return <p className="px-4 py-6 text-center text-muted-foreground text-xs">No items</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/30">
        <tr>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Product Name</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
          <th className="text-center px-4 py-2 font-medium text-muted-foreground">Box</th>
          <th className="text-center px-4 py-2 font-medium text-muted-foreground">Qty</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Flag</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Condition</th>
          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {groups.map((group, idx) => (
          <ReceivingGroupRow key={group.parent_qseal?.id ?? `group-${idx}`}
            group={group}
            boxIndex={idx + 1}
            totalBoxes={groups.length}
            slipId={slipId}
            onRejectItem={onRejectItem}
            onExceptionCreated={onExceptionCreated} />
        ))}
      </tbody>
    </table>
  );
}

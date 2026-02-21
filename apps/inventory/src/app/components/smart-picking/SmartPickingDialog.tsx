import * as React from 'react';

import { AlertTriangle, ClipboardList, Loader2, Package, Warehouse } from 'lucide-react';

import { Badge, Button } from '@horizon-sync/ui/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useSuggestAllocation, useCreatePickList } from '../../hooks/useSmartPicking';
import type { SalesOrder } from '../../types/sales-order.types';
import type { SmartPickAllocation } from '../../types/smart-picking.types';

interface SmartPickingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onSuccess?: (pickListId: string) => void;
}

export function SmartPickingDialog({
  open,
  onOpenChange,
  salesOrder,
  onSuccess,
}: SmartPickingDialogProps) {
  const { data, loading: loadingSuggestions, error: suggestError, fetchSuggestions } = useSuggestAllocation();
  const { createPickList, loading: creating, error: createError } = useCreatePickList();

  const [editedAllocations, setEditedAllocations] = React.useState<SmartPickAllocation[]>([]);
  const [remarks, setRemarks] = React.useState('');

  // Fetch suggestions when dialog opens
  React.useEffect(() => {
    if (open && salesOrder) {
      fetchSuggestions(salesOrder.id);
      setRemarks('');
    }
  }, [open, salesOrder, fetchSuggestions]);

  // Sync suggestions to editable allocations
  React.useEffect(() => {
    if (data?.suggestions) {
      setEditedAllocations(
        data.suggestions.map((s) => ({
          item_id: s.item_id,
          warehouse_id: s.warehouse_id,
          qty: s.suggested_qty,
          uom: s.uom,
        })),
      );
    }
  }, [data]);

  const handleQtyChange = (index: number, newQty: number) => {
    setEditedAllocations((prev) => {
      const updated = [...prev];
      const maxAvailable = data?.suggestions[index]?.current_available ?? newQty;
      updated[index] = { ...updated[index], qty: Math.max(0, Math.min(newQty, maxAvailable)) };
      return updated;
    });
  };

  const handleCreate = async () => {
    if (!salesOrder) return;
    const validAllocations = editedAllocations.filter((a) => a.qty > 0);
    if (validAllocations.length === 0) return;

    try {
      const result = await createPickList(salesOrder.id, validAllocations, remarks);
      if (result) {
        onSuccess?.(result.id);
        onOpenChange(false);
      }
    } catch {
      // error handled by hook
    }
  };

  const validCount = editedAllocations.filter((a) => a.qty > 0).length;
  const error = suggestError || createError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Smart Picking — {salesOrder?.sales_order_no}
          </DialogTitle>
          <DialogDescription>
            Review warehouse allocations and create a pick list. Quantities can be adjusted before confirming.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

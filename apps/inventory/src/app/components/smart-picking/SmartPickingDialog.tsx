import * as React from 'react';

import { AlertTriangle, ClipboardList, Loader2, Package, Warehouse } from 'lucide-react';

import { Badge, Button } from '@horizon-sync/ui/components';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useSuggestAllocation, useCreatePickList } from '../../hooks/useSmartPicking';
import type { SalesOrder } from '../../types/sales-order.types';
import type { AllocationSuggestionItem, SmartPickAllocation, UnallocatedItem } from '../../types/smart-picking.types';

/* ---- Sub-components (keeps main function complexity low) ---- */

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">Loading allocation suggestions…</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-center gap-2 text-destructive text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

function UnallocatedWarning({ items }: { items: UnallocatedItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-md border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Insufficient Stock</p>
          <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-400 space-y-0.5">
            {items.map((item) => (
              <li key={item.item_id}>
                {item.item_name} ({item.item_code}) — short by {item.short_qty} {item.uom}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface SuggestionRowProps {
  suggestion: AllocationSuggestionItem;
  allocatedQty: number;
  onQtyChange: (qty: number) => void;
}

function SuggestionRow({ suggestion, allocatedQty, onQtyChange }: SuggestionRowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">{suggestion.item_name}</p>
            <p className="text-xs text-muted-foreground">{suggestion.item_code}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p>{suggestion.warehouse_name}</p>
            <p className="text-xs text-muted-foreground">{suggestion.warehouse_code}</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-right tabular-nums">{suggestion.current_available}</td>
      <td className="p-3 text-right tabular-nums">
        <Badge variant="secondary">{Number(suggestion.suggested_qty)}</Badge>
      </td>
      <td className="p-3 text-right">
        <Input type="number"
          className="w-24 ml-auto text-right tabular-nums"
          value={allocatedQty}
          onChange={(e) => onQtyChange(Number(e.target.value))}
          min={0}
          max={suggestion.current_available}
          step={1} />
      </td>
      <td className="p-3 text-muted-foreground">{suggestion.uom}</td>
    </tr>
  );
}

interface AllocationTableProps {
  suggestions: AllocationSuggestionItem[];
  allocations: SmartPickAllocation[];
  onQtyChange: (index: number, qty: number) => void;
}

function AllocationTable({ suggestions, allocations, onQtyChange }: AllocationTableProps) {
  if (suggestions.length === 0) return null;
  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Item</th>
            <th className="text-left p-3 font-medium">Warehouse</th>
            <th className="text-right p-3 font-medium">Available</th>
            <th className="text-right p-3 font-medium">Suggested</th>
            <th className="text-right p-3 font-medium w-32">Allocate</th>
            <th className="text-left p-3 font-medium">UOM</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((suggestion, index) => (
            <SuggestionRow key={`${suggestion.item_id}-${suggestion.warehouse_id}-${index}`}
              suggestion={suggestion}
              allocatedQty={allocations[index]?.qty ?? Number(suggestion.suggested_qty)}
              onQtyChange={(qty) => onQtyChange(index, qty)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Dialog body (extracted to reduce main function complexity) ---- */

interface DialogBodyProps {
  data: ReturnType<typeof useSuggestAllocation>['data'];
  loadingSuggestions: boolean;
  error: string | null;
  editedAllocations: SmartPickAllocation[];
  remarks: string;
  onRemarksChange: (v: string) => void;
  onQtyChange: (index: number, qty: number) => void;
}

function DialogBody({ data, loadingSuggestions, error, editedAllocations, remarks, onRemarksChange, onQtyChange }: DialogBodyProps) {
  if (loadingSuggestions) return <LoadingState />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  const hasSuggestions = data.suggestions.length > 0;
  const hasUnallocated = data.unallocated.length > 0;

  if (!hasSuggestions && !hasUnallocated) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No items require allocation for this sales order.
      </div>
    );
  }

  return (
    <>
      <UnallocatedWarning items={data.unallocated} />
      <AllocationTable suggestions={data.suggestions}
        allocations={editedAllocations}
        onQtyChange={onQtyChange} />
      {hasSuggestions && (
        <div className="space-y-2">
          <Label htmlFor="pick-remarks">Remarks (optional)</Label>
          <Textarea id="pick-remarks"
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            rows={2}
            placeholder="Notes for the pick list…" />
        </div>
      )}
    </>
  );
}

/* ---- Main dialog ---- */

interface SmartPickingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onSuccess?: (pickListId: string) => void;
}

export function SmartPickingDialog({ open, onOpenChange, salesOrder, onSuccess }: SmartPickingDialogProps) {
  const { data, loading: loadingSuggestions, error: suggestError, fetchSuggestions } = useSuggestAllocation();
  const { createPickList, loading: creating, error: createError } = useCreatePickList();

  const [editedAllocations, setEditedAllocations] = React.useState<SmartPickAllocation[]>([]);
  const [remarks, setRemarks] = React.useState('');

  React.useEffect(() => {
    if (open && salesOrder) {
      fetchSuggestions(salesOrder.id);
      setRemarks('');
      setEditedAllocations([]);
    }
  }, [open, salesOrder, fetchSuggestions]);

  React.useEffect(() => {
    if (data?.suggestions) {
      setEditedAllocations(
        data.suggestions.map((s) => ({
          item_id: s.item_id,
          warehouse_id: s.warehouse_id,
          qty: Number(s.suggested_qty),
          uom: s.uom,
        })),
      );
    }
  }, [data]);

  const handleQtyChange = React.useCallback((index: number, newQty: number) => {
    setEditedAllocations((prev) => {
      const updated = [...prev];
      const maxAvailable = data?.suggestions[index]?.current_available ?? newQty;
      updated[index] = { ...updated[index], qty: Math.max(0, Math.min(newQty, maxAvailable)) };
      return updated;
    });
  }, [data]);

  const handleCreate = React.useCallback(async () => {
    if (!salesOrder) return;
    const valid = editedAllocations.filter((a) => a.qty > 0);
    if (valid.length === 0) return;
    try {
      const result = await createPickList(salesOrder.id, valid, remarks);
      if (result) {
        onSuccess?.(result.id);
        onOpenChange(false);
      }
    } catch { /* hook shows toast */ }
  }, [salesOrder, editedAllocations, remarks, createPickList, onSuccess, onOpenChange]);

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

        <DialogBody data={data}
          loadingSuggestions={loadingSuggestions}
          error={error}
          editedAllocations={editedAllocations}
          remarks={remarks}
          onRemarksChange={setRemarks}
          onQtyChange={handleQtyChange} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>Cancel</Button>
          <Button onClick={handleCreate}
            disabled={creating || loadingSuggestions || validCount === 0}
            className="gap-2">
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? 'Creating…' : `Create Pick List (${validCount} items)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

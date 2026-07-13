import * as React from 'react';

import { AlertCircle, Calendar, ClipboardList, FileText, Hash, MessageSquare, Warehouse } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@horizon-sync/ui/components';

import type { PickList, PickListStatus } from '../../types/pick-list.types';
import { pickListApi } from '../../utility/api/pick-lists';

import { PickListStatusBadge } from './PickListStatusBadge';

interface PickListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickList: PickList | null;
  onSaved?: () => void;
}

const STATUS_OPTIONS: { value: PickListStatus; label: string; description: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Pick list is being prepared' },
  { value: 'in_progress', label: 'In Progress', description: 'Items are being picked' },
  { value: 'completed', label: 'Completed', description: 'All items have been picked' },
  { value: 'cancelled', label: 'Cancelled', description: 'Pick list has been cancelled' },
];

function getAvailableStatuses(currentStatus: PickListStatus): PickListStatus[] {
  switch (currentStatus) {
    case 'draft':
      return ['draft', 'in_progress', 'completed', 'cancelled'];
    case 'in_progress':
      return ['in_progress', 'completed', 'cancelled'];
    case 'completed':
      return ['completed'];
    case 'cancelled':
      return ['cancelled'];
    default:
      return [currentStatus];
  }
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InlineAlert({ variant = 'default', children }: { variant?: 'default' | 'destructive'; children: React.ReactNode }) {
  const isDestructive = variant === 'destructive';
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 ${isDestructive ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/50'}`}>
      <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${isDestructive ? 'text-destructive' : ''}`} />
      <p className={`text-sm ${isDestructive ? 'text-destructive' : ''}`}>{children}</p>
    </div>
  );
}

function PickListInfoPanel({ pickList }: { pickList: PickList }) {
  const itemsCount = pickList.items?.length ?? 0;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pick List Details</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" /> Pick List #
          </Label>
          <p className="text-sm font-mono font-medium">{pickList.pick_list_no}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Current Status
          </Label>
          <PickListStatusBadge status={pickList.status} />
        </div>
        {pickList.sales_order_no && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Sales Order
            </Label>
            <p className="text-sm font-mono font-medium">{pickList.sales_order_no}</p>
          </div>
        )}
        {pickList.warehouse?.name && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Warehouse className="h-3.5 w-3.5" /> Warehouse
            </Label>
            <p className="text-sm font-medium">{pickList.warehouse.name}</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Pick Date
          </Label>
          <p className="text-sm">{formatDateTime(pickList.pick_date)}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Items</Label>
          <p className="text-sm">{itemsCount} item{itemsCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {pickList.remarks && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Remarks
          </Label>
          <p className="text-sm">{pickList.remarks}</p>
        </div>
      )}
    </div>
  );
}

function StatusChangeWarnings({ selectedStatus, currentStatus }: { selectedStatus: PickListStatus; currentStatus: PickListStatus }) {
  if (selectedStatus === 'completed' && currentStatus !== 'completed') {
    return (
      <InlineAlert>
        Marking as completed indicates all items have been picked. Consider creating a delivery note instead for proper stock deduction.
      </InlineAlert>
    );
  }
  if (selectedStatus === 'cancelled' && currentStatus !== 'cancelled') {
    return (
      <InlineAlert variant="destructive">
        Cancelling this pick list will prevent further processing. This action may affect stock reservations.
      </InlineAlert>
    );
  }
  return null;
}

function StatusEditor({
  pickList,
  selectedStatus,
  onStatusChange,
}: {
  pickList: PickList;
  selectedStatus: PickListStatus;
  onStatusChange: (status: PickListStatus) => void;
}) {
  const isLocked = pickList.status === 'completed' || pickList.status === 'cancelled';
  const availableStatuses = getAvailableStatuses(pickList.status);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Update Status</h4>

      {isLocked ? (
        <InlineAlert>
          This pick list is <span className="font-semibold">{pickList.status.replace('_', ' ')}</span> and cannot be modified.
        </InlineAlert>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="pick-list-status">New Status *</Label>
          <Select value={selectedStatus} onValueChange={(v) => onStatusChange(v as PickListStatus)}>
            <SelectTrigger id="pick-list-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.filter((opt) => availableStatuses.includes(opt.value)).map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.value === pickList.status}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <StatusChangeWarnings selectedStatus={selectedStatus} currentStatus={pickList.status} />
    </div>
  );
}

function parseErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) return String((err as { message: string }).message);
  return 'Failed to update pick list';
}

export function PickListDialog({ open, onOpenChange, pickList, onSaved }: PickListDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);

  const [selectedStatus, setSelectedStatus] = React.useState<PickListStatus>('draft');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && pickList) {
      setSelectedStatus(pickList.status);
      setError(null);
    }
  }, [open, pickList]);

  if (!pickList) return null;

  const hasStatusChange = selectedStatus !== pickList.status;
  const isLocked = pickList.status === 'completed' || pickList.status === 'cancelled';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasStatusChange) { setError('No changes to save'); return; }
    if (!accessToken) { setError('Not authenticated'); return; }

    setSaving(true);
    setError(null);
    try {
      await pickListApi.updateStatus(accessToken, pickList.id, { status: selectedStatus });
      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      setError(parseErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Pick List</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <PickListInfoPanel pickList={pickList} />
            <Separator />
            <StatusEditor pickList={pickList} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />

            {error && <InlineAlert variant="destructive">{error}</InlineAlert>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !hasStatusChange || isLocked}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';

import { AlertCircle } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import type { PickList, PickListStatus } from '../../types/pick-list.types';

interface EditPickListStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickList: PickList | null;
  onUpdateStatus: (pickListId: string, newStatus: PickListStatus) => Promise<void>;
  updating: boolean;
}

const STATUS_OPTIONS: { value: PickListStatus; label: string; description: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Pick list is being prepared' },
  { value: 'in_progress', label: 'In Progress', description: 'Items are being picked' },
  { value: 'completed', label: 'Completed', description: 'All items have been picked' },
  { value: 'cancelled', label: 'Cancelled', description: 'Pick list has been cancelled' },
];

function StatusChangeAlerts({ selectedStatus, currentStatus }: { selectedStatus: string; currentStatus: PickListStatus }) {
  if (selectedStatus === 'completed' && currentStatus !== 'completed') {
    return (
      <div className="flex items-start gap-2 rounded-lg border p-3 bg-muted/50">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <p className="text-sm">
          Marking as completed indicates all items have been picked. Consider creating a delivery note instead.
        </p>
      </div>
    );
  }
  if (selectedStatus === 'cancelled' && currentStatus !== 'cancelled') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/50 p-3 bg-destructive/5">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
        <p className="text-sm text-destructive">
          Cancelling this pick list will prevent further processing. This action may affect stock reservations.
        </p>
      </div>
    );
  }
  return null;
}

function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 p-3 bg-destructive/5">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

export function EditPickListStatusDialog({
  open,
  onOpenChange,
  pickList,
  onUpdateStatus,
  updating,
}: EditPickListStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<PickListStatus | ''>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && pickList) {
      setSelectedStatus(pickList.status);
      setError(null);
    } else {
      setSelectedStatus('');
      setError(null);
    }
  }, [open, pickList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickList || !selectedStatus) { setError('Please select a status'); return; }
    if (selectedStatus === pickList.status) { setError('Please select a different status'); return; }

    try {
      setError(null);
      await onUpdateStatus(pickList.id, selectedStatus);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (!pickList) return null;

  const selectedOption = STATUS_OPTIONS.find((opt) => opt.value === selectedStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Pick List Status</DialogTitle>
            <DialogDescription>
              Update the status of pick list <span className="font-mono font-semibold">{pickList.pick_list_no}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Status */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Current Status</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium capitalize">{pickList.status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* New Status */}
            <div className="space-y-2">
              <Label htmlFor="status">New Status *</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as PickListStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} disabled={option.value === pickList.status}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOption && selectedOption.value !== pickList.status && (
                <p className="text-xs text-muted-foreground">{selectedOption.description}</p>
              )}
            </div>

            <StatusChangeAlerts selectedStatus={selectedStatus} currentStatus={pickList.status} />
            <ErrorAlert message={error} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
              Cancel
            </Button>
            <Button type="submit" disabled={updating || !selectedStatus || selectedStatus === pickList.status}>
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';
import { Layers, Hash, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';

import type { ItemGroupListItem } from '../../types/item-group.types';

interface ItemGroupDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemGroup: ItemGroupListItem | null;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function ItemGroupDetailDialog({ open, onOpenChange, itemGroup }: ItemGroupDetailDialogProps) {
  if (!itemGroup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{itemGroup.name}</DialogTitle>
                <Badge variant={itemGroup.is_active ? 'success' : 'secondary'}>
                  {itemGroup.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{itemGroup.code}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-3">Group Details</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={Hash} label="Code" value={itemGroup.code} />
              <InfoRow icon={Layers} label="Parent Group" value={itemGroup.parent_id || 'None'} />
              <InfoRow icon={FileText} label="Valuation Method" value={itemGroup.default_valuation_method || 'Default'} />
              <InfoRow icon={Calendar} label="Created At" value={new Date(itemGroup.created_at).toLocaleDateString()} />
            </div>
          </div>

          {itemGroup.description && (
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {itemGroup.description}
              </p>
            </div>
          )}

          <div className="rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-3">Status Information</h4>
            <div className="flex items-center gap-3">
              {itemGroup.is_active ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                This group is currently {itemGroup.is_active ? 'active' : 'inactive'} and {itemGroup.is_active ? 'can' : 'cannot'} be used for new items.
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

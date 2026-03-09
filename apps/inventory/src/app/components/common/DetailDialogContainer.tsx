import * as React from 'react';

import type { LucideIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';

import { StatusBadge } from '../quotations/StatusBadge';

export interface DetailDialogContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  status: string;
  children: React.ReactNode;
}

export function DetailDialogContainer({ open, onOpenChange, icon: Icon, title, status, children }: DetailDialogContainerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            {title}
            <StatusBadge status={status} />
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

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
  /** Optional subtitle rendered below the title */
  subtitle?: React.ReactNode;
  /** Override DialogContent className (defaults to full-screen-ish) */
  contentClassName?: string;
  /** Override DialogHeader className */
  headerClassName?: string;
  /** Extra elements rendered to the right of the title row */
  headerActions?: React.ReactNode;
  /** Custom status badge renderer — defaults to StatusBadge */
  statusBadge?: React.ReactNode;
  children: React.ReactNode;
}

const DEFAULT_CONTENT_CLASS = 'w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto';

export function DetailDialogContainer({
  open,
  onOpenChange,
  icon: Icon,
  title,
  status,
  subtitle,
  contentClassName,
  headerClassName,
  headerActions,
  statusBadge,
  children,
}: DetailDialogContainerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName ?? DEFAULT_CONTENT_CLASS}>
        <DialogHeader className={headerClassName}>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {title}
                {statusBadge ?? <StatusBadge status={status} />}
              </DialogTitle>
              {subtitle}
            </div>
            {headerActions}
          </div>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

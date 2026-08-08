import * as React from 'react';

import { Loader2 } from 'lucide-react';

import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<DialogSize, string> = {
  sm: 'sm:max-w-[500px] max-h-[90vh] flex flex-col',
  md: 'max-w-2xl max-h-[90vh] flex flex-col',
  lg: 'max-w-4xl max-h-[90vh] flex flex-col',
  xl: 'max-w-5xl max-h-[90vh] flex flex-col',
  full: 'w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col',
};

export interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  size?: DialogSize;
  loading?: boolean;
  loadingMessage?: string;
  /** Override the entire footer. */
  footer?: React.ReactNode;
  /** When true, a "Close" button is rendered in the footer. Defaults to true. */
  showCloseButton?: boolean;
  closeLabel?: string;
  children: React.ReactNode;
  contentClassName?: string;
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  size = 'lg',
  loading = false,
  loadingMessage,
  footer,
  showCloseButton = true,
  closeLabel = 'Close',
  children,
  contentClassName,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName ?? sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            {loadingMessage && (
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            )}
          </div>
        )}

        {!loading && (
          <div className="flex-1 overflow-y-auto">{children}</div>
        )}

        {footer !== undefined ? (
          <DialogFooter>{footer}</DialogFooter>
        ) : showCloseButton ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {closeLabel}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

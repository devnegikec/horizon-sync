import * as React from 'react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<DialogSize, string> = {
  sm: 'sm:max-w-[500px] max-h-[90vh] overflow-y-auto',
  md: 'max-w-2xl max-h-[90vh] overflow-y-auto',
  lg: 'max-w-4xl max-h-[90vh] overflow-y-auto',
  xl: 'max-w-5xl max-h-[90vh] overflow-y-auto',
  full: 'w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto',
};

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: DialogSize;
  /** When provided, wraps children in a <form> and renders Cancel + Submit in the footer. */
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  /** Extra buttons rendered before the default Cancel/Submit pair. */
  footerExtra?: React.ReactNode;
  /** Completely override the footer. When set, onSubmit/submitLabel/cancelLabel are ignored. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  size = 'lg',
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  saving = false,
  footerExtra,
  footer,
  children,
  contentClassName,
}: FormDialogProps) {
  const body = (
    <>
      {children}

      {footer !== undefined ? (
        footer
      ) : onSubmit ? (
        <DialogFooter>
          {footerExtra}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </Button>
        </DialogFooter>
      ) : null}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName ?? sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="space-y-6">
            {body}
          </form>
        ) : (
          body
        )}
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';

import { Building2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

import { OrganizationForm, type OrganizationFormData } from './OrganizationForm';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrganizationFormData & { logoUrl: string }) => Promise<void>;
  title?: string;
  description?: string;
  /** When provided, the built-in close button is hidden and this is called on dismiss attempts (Esc / overlay click). */
  onCancelAttempt?: () => void;
  /** When true, hides the built-in close button rendered inside DialogContent. */
  hideCloseButton?: boolean;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
  onSubmit,
  title = 'Create Organization',
  description = 'You need to create an organization to manage your inventory items.',
  onCancelAttempt,
  hideCloseButton,
}: CreateOrganizationModalProps) {
  const handleSubmit = async (data: OrganizationFormData & { logoUrl: string }) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create organization:', error);
      // Error handling should be done in the parent component
      throw error;
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && onCancelAttempt) {
      // Intercept close attempts (Esc / overlay click / built-in X) to warn the user.
      onCancelAttempt();
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        hideCloseButton={hideCloseButton ?? !!onCancelAttempt}
        onEscapeKeyDown={(e) => {
          if (onCancelAttempt) {
            e.preventDefault();
            onCancelAttempt();
          }
        }}
        onInteractOutside={(e) => {
          if (onCancelAttempt) {
            e.preventDefault();
            onCancelAttempt();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <OrganizationForm
            onSubmit={handleSubmit}
            submitButtonText="Create Organization"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
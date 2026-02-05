import * as React from 'react';

import { Building2, X } from 'lucide-react';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

import { OrganizationForm, type OrganizationFormData } from './OrganizationForm';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrganizationFormData & { logoUrl: string }) => Promise<void>;
  title?: string;
  description?: string;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
  onSubmit,
  title = 'Create Organization',
  description = 'You need to create an organization to manage your inventory items.',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
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
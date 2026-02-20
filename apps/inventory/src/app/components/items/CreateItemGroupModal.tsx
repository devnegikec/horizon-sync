import * as React from 'react';

import { Loader2, Package, X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';

import { useCreateItemGroup } from '../../hooks/useCreateItemGroup';
import type { ItemGroupFormData, CreateItemGroupResponse } from '../../types/item-group-creation.types';
import { buildCreateItemGroupPayload } from '../../utility/item-group-payload-builders';

import { CreateItemGroupForm } from './CreateItemGroupForm';

interface CreateItemGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemGroupCreated: (itemGroup: CreateItemGroupResponse) => void;
}

const getInitialFormData = (): ItemGroupFormData => ({
  name: '',
  code: '',
  default_uom: 'Piece',
});

export function CreateItemGroupModal({ 
  open, 
  onOpenChange, 
  onItemGroupCreated 
}: CreateItemGroupModalProps) {
  const [formData, setFormData] = React.useState<ItemGroupFormData>(getInitialFormData());
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const { createItemGroup, loading } = useCreateItemGroup();

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
      setSubmitError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Basic validation
    if (!formData.name.trim() || !formData.code.trim() || !formData.default_uom) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    try {
      const payload = buildCreateItemGroupPayload(formData);
      const result = await createItemGroup(payload);
      onItemGroupCreated(result);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create item group');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Item Group</DialogTitle>
              <DialogDescription>
                Add a new item group to organize your inventory items
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <CreateItemGroupForm 
            formData={formData}
            setFormData={setFormData}
          />

          {submitError && (
            <p className="text-sm text-destructive mb-4">{submitError}</p>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
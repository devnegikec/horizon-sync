import { Loader2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { DialogFooter } from '@horizon-sync/ui/components/ui/dialog';

interface ItemDialogFooterProps {
  isEditing: boolean;
  isLoading: boolean;
  onCancel: () => void;
  submitError: string | null;
}

export function ItemDialogFooter({ isEditing, isLoading, onCancel, submitError }: ItemDialogFooterProps) {
  return (
    <>
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Saving…' : 'Creating…'}
            </>
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Create Item'
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

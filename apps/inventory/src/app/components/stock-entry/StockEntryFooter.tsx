import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { DialogFooter } from '@horizon-sync/ui/components/ui/dialog';

interface StockEntryFooterProps {
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
  submitError?: string | null;
  grandTotal: number;
}

export function StockEntryFooter({
  onCancel,
  loading,
  isEditing,
  submitError,
  grandTotal,
}: StockEntryFooterProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <DialogFooter>
        <Button type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Saving...' : 'Creating...'}
            </>
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Create Entry'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

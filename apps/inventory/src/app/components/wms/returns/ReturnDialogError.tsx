import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';

import type { NormalizedApiError } from '../../../utility/api/core';

/** Shared failure block for the returns dialogs: the server's sentence plus its `hint`. */
export function ReturnDialogError({ error, onRetry }: { error: NormalizedApiError; onRetry: () => void }) {
  const retryable = error.httpStatus === 0 || error.httpStatus >= 500;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-destructive">{error.message}</p>
        {error.hint && <p className="text-xs text-muted-foreground">{error.hint}</p>}
        {retryable && (
          <Button type="button" variant="outline" size="sm" className="mt-1 h-7 gap-1 px-2 text-xs" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

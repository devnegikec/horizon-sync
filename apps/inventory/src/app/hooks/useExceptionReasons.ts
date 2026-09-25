import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type { InboundExceptionReason } from '../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../utility/api/core';
import { inboundApi } from '../utility/api/wms';

export interface ExceptionReasonsState {
  reasons: InboundExceptionReason[];
  loading: boolean;
  error: NormalizedApiError | null;
  /** Re-fetch, because the API rejects a code it has since retired. */
  reload: () => void;
}

/**
 * Tenant-configurable reason codes for the exception and flag pickers.
 *
 * Loaded only while a dialog is open, and reloadable so a `REASON_CODE_INVALID`
 * response can be recovered from without closing the form. Pass `category`
 * (e.g. `'short'`) to ask the server for a single section — the list is also
 * filtered locally, so a server that ignores the query param can't leak codes
 * from another category into the picker.
 */
export function useExceptionReasons(open: boolean, category?: string): ExceptionReasonsState {
  const token = useUserStore((state) => state.accessToken);

  const [reasons, setReasons] = React.useState<InboundExceptionReason[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    inboundApi
      .listExceptionReasons(token, category)
      .then((data) => {
        if (!cancelled) setReasons(category ? data.filter((reason) => reason.category === category) : data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setReasons([]);
          setError(toNormalizedApiError(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token, reloadKey, category]);

  const reload = React.useCallback(() => setReloadKey((key) => key + 1), []);

  return { reasons, loading, error, reload };
}

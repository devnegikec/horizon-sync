import * as React from 'react';

import { createIdempotencyKey } from '../services/subscription.service';

/**
 * Per-form idempotency keys.
 *
 * The key is derived from a stable fingerprint of the payload, so retrying the
 * SAME payload reuses the key (the server can replay the original response),
 * while changing the payload produces a new key.
 */
export function useIdempotencyKey() {
  const keysRef = React.useRef(new Map<string, string>());

  return React.useCallback((payload: unknown): string => {
    const fingerprint = JSON.stringify(payload ?? null);
    const existing = keysRef.current.get(fingerprint);
    if (existing) return existing;
    const key = createIdempotencyKey();
    keysRef.current.set(fingerprint, key);
    return key;
  }, []);
}

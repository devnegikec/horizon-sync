import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

/**
 * Shown on the receiving screen when the active session (or ASN) is
 * `serialization_mode === 'quantity_only'`. Those sessions verify by quantity
 * only — per-unit serials were never captured, so the UI must not claim
 * per-unit verification.
 */
export function QuantityOnlyBanner() {
    return (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Verified by quantity only — unit serials were not captured.</p>
        </div>
    );
}

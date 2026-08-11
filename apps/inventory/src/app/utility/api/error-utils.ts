/**
 * Centralized error utilities for API hooks.
 *
 * Instead of every hook doing:
 *   import { getFriendlyErrorMessage } from '../utility/api/core';
 *   ...
 *   } catch (err) { setError(getFriendlyErrorMessage(err)); }
 *
 * They can use these helpers for consistent, DRY error handling.
 */

import { getFriendlyErrorMessage } from './core';

export { getFriendlyErrorMessage };

/**
 * Extract a user-friendly error string from a TanStack Query error.
 * Use in hooks that derive `error` from `useQuery`'s queryError.
 *
 * @example
 * const error = queryErrorToMessage(queryError);
 */
export function queryErrorToMessage(queryError: unknown): string | null {
  if (!queryError) return null;
  return getFriendlyErrorMessage(queryError);
}

/**
 * Standard catch handler for setState-based hooks.
 * Returns the friendly message string ready to pass to setError().
 *
 * @example
 * } catch (err) {
 *   setError(extractErrorMessage(err));
 * }
 */
export function extractErrorMessage(err: unknown): string {
  return getFriendlyErrorMessage(err);
}

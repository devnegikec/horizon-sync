import { useUserStore } from '@horizon-sync/store';
import { toast } from '@horizon-sync/ui';

/**
 * Shared API error handler for all admin services.
 * Handles 401, 403, 503, and network errors with appropriate
 * toast notifications and redirects.
 *
 * Should be called in the catch block of each service's request() helper.
 * Re-throws the error so React Query can handle it too.
 */
export function handleApiError(error: unknown): never {
  // Network error (TypeError from fetch, or no response)
  if (error instanceof TypeError) {
    toast({
      variant: 'destructive',
      title: 'Network error',
      description: 'Network error. Please check your connection.',
    });
    throw error;
  }

  const status = (error as Error & { status?: number }).status;

  if (status === 401) {
    useUserStore.getState().clearAuth();
    window.location.href = '/login';
    throw error;
  }

  if (status === 403) {
    toast({
      variant: 'destructive',
      title: 'Access denied',
      description: 'Admin access required',
    });
    throw error;
  }

  if (status === 503) {
    toast({
      variant: 'destructive',
      title: 'Service unavailable',
      description: 'Service temporarily unavailable. Please try again later.',
    });
    throw error;
  }

  throw error;
}

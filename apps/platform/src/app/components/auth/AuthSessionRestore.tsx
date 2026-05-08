import * as React from 'react';

import { useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks';
import { AppLoading } from '../AppLoading';

interface AuthSessionRestoreProps {
  children: React.ReactNode;
}

/**
 * Public routes where we should NOT attempt session restore
 */
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

/**
 * Public route prefixes — any path starting with these is treated as public
 */
const PUBLIC_ROUTE_PREFIXES = ['/g/'];

/**
 * Read the persisted refresh token directly from localStorage.
 * This is synchronous and doesn't depend on Zustand's async rehydration.
 * The store persists under key "horizon-auth" with shape: { state: { refreshToken: "..." }, version: 0 }
 */
function getPersistedRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem('horizon-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token = parsed?.state?.refreshToken || null;
    return token;
  } catch (e) {
    console.error('[AuthSessionRestore] Error reading localStorage:', e);
    return null;
  }
}

/**
 * Attempts to restore session from persisted refresh token on app load.
 *
 * On page refresh, the access token is lost (kept in memory only for security).
 * This component checks localStorage for a persisted refresh token and calls
 * the refresh endpoint to get a new access token before rendering children.
 *
 * This prevents AuthGuard from redirecting to /login before the session
 * restore has a chance to complete.
 */
export function AuthSessionRestore({ children }: AuthSessionRestoreProps) {
  const { accessToken, restoreSession } = useAuth();
  const location = useLocation();

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname)
    || PUBLIC_ROUTE_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  // On initial mount: if we're on a protected route and have a persisted refresh token
  // but no access token, we need to restore the session before rendering children.
  const needsRestore = !isPublicRoute && !accessToken && !!getPersistedRefreshToken();
  const [restoring, setRestoring] = React.useState(needsRestore);
  const attemptedRef = React.useRef(false);
  const restoreSessionRef = React.useRef(restoreSession);

  // Keep the ref updated
  React.useEffect(() => {
    restoreSessionRef.current = restoreSession;
  }, [restoreSession]);

  React.useEffect(() => {
    // Don't attempt restore on public routes or if already authenticated
    if (isPublicRoute || accessToken || attemptedRef.current) {
      setRestoring(false);
      return;
    }

    // No persisted refresh token — nothing to restore
    const persistedToken = getPersistedRefreshToken();
    if (!persistedToken) {
      setRestoring(false);
      return;
    }

    attemptedRef.current = true;
    setRestoring(true);

    let cancelled = false;

    const attemptRestore = async () => {
      try {
        await restoreSessionRef.current();
      } catch (error) {
        console.error('[AuthSessionRestore] Restore error:', error);
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    };

    attemptRestore();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isPublicRoute]);


  // Show loading only on protected routes while restoring session
  if (restoring) {
    return <AppLoading />;
  }

  return <>{children}</>;
}

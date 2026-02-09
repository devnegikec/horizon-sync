import * as React from 'react';
import { useLocation } from 'react-router-dom';

import { AppLoading } from '../AppLoading';
import { useAuth } from '../../hooks';

interface AuthSessionRestoreProps {
  children: React.ReactNode;
}

/**
 * Public routes where we should NOT attempt session restore
 */
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

/**
 * Attempts to restore session from HttpOnly refresh cookie on app load
 * (when "Remember Me" was used). Shows loading until restore attempt completes.
 * Access token stays in memory; refresh token is only in cookie.
 * Only attempts restore on protected routes, not on public routes like login/register.
 */
export function AuthSessionRestore({ children }: AuthSessionRestoreProps) {
  const { accessToken, restoreSession } = useAuth();
  const location = useLocation();
  const [restoring, setRestoring] = React.useState(false);
  const attemptedRef = React.useRef(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  React.useEffect(() => {
    // Don't attempt restore on public routes or if already authenticated
    if (isPublicRoute || accessToken || attemptedRef.current) {
      return;
    }
    attemptedRef.current = true;
    setRestoring(true);
    let cancelled = false;
    restoreSession()
      .then(() => {
        if (!cancelled) setRestoring(false);
      })
      .catch(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, restoreSession, isPublicRoute]);

  if (restoring) {
    return <AppLoading />;
  }

  return <>{children}</>;
}

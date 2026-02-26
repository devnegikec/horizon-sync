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
  const restoreSessionRef = React.useRef(restoreSession);

  // Keep the ref updated
  React.useEffect(() => {
    restoreSessionRef.current = restoreSession;
  }, [restoreSession]);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  React.useEffect(() => {
    console.log('AuthSessionRestore effect running', {
      isPublicRoute,
      hasAccessToken: !!accessToken,
      attempted: attemptedRef.current,
      restoring,
    });

    // Don't attempt restore on public routes or if already authenticated
    if (isPublicRoute || accessToken || attemptedRef.current) {
      console.log('Skipping session restore');
      return;
    }
    
    attemptedRef.current = true;
    setRestoring(true);
    console.log('Starting session restore...');
    
    let cancelled = false;
    
    const attemptRestore = async () => {
      try {
        const success = await restoreSessionRef.current();
        console.log('Session restore completed:', success);
      } catch (error) {
        console.error('Session restore error:', error);
      } finally {
        if (!cancelled) {
          console.log('Setting restoring to false');
          setRestoring(false);
        }
      }
    };
    
    attemptRestore();
    
    return () => {
      cancelled = true;
      console.log('AuthSessionRestore cleanup');
    };
  }, [accessToken, isPublicRoute]); // Only depend on accessToken and isPublicRoute

  console.log('AuthSessionRestore render', { restoring, hasAccessToken: !!accessToken });

  // Show loading while restoring session
  if (restoring) {
    console.log('Showing AppLoading');
    return <AppLoading />;
  }

  return <>{children}</>;
}


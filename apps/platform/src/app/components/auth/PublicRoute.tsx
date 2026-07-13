import * as React from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute wrapper for login/register pages
 * Redirects authenticated users to the dashboard or the page they came from
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, accessToken } = useAuth();
  const location = useLocation();

  // If user is already authenticated, redirect to where they came from or dashboard
  if (isAuthenticated && accessToken) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // User is not authenticated, render the public page (login/register)
  return children as React.ReactElement;
}

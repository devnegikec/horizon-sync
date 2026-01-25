import * as React from 'react';

import { Navigate } from 'react-router-dom';

import { useAuth } from '../hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute wrapper for login/register pages
 * Redirects authenticated users to the dashboard
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, accessToken } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated && accessToken) {
    return <Navigate to="/" replace />;
  }

  // User is not authenticated, render the public page (login/register)
  return children as React.ReactElement;
}

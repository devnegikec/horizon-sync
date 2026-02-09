import * as React from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, accessToken } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated || !accessToken) {
    // Redirect to login page, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return children as React.ReactElement;
}

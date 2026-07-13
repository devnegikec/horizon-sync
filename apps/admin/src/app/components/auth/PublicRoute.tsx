import { Navigate } from 'react-router-dom';
import { useUserStore } from '@horizon-sync/store';

import { useAdminProfile } from '../../hooks/useAdminProfile';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const accessToken = useUserStore((state) => state.accessToken);
  const { data: profile } = useAdminProfile();

  if (accessToken && profile?.user_type === 'system_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

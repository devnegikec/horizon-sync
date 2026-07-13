import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';

import { useAdminProfile } from '../../hooks/useAdminProfile';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const accessToken = useUserStore((state) => state.accessToken);
  const clearAuth = useUserStore((state) => state.clearAuth);
  const { data: profile, isPending, error } = useAdminProfile();

  useEffect(() => {
    if (!accessToken) {
      navigate('/login', { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!error) return;

    const status = (error as Error & { status?: number }).status;

    if (status === 401) {
      clearAuth();
      navigate('/login', { replace: true });
      return;
    }

    if (status === 403) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearAuth, navigate]);

  if (!accessToken) {
    return null;
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    const status = (error as Error & { status?: number }).status;

    if (status === 403) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600">
              Admin access required
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting to login...
            </p>
          </div>
        </div>
      );
    }

    return null;
  }

  if (profile?.user_type !== 'system_admin') {
    return null;
  }

  return children;
}

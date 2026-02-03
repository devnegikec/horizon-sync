import { useUserStore } from '@horizon-sync/store';

import { AuthService } from '../services/auth.service';

export function useAuth() {
  const { user, accessToken, refreshToken, setAuth, updateUser, clearAuth } = useUserStore();

  const login = (
    token: string,
    refresh: string,
    userData: { id: string; email: string; first_name?: string; last_name?: string; phone?: string; organization_id?: string | null },
  ) => {
    setAuth(
      {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name ?? '',
        last_name: userData.last_name ?? '',
        phone: userData.phone ?? '',
      },
      token,
      refresh,
    );
  };

  const logout = async () => {
    try {
      if (refreshToken) await AuthService.logout({ refresh_token: refreshToken });
    } catch (error) {
      console.error('Logout service failed:', error);
    } finally {
      clearAuth();
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken && !!user,
    login,
    logout,
    updateUser,
  };
}

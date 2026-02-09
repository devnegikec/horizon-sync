import { useUserStore, type User } from '@horizon-sync/store';

import { AuthService } from '../services/auth.service';
import type { UserType } from '../services/auth.types';

function userFromApi(u: UserType): User {
  return {
    id: u.id,
    email: u.email,
    first_name: u.first_name ?? '',
    last_name: u.last_name ?? '',
    phone: u.phone ?? '',
    display_name: `${u.display_name} ?? (${u.first_name ?? ''}.trim() + ' ' + ${u.last_name ?? ''}.trim()) || ${u.email}`,
    avatar_url: u.avatar_url ?? null,
    user_type: u.user_type ?? 'user',
    status: u.status ?? 'active',
    is_active: u.is_active ?? true,
    email_verified: u.email_verified ?? false,
    email_verified_at: u.email_verified_at ?? null,
    last_login_at: u.last_login_at ?? null,
    last_login_ip: u.last_login_ip ?? null,
    timezone: u.timezone ?? 'UTC',
    language: u.language ?? 'en',
    organization_id: u.organization_id ?? null,
    job_title: u.job_title,
    department: u.department,
    bio: u.bio,
    preferences: u.preferences ?? null,
    extra_data: u.extra_data ?? null,
  };
}

export function useAuth() {
  const { user, accessToken, refreshToken, setAuth, updateUser, clearAuth } = useUserStore();

  const login = (
    token: string,
    refresh: string,
    userData: Partial<User> & Pick<User, 'id' | 'email'>, // Require id and email, allow other fields to be partial
  ) => {
    // Create a complete User object with defaults for missing fields
    const completeUser: User = {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      phone: userData.phone || '',
      display_name: userData.display_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email,
      avatar_url: userData.avatar_url || null,
      user_type: userData.user_type || 'user',
      status: userData.status || 'active',
      is_active: userData.is_active ?? true,
      email_verified: userData.email_verified ?? false,
      email_verified_at: userData.email_verified_at || null,
      last_login_at: userData.last_login_at || null,
      last_login_ip: userData.last_login_ip || null,
      timezone: userData.timezone || 'UTC',
      language: userData.language || 'en',
      organization_id: userData.organization_id || null,
      job_title: userData.job_title || undefined,
      department: userData.department || undefined,
      bio: userData.bio || undefined,
      preferences: userData.preferences || null,
      extra_data: userData.extra_data || null,
    };
    
    setAuth(completeUser, token, refresh);
  };

  const logout = async () => {
    try {
      await AuthService.logout(
        refreshToken ? { refresh_token: refreshToken } : {}
      );
    } catch (error) {
      console.error('Logout service failed:', error);
    } finally {
      clearAuth();
    }
  };

  /**
   * Restore session from HttpOnly refresh cookie (e.g. after tab reopen when "Remember Me" was used).
   * Access token is stored in memory only; refresh token stays in cookie.
   */
  const restoreSession = async (): Promise<boolean> => {
    try {
      const data = await AuthService.refresh();
      const userData = data.user
        ? userFromApi(data.user)
        : userFromApi(await AuthService.getUserProfile(data.access_token));
      setAuth(userData, data.access_token, '');
      return true;
    } catch {
      return false;
    }
  };

  const fetchUserProfile = async () => {
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    try {
      const userProfile = await AuthService.getUserProfile(accessToken);
      // Update the user with complete profile data
      updateUser({
        display_name: userProfile.display_name,
        avatar_url: userProfile.avatar_url,
        user_type: userProfile.user_type,
        status: userProfile.status,
        is_active: userProfile.is_active,
        email_verified: userProfile.email_verified,
        email_verified_at: userProfile.email_verified_at,
        last_login_at: userProfile.last_login_at,
        last_login_ip: userProfile.last_login_ip,
        timezone: userProfile.timezone,
        language: userProfile.language,
        organization_id: userProfile.organization_id,
        job_title: userProfile.job_title,
        department: userProfile.department,
        bio: userProfile.bio,
        preferences: userProfile.preferences,
        extra_data: userProfile.extra_data,
      });
      return userProfile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken && !!user,
    login,
    logout,
    restoreSession,
    updateUser,
    fetchUserProfile,
  };
}

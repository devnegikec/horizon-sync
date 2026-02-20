import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';

import { useUserStore, type Organization as StoreOrganization } from '@horizon-sync/store';

import { useAuth, usePermissions } from '../hooks';
import { AuthService } from '../services/auth.service';
import { OrganizationService, type Organization as ServiceOrganization } from '../services/organization.service';
import { loginSchema, LoginFormData } from '../utility/validationSchema';

const REMEMBER_EMAIL_KEY = 'login_remember_email';
const IS_LOCAL = process.env.NODE_ENV === 'development';

function getStoredEmail(): string {
  if (typeof window === 'undefined' || IS_LOCAL) return '';
  return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
}

/**
 * Convert service organization to store organization format
 */
function convertToStoreOrganization(org: ServiceOrganization): StoreOrganization {
  return {
    id: org.id,
    name: org.name,
    display_name: org.display_name,
    status: org.status as 'active' | 'inactive' | 'suspended',
    is_active: org.status === 'active',
    settings: org.settings || null,
    extra_data: org.extra_data || null,
    created_at: org.created_at,
    updated_at: org.updated_at,
  };
}

/**
 * Fetch and store user permissions after login
 */
async function fetchUserPermissions(fetchPermissions: () => Promise<void>): Promise<void> {
  try {
    await fetchPermissions();
  } catch (permissionError) {
    console.warn('Failed to fetch user permissions:', permissionError);
    // Don't prevent navigation if permissions fetch fails
  }
}

/**
 * Fetch and store organization details after login
 */
async function fetchOrganizationDetails(
  organizationId: string,
  accessToken: string,
  setOrganization: (org: StoreOrganization) => void
): Promise<void> {
  try {
    const organizationData = await OrganizationService.getOrganization(organizationId, accessToken);
    setOrganization(convertToStoreOrganization(organizationData));
  } catch (orgError) {
    console.warn('Failed to fetch organization details:', orgError);
    // Don't prevent navigation if organization fetch fails
  }
}

export function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { fetchPermissions } = usePermissions();
  const { setOrganization } = useUserStore();
  const [rememberMe, setRememberMe] = React.useState(() => !IS_LOCAL && !!getStoredEmail());
  const [status, setStatus] = React.useState<{ loading: boolean; error: string; success: string }>({
    loading: false,
    error: '',
    success: '',
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: getStoredEmail(),
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setStatus({ loading: true, error: '', success: '' });
    try {
      const effectiveRememberMe = IS_LOCAL ? false : rememberMe;
      
      if (effectiveRememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
      } else if (!IS_LOCAL) {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      const response = await AuthService.login({
        email: data.email,
        password: data.password,
        remember_me: effectiveRememberMe,
      });
      setStatus((s) => ({ ...s, success: 'Login successful!' }));

      // Login with basic user data from login response
      login(response.access_token, response.refresh_token, {
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        display_name: response.user.display_name,
        phone: response.user.phone,
        avatar_url: response.user.avatar_url,
        user_type: response.user.user_type,
        status: response.user.status,
        is_active: response.user.is_active,
        email_verified: response.user.email_verified,
        email_verified_at: response.user.email_verified_at,
        last_login_at: response.user.last_login_at,
        last_login_ip: response.user.last_login_ip,
        timezone: response.user.timezone,
        language: response.user.language,
        organization_id: response.user.organization_id,
        job_title: response.user.job_title,
        department: response.user.department,
        bio: response.user.bio,
        preferences: response.user.preferences,
        extra_data: response.user.extra_data,
      });

      // Fetch user permissions after successful login
      await fetchUserPermissions(fetchPermissions);

      // Fetch organization details if user has organization_id
      if (response.user.organization_id) {
        await fetchOrganizationDetails(response.user.organization_id, response.access_token, setOrganization);
      }

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err) {
      const error = err as Error;
      setStatus((s) => ({ ...s, error: error.message || 'An unexpected error occurred. Please try again.' }));
    } finally {
      setStatus((s) => ({ ...s, loading: false }));
    }
  };

  return {
    ...form,
    ...status,
    onSubmit: form.handleSubmit(onSubmit),
    rememberMe,
    setRememberMe,
    isLocal: IS_LOCAL,
  };
}

import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks';
import { AuthService } from '../services/auth.service';
import { loginSchema, LoginFormData } from '../utility/validationSchema';

const REMEMBER_EMAIL_KEY = 'login_remember_email';

function getStoredEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
}

export function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = React.useState(() => !!getStoredEmail());
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
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      const response = await AuthService.login({
        email: data.email,
        password: data.password,
        remember_me: rememberMe,
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
  };
}

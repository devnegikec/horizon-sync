import * as React from 'react';

import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../hooks';
import { AuthService } from '../services/auth.service';
import { loginSchema, LoginFormData } from '../utility/validationSchema';

export function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [status, setStatus] = React.useState<{ loading: boolean; error: string; success: string }>({
    loading: false, error: '', success: ''
  });

  const form = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setStatus({ loading: true, error: '', success: '' });
    try {
      const res = await AuthService.login(data);
      setStatus(s => ({ ...s, success: 'Login successful!' }));
      login(res.access_token, res.refresh_token, {
        user_id: res.user_id, email: res.email, organization_id: res.organization_id
      });

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err) {
      const error = err as Error;
      setStatus(s => ({ ...s, error: error.message || 'An unexpected error occurred.' }));
    } finally {
      setStatus(s => ({ ...s, loading: false }));
    }
  };

  return { ...form, ...status, onSubmit: form.handleSubmit(onSubmit) };
}

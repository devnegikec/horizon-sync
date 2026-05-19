import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { AuthService } from '../services';
import { acceptInvitationSchema, AcceptInvitationFormData } from '../utility/validationSchema';
import type { InvitationValidateResponse } from '../services/auth.types';

export function useAcceptInvitationForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [invitation, setInvitation] = React.useState<InvitationValidateResponse | null>(null);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const token = searchParams.get('token');

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: '',
    },
  });

  React.useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Invitation token is missing. Please use the link provided in your invitation email.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const result = await AuthService.validateInvitationToken(token);
        setInvitation(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to validate invitation token. Please try again.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) {
      setError('Invitation token is missing. Please use the link provided in your invitation email.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await AuthService.acceptInvitation({
        token,
        password: data.password,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
      });

      setSuccess('Invitation accepted successfully. Redirecting to login...');

      window.setTimeout(() => {
        navigate('/login');
      }, 2200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Invitation acceptance failed',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    token,
    invitation,
    isLoading,
    isSubmitting,
    error,
    success,
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    watch: form.watch,
  };
}

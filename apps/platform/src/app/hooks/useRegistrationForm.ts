import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useAuth } from '../hooks';
import { AuthService } from '../services';
import { registerSchema, RegisterFormData } from '../utility/validationSchema';

export function useRegistrationForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const response = await AuthService.register(data);

      toast({
        title: 'Registration successful!',
        description: 'Your account has been created successfully.',
      });

      login(response.access_token, response.refresh_token, {
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        phone: response.user.phone,
      });

      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting,
  };
}

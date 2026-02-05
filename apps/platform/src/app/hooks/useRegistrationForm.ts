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
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare payload for API (exclude confirm_password)
      const payload = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        password: data.password,
      };

      console.log('Registration payload:', payload);
      
      const response = await AuthService.register(payload);
      
      console.log('Registration response:', response);

      toast({
        title: 'Registration successful!',
        description: 'Your account has been created successfully.',
      });

      // Login the user with the response data
      login(response.access_token, response.refresh_token, {
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        phone: response.user.phone,
      });

      // Navigate to onboarding after a short delay
      setTimeout(() => navigate('/'), 200);
    } catch (error) {
      console.error('Registration error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
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
    reset: form.reset,
    watch: form.watch,
  };
}

import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import logo from '../../assets/ciphercode_logo.png';
import { useAuth } from '../hooks';
import { AuthService } from '../services/auth.service';
import { registerSchema, RegisterFormData } from '../utility/validationSchema';

export function RegistrationForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await AuthService.register(data);
      setSuccessMessage('Registration successful!');
      
      // Store authentication state and log in
      login(response.access_token, response.refresh_token, {
        user_id: response.user.id,
        email: response.user.email,
        organization_id: '', // Organization is no longer part of registration
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-2xl">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-2 mb-4">
          {/* Logo */}
          <div className="flex h-20 w-20 items-center justify-center rounded-lg">
            <img src={logo} alt="Logo" className="h-15 w-15 object-contain" />
          </div>
          <span className="font-bold text-4xl tracking-tight bg-gradient-to-r from-[#3058EE] to-[#7D97F6] bg-clip-text text-transparent">
            Horizon Sync
          </span>
        </div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Enter your details below to create your account and get started
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* First Name and Last Name - Same Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="John"
                {...register('first_name')}
                className={errors.first_name ? 'border-destructive' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                placeholder="Doe"
                {...register('last_name')}
                className={errors.last_name ? 'border-destructive' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="9008750493"
              {...register('phone')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password">
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              {...register('confirm_password')}
              className={errors.confirm_password ? 'border-destructive' : ''}
            />
            {errors.confirm_password && (
              <p className="text-sm text-destructive">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-[#3058EE] hover:opacity-80 font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

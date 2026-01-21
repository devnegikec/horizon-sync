import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import { AuthService } from '../services/auth.service';
import { loginSchema, LoginFormData } from '../utility/validationSchema';
import { useAuth } from '../hooks';
import logo from '../../assets/ciphercode_logo.png';

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await AuthService.login(data);
      setSuccessMessage('Login successful!');
      
      // Store authentication state
      login(response.access_token, {
        user_id: response.user_id,
        email: response.email,
        organization_id: response.organization_id,
      });
      
      // Redirect to the page they were trying to access, or dashboard
      const from = (location.state as any)?.from?.pathname || '/';
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
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
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Work Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Work Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@company.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <a
                href="/forgot-password"
                className="text-sm text-[#3058EE] hover:opacity-80 font-medium underline-offset-4 hover:underline"
              >
                Forgot Password?
              </a>
            </div>
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        {/* Copyright */}
        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>Copyright © 2025 Ciphercode. All rights reserved</p>
          <div className="flex items-center justify-center gap-2">
            <a
              href="/terms"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Terms & Conditions
            </a>
            <span>and</span>
            <a
              href="/privacy"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Sign up link */}
        <div className="text-sm text-center text-muted-foreground">
          Don't have an account?{' '}
          <a
            href="/register"
            className="text-[#3058EE] hover:opacity-80 font-medium underline-offset-4 hover:underline"
          >
            Sign up
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

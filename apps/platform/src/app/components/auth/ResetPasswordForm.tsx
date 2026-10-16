import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import logo from '../../../assets/ciphercode_logo.png';
import { AuthService } from '../../services/auth.service';
import { resetPasswordSchema, ResetPasswordFormData } from '../../utility/validationSchema';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  // Check token once at mount to avoid re-checking on every render
  const [initialToken] = React.useState(() => searchParams.get('token'));
  // Server-side validity of the token: undefined while checking,
  // true if still valid, false once the link has been used or expired.
  const [tokenValid, setTokenValid] = React.useState<boolean | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Verify token validity against the backend on mount so a consumed link
  // immediately shows the "expired" view instead of the form.
  React.useEffect(() => {
    if (!initialToken) {
      setTokenValid(false);
      return;
    }
    let cancelled = false;
    AuthService.verifyResetToken(initialToken)
      .then((res) => {
        if (!cancelled) setTokenValid(res.valid);
      })
      .catch(() => {
        if (!cancelled) setTokenValid(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialToken]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    const token = searchParams.get('token');
    if (!token) {
      setErrorMessage('Reset token is missing. Please request a new password reset link.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await AuthService.resetPassword({
        token,
        new_password: data.password,
      });
      setSuccessMessage('Password has been reset successfully!');
      setTimeout(() => {
        navigate('/login');
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

  if (tokenValid === undefined) {
    // Checking token validity with the server — show a brief loading card.
    return (
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader>
          <CardTitle>Verifying link…</CardTitle>
          <CardDescription>Please wait while we validate your password reset link.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!initialToken || tokenValid === false) {
    return (
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader>
          <CardTitle className="text-destructive">Link expired</CardTitle>
          <CardDescription>
            This password reset link has already been used or has expired. Please request a new
            one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate('/forgot-password')} className="w-full">
            Request New Link
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-none shadow-2xl">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg">
            <img src={logo} alt="Logo" className="h-15 w-15 object-contain" />
          </div>
          <span className="font-bold text-4xl tracking-tight bg-gradient-to-r from-[#3058EE] to-[#7D97F6] bg-clip-text text-transparent">
            Ciphercode
          </span>
        </div>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              New Password <span className="text-destructive">*</span>
            </Label>
            <Input id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">
              Confirm New Password <span className="text-destructive">*</span>
            </Label>
            <Input id="confirm_password"
              type="password"
              placeholder="••••••••"
              {...register('confirm_password')}
              className={errors.confirm_password ? 'border-destructive' : ''} />
            {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <Button type="submit"
            className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

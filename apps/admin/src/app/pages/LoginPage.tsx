import { useState, type FormEvent } from 'react';

import { Eye, EyeOff, Loader2, Lock, Shield, Users, Zap } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
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
import { LoginLayout } from '@horizon-sync/ui/components';
import { useNavigate } from 'react-router-dom';

import { AdminAuthService } from '../services/admin-auth.service';

const ADMIN_FEATURES = [
  { icon: Shield, text: 'Granular role-based access control' },
  { icon: Users, text: 'Organization & user management' },
  { icon: Zap, text: 'Feature flag controls' },
  { icon: Lock, text: 'Full audit trail & activity logs' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useUserStore((state) => state.setAuth);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      const response = await AdminAuthService.login({ email, password });
      setAuth(
        {
          id: response.user.id,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          display_name: response.user.display_name ?? undefined,
          phone: '',
          user_type: response.user.user_type,
        },
        response.access_token,
        response.refresh_token
      );
      navigate('/', { replace: true });
    } catch (err) {
      const error = err as Error & { data?: { detail?: string } };
      setApiError(
        error.data?.detail || error.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginLayout
      brandingTitle="Admin Portal"
      brandingSubtitle="Manage your platform, users, and features from a single control center"
      features={ADMIN_FEATURES}
      brandingFooter="Horizon Sync — System Administration"
    >
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Horizon Sync
            </span>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to the admin portal to continue</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="http://localhost:4200/forgot-password"
                  className="text-sm text-[#3058EE] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-muted-foreground">
          <p className="text-xs">
            Copyright © 2026 Ciphercode. All rights reserved
          </p>
        </CardFooter>
      </Card>
    </LoginLayout>
  );
}

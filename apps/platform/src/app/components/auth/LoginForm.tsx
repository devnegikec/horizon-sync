import * as React from 'react';

import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { useLoginForm } from '../../hooks/useLoginForm';

import { FormInput } from './FormInput';
import { LoginFooter } from './LoginFooter';
import { LoginHeader } from './LoginHeader';
import { StatusAlert } from './StatusAlert';

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    onSubmit,
    loading,
    error,
    success,
    rememberMe,
    setRememberMe,
    isLocal,
    formState: { errors },
  } = useLoginForm();

  return (
    <Card className="w-full max-w-md border-none shadow-2xl">
      <LoginHeader />
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormInput id="email"
            label="Work Email"
            type="email"
            placeholder="john.doe@company.com"
            register={register('email')}
            error={errors.email?.message}/>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <a href="/forgot-password" title="Forgot Password" className="text-sm text-[#3058EE] hover:underline">
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Input id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'} />
              <Button type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          {!isLocal && (
            <div className="flex items-center space-x-2">
              <Checkbox id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                aria-label="Remember me" />
              <Label htmlFor="remember-me"
                className="text-sm font-normal cursor-pointer select-none">
                Remember me
              </Label>
            </div>
          )}

          {success && <StatusAlert message={success} variant="success" />}
          {error && <StatusAlert message={error} variant="error" />}

          <Button type="submit" className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] text-white" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
      <LoginFooter />
    </Card>
  );
}

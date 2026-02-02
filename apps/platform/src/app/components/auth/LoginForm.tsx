import { Loader2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { useLoginForm } from '../../hooks/useLoginForm';

import { FormInput } from './FormInput';
import { LoginFooter } from './LoginFooter';
import { LoginHeader } from './LoginHeader';
import { StatusAlert } from './StatusAlert';

export function LoginForm() {
  const {
    register,
    onSubmit,
    loading,
    error,
    success,
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
            <Input id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}/>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

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

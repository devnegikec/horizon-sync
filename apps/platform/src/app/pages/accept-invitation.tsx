import * as React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { useAcceptInvitationForm } from '../hooks/useAcceptInvitationForm';
import { RegistrationFormInput } from '../components/auth/RegistrationFormInput';
import { BrandingSection } from '../components/BrandingSection';

export function AcceptInvitationPage() {
  const {
    invitation,
    isLoading,
    isSubmitting,
    error,
    success,
    register,
    handleSubmit,
    errors,
    hasInvitedName,
  } = useAcceptInvitationForm();

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-lg border-none shadow-2xl">
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.2em] text-sky-600">Invitation</p>
                <h1 className="mt-3 text-3xl font-semibold">Accept your invitation</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use the invitation link you received by email to create your account.
                </p>
              </div>

              {isLoading ? (
                <div className="rounded-lg border border-border p-8 text-center">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-sky-600" />
                  <p className="text-sm text-muted-foreground">Validating your invitation token...</p>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
                  <p className="text-base font-semibold text-destructive">Unable to accept invitation</p>
                  <p className="mt-2 text-sm text-destructive/90">{error}</p>
                  <div className="mt-4">
                    <Link to="/login" className="font-medium text-sky-600 hover:underline">
                      Return to Login
                    </Link>
                  </div>
                </div>
              ) : success ? (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-6">
                  <p className="text-base font-semibold text-sky-900">Invitation accepted</p>
                  <p className="mt-2 text-sm text-sky-700">{success}</p>
                  <div className="mt-4">
                    <Button asChild>
                      <Link to="/login">Continue to login</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border p-5 bg-muted/60">
                    <p className="text-sm font-medium text-slate-900">Invitation details</p>
                    <div className="mt-3 grid gap-3 text-sm text-slate-700">
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{invitation?.email}</p>
                      </div>
                      <div>
                        <Label>Organization</Label>
                        <p className="font-medium">{invitation?.organization_name ?? 'Your organization'}</p>
                      </div>
                      <div>
                        <Label>Expires</Label>
                        <p className="font-medium">{invitation?.expires_at ? new Date(invitation.expires_at).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <RegistrationFormInput
                        id="first_name"
                        label="First name"
                        placeholder="John"
                        registration={register('first_name')}
                        error={errors.first_name}
                        testId="accept-invitation-first-name"
                        readOnly={hasInvitedName}
                      />
                      <RegistrationFormInput
                        id="last_name"
                        label="Last name"
                        placeholder="Doe"
                        registration={register('last_name')}
                        error={errors.last_name}
                        testId="accept-invitation-last-name"
                        readOnly={hasInvitedName}
                      />
                    </div>
                    <RegistrationFormInput
                      id="password"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      registration={register('password')}
                      error={errors.password}
                      testId="accept-invitation-password"
                    />
                    <RegistrationFormInput
                      id="confirm_password"
                      label="Confirm password"
                      type="password"
                      placeholder="••••••••"
                      registration={register('confirm_password')}
                      error={errors.confirm_password}
                      testId="accept-invitation-confirm-password"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Accepting invitation...
                        </>
                      ) : (
                        'Accept Invitation'
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BrandingSection />
    </div>
  );
}

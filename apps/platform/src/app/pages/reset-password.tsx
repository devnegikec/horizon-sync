import * as React from 'react';

import { LoginBrandingSection, ResetPasswordForm } from '../components';

export function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Reset Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <ResetPasswordForm />
      </div>

      {/* Right Side - Branding */}
      <LoginBrandingSection />
    </div>
  );
}

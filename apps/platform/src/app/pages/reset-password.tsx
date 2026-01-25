import * as React from 'react';

import { LoginBrandingSection } from '../components/LoginBrandingSection';
import { ResetPasswordForm } from '../components/ResetPasswordForm';

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

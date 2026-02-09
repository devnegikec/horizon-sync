import * as React from 'react';

import { ForgotPasswordForm, LoginBrandingSection } from '../components';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <ForgotPasswordForm />
      </div>

      {/* Right Side - Branding */}
      <LoginBrandingSection />
    </div>
  );
}

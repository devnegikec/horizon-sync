import * as React from 'react';

import { LoginBrandingSection, LoginForm } from '../components';

export function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <LoginForm />
      </div>

      {/* Right Side - Branding */}
      <LoginBrandingSection />
    </div>
  );
}

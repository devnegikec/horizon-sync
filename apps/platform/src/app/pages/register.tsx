import * as React from 'react';

import { BrandingSection, RegistrationForm } from '../components';

export function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <RegistrationForm />
      </div>

      {/* Right Side - Branding */}
      <BrandingSection />
    </div>
  );
}

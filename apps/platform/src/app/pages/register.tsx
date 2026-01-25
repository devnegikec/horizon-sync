import * as React from 'react';

import { BrandingSection } from '../components/BrandingSection';
import { RegistrationForm } from '../components/RegistrationForm';

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

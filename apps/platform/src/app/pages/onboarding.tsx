import * as React from 'react';

import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';

export function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3058EE]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#7D97F6]/10 rounded-full blur-3xl" />
      </div>
      <OnboardingWizard />
    </div>
  );
}

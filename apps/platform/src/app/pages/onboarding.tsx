import * as React from 'react';

import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';

export function OnBoarding() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <OnboardingWizard />
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@horizon-sync/ui/components/ui/button";
import { useOnboardingStore } from "../../hooks/useOnboardingStore";

export function OrganizationStep() {
  const { setCurrentStep } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Organization Setup</h3>
        <p className="text-sm text-muted-foreground">This is a placeholder for the organization setup step.</p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-full">
          Back
        </Button>
        <Button onClick={() => setCurrentStep(3)} className="w-full">
          Continue to Invite Team
        </Button>
      </div>
    </div>
  );
}

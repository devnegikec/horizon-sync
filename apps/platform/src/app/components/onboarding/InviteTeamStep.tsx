"use client";

import * as React from "react";

import { Button } from "@horizon-sync/ui/components/ui/button";

import { useOnboardingStore } from "../../hooks/useOnboardingStore";

export function InviteTeamStep() {
  const { setCurrentStep, setIsComplete } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Invite Team</h3>
        <p className="text-sm text-muted-foreground">This is a placeholder for the invite team step.</p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-full">
          Back
        </Button>
        <Button onClick={() => setIsComplete(true)} className="w-full">
          Complete Setup
        </Button>
      </div>
    </div>
  );
}

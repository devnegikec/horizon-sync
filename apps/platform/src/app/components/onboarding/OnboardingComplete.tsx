"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@horizon-sync/ui/components/ui/button";
import { useNavigate } from "react-router-dom";

export function OnboardingComplete() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">All set!</h2>
        <p className="text-muted-foreground">
          Your account is ready. You can now start using Horizon Sync.
        </p>
      </div>
      <Button 
        onClick={() => navigate("/dashboard")} 
        className="w-full bg-gradient-to-r from-[#3058EE] to-[#7D97F6] text-white"
      >
        Go to Dashboard
      </Button>
    </div>
  );
}

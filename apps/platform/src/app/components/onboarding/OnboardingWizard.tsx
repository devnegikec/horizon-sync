'use client';

import * as React from 'react';

import { User, Building, Users, Check } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import { useOnboardingStore } from '../../hooks/useOnboardingStore';

import { InviteTeamStep } from './InviteTeamStep';
import { OnboardingComplete } from './OnboardingComplete';
import { OrganizationStep } from './OrganizationStep';
import { PersonalDetailsStep } from './PersonalDetailsStep';

import { cn } from '@/lib/utils';

const steps = [
  {
    id: 1,
    title: 'Personal Details',
    description: 'Tell us about yourself',
    icon: User,
  },
  {
    id: 2,
    title: 'Organization',
    description: 'Set up your company',
    icon: Building,
  },
  {
    id: 3,
    title: 'Invite Team',
    description: 'Add team members',
    icon: Users,
  },
];

export function OnboardingWizard() {
  const { currentStep, isComplete } = useOnboardingStore();

  if (isComplete) {
    return (
      <Card className="w-full max-w-lg border-none shadow-2xl">
        <CardContent className="pt-6">
          <OnboardingComplete />
        </CardContent>
      </Card>
    );
  }

  const currentStepInfo = steps.find((s) => s.id === currentStep);

  return (
    <Card className="w-full max-w-lg border-none shadow-2xl">
      <CardHeader className="space-y-4 pb-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
            <span className="font-bold text-lg text-white">H</span>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-[#3058EE] to-[#7D97F6] bg-clip-text text-transparent">
            Horizon Sync
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300',
                      isCompleted
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                        : isActive
                          ? 'bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white shadow-lg shadow-[#3058EE]/25'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="text-center">
                    <p className={cn('text-xs font-medium', isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground')}>{step.title}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 mb-6 transition-all duration-300',
                      currentStep > step.id ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-border',
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Title & Description */}
        <div className="pt-2">
          <CardTitle className="text-xl">{currentStepInfo?.title}</CardTitle>
          <CardDescription className="text-muted-foreground">{currentStepInfo?.description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {currentStep === 1 && <PersonalDetailsStep />}
        {currentStep === 2 && <OrganizationStep />}
        {currentStep === 3 && <InviteTeamStep />}
      </CardContent>
    </Card>
  );
}

/**
 * Shared login page layout with split-screen design.
 * Left side: login form slot. Right side: branded panel.
 *
 * Used by both platform and admin apps for consistent look and feel.
 */
import * as React from 'react';

import { CheckCircle2, Shield, TrendingUp, Zap } from 'lucide-react';

export interface LoginLayoutProps {
  /** The login form to render on the left side */
  children: React.ReactNode;
  /** Title shown on the branding panel */
  brandingTitle?: string;
  /** Subtitle shown on the branding panel */
  brandingSubtitle?: string;
  /** Feature bullet points on the branding panel */
  features?: Array<{ icon: React.ComponentType<{ className?: string }>; text: string }>;
  /** Footer text on the branding panel */
  brandingFooter?: string;
}

const DEFAULT_FEATURES = [
  { icon: Zap, text: 'Lightning-fast performance' },
  { icon: Shield, text: 'Bank-level security' },
  { icon: TrendingUp, text: 'Real-time analytics' },
  { icon: CheckCircle2, text: 'Seamless integration' },
];

export function LoginLayout({
  children,
  brandingTitle = 'Access Your Workspace',
  brandingSubtitle = 'Sign in to continue managing your projects and collaborating with your team',
  features = DEFAULT_FEATURES,
  brandingFooter = 'Trusted by 10,000+ companies worldwide',
}: LoginLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        {children}
      </div>

      {/* Right Side — Branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 bg-gradient-to-br from-[#3058EE] to-[#7D97F6] relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse [animation-delay:700ms]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white space-y-8 max-w-lg">
          {/* Logo icon */}
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">{brandingTitle}</h1>
            <p className="text-xl text-white/90">{brandingSubtitle}</p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 pt-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-in slide-in-from-right duration-500"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          {brandingFooter && (
            <div className="pt-8 text-white/70 text-sm">
              <p>{brandingFooter}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

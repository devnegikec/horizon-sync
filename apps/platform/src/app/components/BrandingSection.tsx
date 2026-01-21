import * as React from 'react';
import { Zap, CheckCircle2, Shield, Users } from 'lucide-react';

export function BrandingSection() {
  return (
    <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 bg-gradient-to-br from-[#3058EE] to-[#7D97F6] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse [animation-delay:700ms]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white space-y-8 max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-2xl">
            <Zap className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">
            Welcome to Horizon Sync
          </h1>
          <p className="text-xl text-white/90">
            The modern platform for seamless collaboration and management
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 pt-8">
          {[
            {
              icon: Shield,
              text: 'Enterprise-grade security',
            },
            {
              icon: Users,
              text: 'Collaborative team workspace',
            },
            {
              icon: CheckCircle2,
              text: 'Powerful integrations',
            },
          ].map((feature, index) => (
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
      </div>
    </div>
  );
}

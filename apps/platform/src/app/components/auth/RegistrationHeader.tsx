import * as React from 'react';

import { CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import logo from '../../../assets/ciphercode_logo.png';

export function RegistrationHeader() {
  return (
    <CardHeader className="space-y-1 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-lg">
          <img src={logo} alt="Logo" className="h-15 w-15 object-contain" />
        </div>
        <span className="font-bold text-4xl tracking-tight bg-gradient-to-r from-[#3058EE] to-[#7D97F6] bg-clip-text text-transparent">
          Horizon Sync
        </span>
      </div>
      <CardTitle className="text-2xl">Create your account</CardTitle>
      <CardDescription>Enter your details below to get started</CardDescription>
    </CardHeader>
  );
}

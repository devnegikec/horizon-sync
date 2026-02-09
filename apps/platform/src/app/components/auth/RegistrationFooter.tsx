import * as React from 'react';

import { CardFooter } from '@horizon-sync/ui/components/ui/card';

export function RegistrationFooter() {
  return (
    <CardFooter className="flex flex-col space-y-4">
      <div className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="text-[#3058EE] hover:opacity-80 font-medium underline-offset-4 hover:underline">
          Sign in
        </a>
      </div>
    </CardFooter>
  );
}

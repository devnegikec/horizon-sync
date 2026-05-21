import * as React from 'react';

interface AppLoadingProps {
  message?: string;
}

export function AppLoading({ message = 'Loading...' }: AppLoadingProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

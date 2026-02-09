import * as React from 'react';

export function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

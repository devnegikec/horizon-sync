import * as React from 'react';

import { BookOpen } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';

export function BooksPage() {
  return (
    <ThemeProvider>
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen bg-background">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mb-6">
          <BookOpen className="h-8 w-8 text-violet-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Books</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Manage accounting books, ledgers, and financial records
        </p>
        <p className="text-sm text-muted-foreground mt-4">This page is under construction</p>
      </div>
    </ThemeProvider>
  );
}

export default BooksPage;

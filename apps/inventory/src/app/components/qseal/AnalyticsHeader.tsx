import { RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

interface AnalyticsHeaderProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export function AnalyticsHeader({ onRefresh, isLoading = false }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          QSeal scan insights for your products and packaging
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

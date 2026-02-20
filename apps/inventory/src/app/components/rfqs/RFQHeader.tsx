import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

interface RFQHeaderProps {
  onRefresh: () => void;
  onCreateRFQ: () => void;
  isLoading?: boolean;
}

export function RFQHeader({
  onRefresh,
  onCreateRFQ,
  isLoading = false,
}: RFQHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request for Quotations</h1>
        <p className="text-muted-foreground mt-1">
          Send RFQs to suppliers and collect quotes
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          onClick={onCreateRFQ}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New RFQ
        </Button>
      </div>
    </div>
  );
}

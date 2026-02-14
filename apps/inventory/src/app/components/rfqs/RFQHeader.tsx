import { Plus } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';

interface RFQHeaderProps {
  onCreateRFQ: () => void;
}

export function RFQHeader({ onCreateRFQ }: RFQHeaderProps) {
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

import { Plus } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';

interface MaterialRequestHeaderProps {
  onCreateMaterialRequest: () => void;
}

export function MaterialRequestHeader({ onCreateMaterialRequest }: MaterialRequestHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Material Requests</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage material requests for procurement
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onCreateMaterialRequest}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Material Request
        </Button>
      </div>
    </div>
  );
}

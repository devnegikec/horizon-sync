import { Plus, Download } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

interface ItemManagementHeaderProps {
  onCreateItem: () => void;
}

export function ItemManagementHeader({ onCreateItem }: ItemManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Item Management</h1>
        <p className="text-muted-foreground mt-1">Manage your product catalog, pricing, and inventory levels</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button onClick={onCreateItem} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>
  );
}

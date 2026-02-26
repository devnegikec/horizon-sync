import { Plus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';

interface ItemGroupManagementHeaderProps {
  onCreateGroup: () => void;
}

export function ItemGroupManagementHeader({ onCreateGroup }: ItemGroupManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Item Groups</h1>
        <p className="text-muted-foreground mt-1">Organize your inventory items into logical categories</p>
      </div>
      <Button onClick={onCreateGroup} className="gap-2 text-primary-foreground shadow-lg">
        <Plus className="h-4 w-4" />
        New Group
      </Button>
    </div>
  );
}

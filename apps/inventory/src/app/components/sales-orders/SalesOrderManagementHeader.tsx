import { Plus, Download, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

interface SalesOrderManagementHeaderProps {
  onRefresh: () => void;
  onCreateSalesOrder: () => void;
  isLoading?: boolean;
}

export function SalesOrderManagementHeader({
  onRefresh,
  onCreateSalesOrder,
  isLoading = false,
}: SalesOrderManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
        <p className="text-muted-foreground mt-1">Create and manage sales orders</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline"
          className="gap-2"
          onClick={onRefresh}
          disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="default"
          className="gap-2 text-primary-foreground shadow-lg"
          onClick={onCreateSalesOrder}>
          <Plus className="h-4 w-4" />
          New Sales Order
        </Button>
      </div>
    </div>
  );
}

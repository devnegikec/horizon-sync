import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

interface PaymentManagementHeaderProps {
  onRefresh: () => void;
  onCreatePayment: () => void;
  isLoading?: boolean;
}

export function PaymentManagementHeader({
  onRefresh,
  onCreatePayment,
  isLoading = false,
}: PaymentManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-1">Record and manage customer payments</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
        <Button
          variant="default"
          className="gap-2 text-primary-foreground shadow-lg"
          onClick={onCreatePayment}
        >
          <Plus className="h-4 w-4" />
          New Payment
        </Button>
      </div>
    </div>
  );
}

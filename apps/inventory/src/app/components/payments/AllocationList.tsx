import { useMemo, useCallback, memo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';
import { formatAllocationAmount } from '../../utils/allocation.utils';
import type { PaymentReference } from '../../types/payment.types';

interface AllocationListProps {
  allocations: PaymentReference[];
  paymentCurrency: string;
  isDraft: boolean;
  onRemove: (allocationId: string) => void;
  loading?: boolean;
}

// Memoize individual allocation row to prevent unnecessary re-renders
const AllocationRow = memo(({ 
  allocation, 
  paymentCurrency, 
  isDraft, 
  onRemove, 
  loading 
}: { 
  allocation: PaymentReference;
  paymentCurrency: string;
  isDraft: boolean;
  onRemove: (allocationId: string) => void;
  loading: boolean;
}) => {
  const handleRemove = useCallback(() => {
    onRemove(allocation.id);
  }, [allocation.id, onRemove]);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{allocation.invoice_no || allocation.invoice_id}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Allocated: {formatAllocationAmount(allocation.allocated_amount, paymentCurrency)}
          {allocation.allocated_amount_invoice_currency &&
            allocation.allocated_amount_invoice_currency !== allocation.allocated_amount && (
              <span className="ml-2">
                (Invoice Currency: {allocation.allocated_amount_invoice_currency.toFixed(2)})
              </span>
            )}
        </p>
      </div>
      {isDraft && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={loading}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

AllocationRow.displayName = 'AllocationRow';

export const AllocationList = memo(function AllocationList({
  allocations,
  paymentCurrency,
  isDraft,
  onRemove,
  loading = false,
}: AllocationListProps) {
  // Memoize total calculation
  const totalAllocated = useMemo(() => 
    allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0),
    [allocations]
  );

  if (allocations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            No allocations yet. Link invoices to this payment to allocate amounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Allocated Invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {allocations.map((allocation) => (
            <AllocationRow
              key={allocation.id}
              allocation={allocation}
              paymentCurrency={paymentCurrency}
              isDraft={isDraft}
              onRemove={onRemove}
              loading={loading}
            />
          ))}
        </div>
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Total Allocated</p>
            <p className="text-lg font-bold">{formatAllocationAmount(totalAllocated, paymentCurrency)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

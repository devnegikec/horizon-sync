import { Plus } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';

interface PurchaseOrderHeaderProps {
  onCreatePurchaseOrder: () => void;
}

export function PurchaseOrderHeader({ onCreatePurchaseOrder }: PurchaseOrderHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage purchase orders for suppliers
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onCreatePurchaseOrder}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
      </div>
    </div>
  );
}

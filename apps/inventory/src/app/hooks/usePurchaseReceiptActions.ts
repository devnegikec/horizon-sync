import { useState } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks';
import { purchaseReceiptApi } from '../utility/api';
import type { PurchaseReceipt, CreatePurchaseReceiptPayload } from '../types/purchase-receipt.types';

export function usePurchaseReceiptActions() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createPurchaseReceipt = async (payload: CreatePurchaseReceiptPayload): Promise<PurchaseReceipt | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await purchaseReceiptApi.create(accessToken, payload);
      toast({
        title: 'Success',
        description: 'Purchase Receipt created successfully. Stock levels updated.',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Purchase Receipt';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createPurchaseReceipt,
  };
}

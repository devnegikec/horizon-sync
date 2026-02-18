import { useState } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks';
import { purchaseOrderApi } from '../utility/api';
import type { PurchaseOrder, CreatePurchaseOrderPayload, UpdatePurchaseOrderPayload } from '../types/purchase-order.types';

export function usePurchaseOrderActions() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createPurchaseOrder = async (payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder | null> => {
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
      const result = await purchaseOrderApi.create(accessToken, payload);
      toast({
        title: 'Success',
        description: 'Purchase Order created successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Purchase Order';
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

  const updatePurchaseOrder = async (id: string, payload: UpdatePurchaseOrderPayload): Promise<PurchaseOrder | null> => {
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
      const result = await purchaseOrderApi.update(accessToken, id, payload);
      toast({
        title: 'Success',
        description: 'Purchase Order updated successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update Purchase Order';
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

  const deletePurchaseOrder = async (id: string): Promise<boolean> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      await purchaseOrderApi.delete(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order deleted successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Purchase Order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
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
      const result = await purchaseOrderApi.submit(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order submitted successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit Purchase Order';
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

  const cancelPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
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
      const result = await purchaseOrderApi.cancel(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order cancelled successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel Purchase Order';
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

  const closePurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
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
      const result = await purchaseOrderApi.close(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order closed successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close Purchase Order';
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
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    submitPurchaseOrder,
    cancelPurchaseOrder,
    closePurchaseOrder,
  };
}

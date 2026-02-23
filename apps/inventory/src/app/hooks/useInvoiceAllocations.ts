import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@horizon-sync/ui/hooks';
import { paymentApi } from '../utility/api';
import type { PaymentReference, AllocationCreate } from '../types/payment.types';

export function useInvoiceAllocations(paymentId: string | null) {
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<PaymentReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllocations = useCallback(async () => {
    if (!paymentId) {
      setAllocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payment = await paymentApi.fetchPaymentById(paymentId);
      setAllocations(payment.payment_references || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch allocations';
      setError(errorMessage);
      console.error('Error fetching allocations:', err);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const createAllocation = async (
    allocation: AllocationCreate
  ): Promise<PaymentReference | null> => {
    if (!paymentId) {
      toast({
        title: 'Error',
        description: 'Payment not selected',
        variant: 'destructive',
      });
      return null;
    }

    setActionLoading(true);
    try {
      const result = await paymentApi.createAllocation(paymentId, allocation);
      toast({
        title: 'Success',
        description: 'Allocation created successfully',
      });
      await fetchAllocations();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create allocation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const removeAllocation = async (allocationId: string): Promise<boolean> => {
    if (!paymentId) {
      toast({
        title: 'Error',
        description: 'Payment not selected',
        variant: 'destructive',
      });
      return false;
    }

    setActionLoading(true);
    try {
      await paymentApi.deleteAllocation(allocationId);
      toast({
        title: 'Success',
        description: 'Allocation removed successfully',
      });
      await fetchAllocations();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove allocation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const calculateRemainingAmount = useCallback(
    (totalAmount: number): number => {
      const allocatedAmount = allocations.reduce(
        (sum, allocation) => sum + allocation.allocated_amount,
        0
      );
      return Math.max(0, totalAmount - allocatedAmount);
    },
    [allocations]
  );

  // Memoize total allocated amount for performance
  const totalAllocated = useMemo(() => 
    allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0),
    [allocations]
  );

  const refetch = useCallback(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  return {
    allocations,
    loading,
    error,
    actionLoading,
    totalAllocated,
    createAllocation,
    removeAllocation,
    calculateRemainingAmount,
    refetch,
  };
}

import { useState, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { landedCostApi } from '../utility/api/landed-costs';
import type {
  LandedCostVoucher,
  CreateLandedCostVoucherPayload,
  UpdateLandedCostVoucherPayload,
} from '../types/landed-cost.types';

export function useLandedCostActions() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLandedCost = useCallback(
    async (payload: CreateLandedCostVoucherPayload): Promise<LandedCostVoucher | null> => {
      if (!accessToken) {
        setError('Not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await landedCostApi.create(accessToken, payload);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create landed cost voucher';
        setError(errorMessage);
        console.error('Error creating landed cost voucher:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  const updateLandedCost = useCallback(
    async (id: string, payload: UpdateLandedCostVoucherPayload): Promise<LandedCostVoucher | null> => {
      if (!accessToken) {
        setError('Not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await landedCostApi.update(accessToken, id, payload);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update landed cost voucher';
        setError(errorMessage);
        console.error('Error updating landed cost voucher:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  const deleteLandedCost = useCallback(
    async (id: string): Promise<boolean> => {
      if (!accessToken) {
        setError('Not authenticated');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await landedCostApi.delete(accessToken, id);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete landed cost voucher';
        setError(errorMessage);
        console.error('Error deleting landed cost voucher:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  return {
    loading,
    error,
    createLandedCost,
    updateLandedCost,
    deleteLandedCost,
  };
}

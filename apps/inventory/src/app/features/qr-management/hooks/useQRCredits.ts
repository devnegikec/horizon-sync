import { useCallback, useEffect, useState } from 'react';

import axios from 'axios';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../../environments/environment';
import type { QRCreditAddRequest, QRCreditBalance } from '../types/qrCredit.types';
import { getApiErrorMessage } from '../utils/apiError';

export const useQRCredits = () => {
  const [summary, setSummary] = useState<QRCreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useUserStore((s) => s.accessToken);

  const fetchCredits = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get<QRCreditBalance>(`${environment.apiCoreUrl}/api/v1/qr-credits/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSummary(res.data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to fetch credits'));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const addCredits = useCallback(
    async (organizationId: string, data: Omit<QRCreditAddRequest, 'reference_id'>) => {
      if (!accessToken) {
        throw new Error('You must be logged in to add QR credits');
      }

      try {
        const response = await axios.post<QRCreditBalance>(
          `${environment.apiCoreUrl}/api/v1/qr-credits/organizations/${organizationId}/add`,
          { ...data, reference_id: crypto.randomUUID() },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setSummary(response.data);
        setError(null);
        return response.data;
      } catch (err: unknown) {
        throw new Error(getApiErrorMessage(err, 'Failed to add QR credits'));
      }
    },
    [accessToken],
  );

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    summary,
    credits: summary?.balance_credits ?? null,
    loading,
    error,
    refetch: fetchCredits,
    addCredits,
  };
};

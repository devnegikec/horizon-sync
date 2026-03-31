import { useState, useEffect } from 'react';
import axios from 'axios';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../../environments/environment';

interface QRCreditsResponse {
  balance_credits: number;
  organization_id: string;
  last_updated: string;
}

export const useQRCredits = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useUserStore((s) => s.accessToken);

  const fetchCredits = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get<QRCreditsResponse>(
        `${environment.apiCoreUrl}/api/v1/qr-credits/balance`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setCredits(res.data.balance_credits);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch credits');
      setCredits(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [accessToken]);

  return { credits, loading, error, refetch: fetchCredits };
};

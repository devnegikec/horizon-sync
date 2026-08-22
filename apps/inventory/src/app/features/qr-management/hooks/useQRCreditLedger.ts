import * as React from 'react';

import axios from 'axios';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../../environments/environment';
import type { QRCreditLedgerResponse } from '../types/qrCredit.types';
import { getApiErrorMessage } from '../utils/apiError';

export function useQRCreditLedger(pageSize = 5) {
  const accessToken = useUserStore((state) => state.accessToken);
  const [data, setData] = React.useState<QRCreditLedgerResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLedger = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get<QRCreditLedgerResponse>(
        `${environment.apiCoreUrl}/api/v1/qr-credits/ledger`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page: 1, page_size: pageSize },
        },
      );
      setData(response.data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to fetch credit history'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, pageSize]);

  React.useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return { data, loading, error, refetch: fetchLedger };
}

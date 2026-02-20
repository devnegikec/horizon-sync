import { useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

import type { SendEmailRequest, SendEmailResponse } from '../types/communication.types';
import { communicationApi } from '../utility/api/communications';

export const useSendEmail = () => {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (data: SendEmailRequest): Promise<SendEmailResponse> => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await communicationApi.sendEmail(accessToken, data);
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendEmail, loading, error };
};

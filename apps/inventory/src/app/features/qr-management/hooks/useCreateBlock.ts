import { useState } from 'react';

import { qrBlockService } from '../services/qrBlockService';
import type { QRBlock, QRBlockCreate } from '../types/qrBlock.types';
import { getApiErrorMessage } from '../utils/apiError';

export const useCreateBlock = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBlock = async (productId: string, data: QRBlockCreate): Promise<QRBlock> => {
    setLoading(true);
    setError(null);
    try {
      return await qrBlockService.createBlock(productId, data);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to create block');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createBlock, loading, error };
};

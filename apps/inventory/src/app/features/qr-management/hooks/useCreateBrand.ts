import { useState } from 'react';

import { brandService } from '../services/brandService';
import type { Brand, BrandCreate } from '../types/brand.types';

export const useCreateBrand = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBrand = async (data: BrandCreate): Promise<Brand> => {
    setLoading(true);
    setError(null);
    try {
      return await brandService.create(data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create brand';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createBrand, loading, error };
};

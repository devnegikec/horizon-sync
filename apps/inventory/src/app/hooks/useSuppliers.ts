import { useState, useEffect } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { supplierApi } from '../utility/api';
import type { Supplier, SuppliersResponse } from '../types/supplier.types';

export function useSuppliers(page = 1, pageSize = 100) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setSuppliers([]);
      return;
    }

    const fetchSuppliers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await supplierApi.list(accessToken, page, pageSize) as SuppliersResponse;
        setSuppliers(response.suppliers || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch suppliers';
        setError(errorMessage);
        console.error('Error fetching suppliers:', err);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [accessToken, page, pageSize]);

  return {
    suppliers,
    loading,
    error,
  };
}

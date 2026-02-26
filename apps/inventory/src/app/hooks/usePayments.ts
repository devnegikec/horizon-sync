import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../utility/api';
import type { PaymentEntry, PaymentFilters } from '../types/payment.types';

const DEFAULT_FILTERS: Partial<PaymentFilters> = {
  page: 1,
  page_size: 10,
  sort_by: 'payment_date',
  sort_order: 'desc',
};

export function usePayments(filters: Partial<PaymentFilters> = {}) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const effectiveFilters = { ...DEFAULT_FILTERS, ...filters };

    try {
      const response = await paymentApi.fetchPayments(effectiveFilters);
      setPayments(response.payment_entries || []);
      setTotalCount(response.pagination?.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
      console.error('Error fetching payments:', err);
      setPayments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const refetch = useCallback(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    totalCount,
    refetch,
  };
}

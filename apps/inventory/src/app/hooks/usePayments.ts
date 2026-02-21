import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../utility/api';
import type { PaymentEntry, PaymentFilters } from '../types/payment.types';

export function usePayments(initialFilters: Partial<PaymentFilters> = {}) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Partial<PaymentFilters>>({
    search: '',
    page: 1,
    page_size: 10,
    sort_by: 'payment_date',
    sort_order: 'desc',
    ...initialFilters,
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.fetchPayments(filters);
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
    filters,
    setFilters,
    refetch,
  };
}

import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { Customer, CustomerResponse } from '../types/customer.types';

interface UseCustomersParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

interface UseCustomersReturn {
  customers: Customer[];
  pagination: CustomerResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const API_BASE_URL = environment.apiCoreUrl;

export function useCustomers(params: UseCustomersParams = {}): UseCustomersReturn {
  const accessToken = useUserStore((s) => s.accessToken);
  const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'desc', search = '', status = '' } = params;

  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [pagination, setPagination] = React.useState<CustomerResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCustomers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (search) {
        searchParams.append('search', search);
      }

      if (status && status !== 'all') {
        searchParams.append('status', status);
      }

      const response = await fetch(`${API_BASE_URL}/customers?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const data: CustomerResponse = await response.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCustomers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search, status]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    pagination,
    loading,
    error,
    refetch: fetchCustomers,
  };
}

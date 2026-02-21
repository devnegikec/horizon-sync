import { useState, useEffect } from 'react';
import { getReconciliationReport, exportReconciliationReport } from '../utility/api/payments';

export interface ReconciliationFilters {
  date_from?: string;
  date_to?: string;
  party_id?: string;
  payment_mode?: string;
  status?: string;
}

export interface ReconciliationReportData {
  date_from: string;
  date_to: string;
  total_payments_received: number;
  total_allocated: number;
  total_unallocated: number;
  payments_by_status: {
    draft: number;
    confirmed: number;
    cancelled: number;
  };
  payments_by_mode: {
    cash: number;
    check: number;
    bank_transfer: number;
  };
  payments: Array<{
    id: string;
    receipt_number: string;
    payment_date: string;
    party_name: string;
    amount: number;
    currency_code: string;
    payment_mode: string;
    status: string;
    unallocated_amount: number;
    allocations: Array<{
      invoice_no: string;
      allocated_amount: number;
    }>;
  }>;
}

export function usePaymentReports(filters: ReconciliationFilters) {
  const [reportData, setReportData] = useState<ReconciliationReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReconciliationReport(filters);
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      await exportReconciliationReport(filters, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters.date_from, filters.date_to, filters.party_id, filters.payment_mode, filters.status]);

  return {
    reportData,
    loading,
    error,
    refetch: fetchReport,
    exportReport,
  };
}

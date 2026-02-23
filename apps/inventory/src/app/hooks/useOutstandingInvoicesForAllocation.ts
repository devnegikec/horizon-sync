import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { invoiceApi } from '../utility/api/invoices';
import type { InvoiceForAllocation } from '../types/payment.types';

/**
 * Fetches invoices for a party that have outstanding balance > 0, for payment allocation.
 * Maps to InvoiceForAllocation (invoice_no, invoice_date, total_amount, balance_due, etc.).
 */
export function useOutstandingInvoicesForAllocation(
  partyId: string | null,
  paymentType: 'Customer_Payment' | 'Supplier_Payment'
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [invoices, setInvoices] = useState<InvoiceForAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!partyId || !accessToken) {
      setInvoices([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const invoiceType = paymentType === 'Supplier_Payment' ? 'purchase' : 'sales';
      const response = await invoiceApi.list(accessToken, 1, 100, {
        party_id: partyId,
        invoice_type: invoiceType,
        sort_by: 'posting_date',
        sort_order: 'desc',
      });
      const list = response?.invoices ?? [];
      const mapped: InvoiceForAllocation[] = list
        .filter((inv: { outstanding_amount?: number }) => (inv.outstanding_amount ?? 0) > 0)
        .map((inv: {
          id: string;
          invoice_no: string;
          posting_date: string;
          grand_total: number;
          outstanding_amount?: number;
          currency?: string;
          status?: string;
        }) => ({
          id: inv.id,
          invoice_no: inv.invoice_no,
          invoice_date: inv.posting_date,
          total_amount: Number(inv.grand_total),
          balance_due: Number(inv.outstanding_amount ?? inv.grand_total),
          currency: inv.currency ?? 'USD',
          status: inv.status ?? 'pending',
        }));
      setInvoices(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [partyId, paymentType, accessToken]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, loading, error, refetch: fetchInvoices };
}

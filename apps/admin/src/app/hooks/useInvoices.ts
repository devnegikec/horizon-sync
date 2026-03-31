import { useQuery } from '@tanstack/react-query';

import { AdminInvoiceService } from '../services/admin-invoice.service';
import type { AdminInvoiceFilters, InvoiceListResponse } from '../types/billing.types';

export const useInvoices = (filters?: AdminInvoiceFilters) => {
  return useQuery<InvoiceListResponse>({
    queryKey: ['admin-invoices', filters],
    queryFn: () => AdminInvoiceService.list(filters),
  });
};
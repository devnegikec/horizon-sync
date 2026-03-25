import { useQuery } from '@tanstack/react-query';

import { AdminInvoiceService } from '../services/admin-invoice.service';
import type { AdminInvoiceFilters } from '../types';

export function useInvoices(filters?: AdminInvoiceFilters) {
  return useQuery({
    queryKey: ['admin-invoices', filters],
    queryFn: () => AdminInvoiceService.list(filters),
  });
}

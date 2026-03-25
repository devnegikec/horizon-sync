import { useQuery } from '@tanstack/react-query';

import { AdminInvoiceService } from '../services/admin-invoice.service';

export function useInvoiceStats(organizationId?: string) {
  return useQuery({
    queryKey: ['admin-invoice-stats', organizationId],
    queryFn: () => AdminInvoiceService.getStats(organizationId),
  });
}

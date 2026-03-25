import { useQuery } from '@tanstack/react-query';

import { AdminInvoiceService } from '../services/admin-invoice.service';

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['admin-invoice', id],
    queryFn: () => AdminInvoiceService.getById(id),
    enabled: !!id,
  });
}

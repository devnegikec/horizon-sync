import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qrCreditService } from '../services/qr-credit.service';
import type { QRCreditAddRequest } from '../types/qr-credit.types';

export function useOrganizationCredits(organizationId: string) {
  return useQuery({
    queryKey: ['organization-qr-credits', organizationId],
    queryFn: () => qrCreditService.getBalance(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useOrganizationCreditLedger(organizationId: string) {
  return useQuery({
    queryKey: ['organization-qr-credit-ledger', organizationId],
    queryFn: () => qrCreditService.getLedger(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useAddOrganizationCredits(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QRCreditAddRequest) =>
      qrCreditService.addCredits(organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-qr-credits', organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization-qr-credit-ledger', organizationId],
      });
    },
  });
}

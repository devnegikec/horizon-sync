import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AdminOrganizationService } from '../services/admin-organization.service';
import type { AdminOrgCreate } from '../types';

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminOrgCreate) => AdminOrganizationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

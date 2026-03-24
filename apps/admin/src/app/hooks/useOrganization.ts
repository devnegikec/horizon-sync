import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminOrganizationService } from '../services/admin-organization.service';
import type { AdminOrgUpdate } from '../types';

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => AdminOrganizationService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminOrgUpdate }) =>
      AdminOrganizationService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

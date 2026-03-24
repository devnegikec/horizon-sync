import { useQuery } from '@tanstack/react-query';

import { AdminOrganizationService } from '../services/admin-organization.service';
import type { AdminOrgFilters } from '../types';

export function useOrganizations(filters?: AdminOrgFilters) {
  return useQuery({
    queryKey: ['organizations', filters],
    queryFn: () => AdminOrganizationService.list(filters),
  });
}

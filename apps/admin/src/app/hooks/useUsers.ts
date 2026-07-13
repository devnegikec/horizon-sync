import { useQuery } from '@tanstack/react-query';

import { AdminUserService } from '../services/admin-user.service';
import type { AdminUserFilters } from '../types';

export function useUsers(filters?: AdminUserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => AdminUserService.list(filters),
  });
}

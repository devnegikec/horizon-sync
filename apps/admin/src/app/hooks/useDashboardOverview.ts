import { useQuery } from '@tanstack/react-query';

import { AdminDashboardService } from '../services/admin-dashboard.service';
import type { DashboardFilters } from '../types';

export function useDashboardOverview(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard-overview', filters],
    queryFn: () => AdminDashboardService.getOverview(filters),
  });
}

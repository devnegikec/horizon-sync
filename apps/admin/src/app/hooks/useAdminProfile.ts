import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';

import { AdminAuthService } from '../services/admin-auth.service';

export function useAdminProfile() {
  const accessToken = useUserStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => AdminAuthService.getAdminProfile(accessToken as string),
    enabled: !!accessToken,
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminUserService } from '../services/admin-user.service';
import type { AdminUserUpdate } from '../types';

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => AdminUserService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUserUpdate }) =>
      AdminUserService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

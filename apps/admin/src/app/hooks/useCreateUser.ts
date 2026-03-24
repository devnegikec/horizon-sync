import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AdminUserService } from '../services/admin-user.service';
import type { AdminUserCreate } from '../types';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminUserCreate) => AdminUserService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

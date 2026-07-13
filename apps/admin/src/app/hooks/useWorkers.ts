import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminWorkerService } from '../services/admin-worker.service';
import type { AdminWorkerCreate, AdminWorkerFilters } from '../types';

export function useWorkers(filters?: AdminWorkerFilters) {
  return useQuery({
    queryKey: ['workers', filters],
    queryFn: () => AdminWorkerService.list(filters),
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminWorkerCreate) => AdminWorkerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useWorkerQRImage(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['worker-qr-image', userId],
    queryFn: () => AdminWorkerService.getWorkerQRImage(userId),
    enabled: !!userId && enabled,
    staleTime: 0, // always fetch fresh QR
  });
}

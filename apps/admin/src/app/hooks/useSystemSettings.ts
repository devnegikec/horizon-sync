import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { SystemSettingsService, type SystemSettings, type SystemSettingsUpdate } from '../services/system-settings.service';

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: () => SystemSettingsService.getSystemSettings(),
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: () => SystemSettingsService.getSystemStats(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => SystemSettingsService.testSystemHealth(),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

export function useMasterOrganization() {
  return useQuery({
    queryKey: ['master-organization'],
    queryFn: () => SystemSettingsService.getMasterOrganization(),
  });
}

export function useSystemAdminUsers() {
  return useQuery({
    queryKey: ['system-admin-users'],
    queryFn: () => SystemSettingsService.getSystemAdminUsers(),
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: SystemSettingsUpdate) => SystemSettingsService.updateSystemSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}

export function useUpdateMasterOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Parameters<typeof SystemSettingsService.updateMasterOrganization>[0]) =>
      SystemSettingsService.updateMasterOrganization(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-organization'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}
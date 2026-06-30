import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api/plannerApi';
import type { UserSettings } from '../types';

export function useGetSettings() {
  return useQuery<UserSettings, Error>({
    queryKey: ['settings'] as const,
    queryFn: plannerApi.getSettings,
    staleTime: 1000 * 60 * 10, // Cache settings for 10 minutes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<UserSettings, Error, { workStartHour?: number; workEndHour?: number; breakDurationMinutes?: number; focusIntervalMinutes?: number; emergencyThresholdHours?: number; notificationsEnabled?: boolean; theme?: string }>({
    mutationFn: plannerApi.updateSettings,
    onSuccess: (newSettings) => {
      queryClient.setQueryData(['settings'], newSettings);
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      // Invalidate planner and emergency state to match new working hour boundaries immediately
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
      void queryClient.invalidateQueries({ queryKey: ['emergency'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api/plannerApi';
import { QUERY_KEYS } from '../constants';
import type { DailyPlan, Task, Notification, AnalyticsSummary, EmergencyPlan, EmergencyStatus } from '../types';

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────

export function useGetPlan() {
  return useQuery<DailyPlan, Error>({
    queryKey: QUERY_KEYS.PLAN,
    queryFn: plannerApi.getTodayPlan,
  });
}

export function useGetNotifications() {
  return useQuery<Notification[], Error>({
    queryKey: ['notifications'] as const,
    queryFn: plannerApi.getNotifications,
    refetchInterval: 12000, // Poll alerts every 12 seconds
  });
}

export function useGetAnalytics() {
  return useQuery<AnalyticsSummary, Error>({
    queryKey: ['analytics'] as const,
    queryFn: plannerApi.getAnalyticsSummary,
  });
}

export function useGetEmergencyStatus() {
  return useQuery<EmergencyStatus, Error>({
    queryKey: ['emergency', 'status'] as const,
    queryFn: plannerApi.getEmergencyStatus,
    refetchInterval: 10000, // Poll emergency trigger state every 10 seconds
  });
}

export function useGetEmergencyPlan() {
  return useQuery<EmergencyPlan, Error>({
    queryKey: ['emergency', 'plan'] as const,
    queryFn: plannerApi.getEmergencyPlan,
  });
}

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

export function useGeneratePlan() {
  const queryClient = useQueryClient();

  return useMutation<DailyPlan, Error, void>({
    mutationFn: plannerApi.generatePlan,
    onSuccess: (newPlan) => {
      queryClient.setQueryData(QUERY_KEYS.PLAN, newPlan);
    },
  });
}

export function useReprioritize() {
  const queryClient = useQueryClient();

  return useMutation<Task[], Error, void>({
    mutationFn: plannerApi.reprioritizeTasks,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAN });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string>({
    mutationFn: plannerApi.markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: plannerApi.markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useToggleEmergencyMode() {
  const queryClient = useQueryClient();

  return useMutation<{ active: boolean }, Error, boolean>({
    mutationFn: plannerApi.toggleEmergencyMode,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['emergency', 'status'] });
      void queryClient.invalidateQueries({ queryKey: ['emergency', 'plan'] });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAN });
    },
  });
}

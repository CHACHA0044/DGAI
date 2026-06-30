import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api/plannerApi';
import type { Goal } from '../types';

export function useGetGoals(status?: string) {
  return useQuery<Goal[], Error>({
    queryKey: ['goals', status || 'all'] as const,
    queryFn: () => plannerApi.getGoals(status),
  });
}

export function useGetGoalsSummary() {
  return useQuery({
    queryKey: ['goals', 'summary'] as const,
    queryFn: plannerApi.getGoalsSummary,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation<Goal, Error, { title: string; description?: string; type?: string; targetDate?: string; linkedTaskIds?: string[] }>({
    mutationFn: plannerApi.createGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation<Goal, Error, { id: string; data: { title?: string; description?: string; type?: string; status?: string; targetDate?: string; progress?: number; linkedTaskIds?: string[] } }>({
    mutationFn: ({ id, data }) => plannerApi.updateGoal(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] });
      void queryClient.invalidateQueries({ queryKey: ['goals', variables.id] });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation<Goal, Error, { id: string; progress: number }>({
    mutationFn: ({ id, progress }) => plannerApi.updateGoalProgress(id, progress),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] });
      void queryClient.invalidateQueries({ queryKey: ['goals', variables.id] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: plannerApi.deleteGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

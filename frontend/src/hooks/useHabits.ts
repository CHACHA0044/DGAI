import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api/plannerApi';
import type { Habit } from '../types';

export function useGetHabits(frequency?: string) {
  return useQuery<Habit[], Error>({
    queryKey: ['habits', frequency || 'all'] as const,
    queryFn: () => plannerApi.getHabits(frequency),
  });
}

export function useGetHabitsSummary() {
  return useQuery({
    queryKey: ['habits', 'summary'] as const,
    queryFn: plannerApi.getHabitsSummary,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation<Habit, Error, { name: string; description?: string; frequency?: string }>({
    mutationFn: plannerApi.createHabit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation<Habit, Error, { id: string; data: { name?: string; description?: string; frequency?: string } }>({
    mutationFn: ({ id, data }) => plannerApi.updateHabit(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation<Habit, Error, string>({
    mutationFn: plannerApi.completeHabit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: plannerApi.deleteHabit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

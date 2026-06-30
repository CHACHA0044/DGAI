import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api/plannerApi';
import type { CalendarEvent } from '../types';

export function useGetCalendarEvents(start?: string, end?: string) {
  return useQuery<CalendarEvent[], Error>({
    queryKey: ['calendar', 'events', start, end] as const,
    queryFn: () => plannerApi.getCalendarEvents(start, end),
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, { title: string; description?: string; startAt: string; endAt: string; taskId?: string; habitId?: string; type?: string; isBlocked?: boolean; color?: string }>({
    mutationFn: plannerApi.createCalendarEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, { id: string; data: { title?: string; description?: string; startAt?: string; endAt?: string; type?: string; isBlocked?: boolean; color?: string } }>({
    mutationFn: ({ id, data }) => plannerApi.updateCalendarEvent(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: plannerApi.deleteCalendarEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useGetFreeSlots(date?: string, minDuration?: number) {
  return useQuery({
    queryKey: ['calendar', 'free-slots', date, minDuration] as const,
    queryFn: () => plannerApi.getFreeSlots(date, minDuration),
  });
}

export function useSyncPlannerToCalendar() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent[], Error, any[]>({
    mutationFn: plannerApi.syncPlannerToCalendar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

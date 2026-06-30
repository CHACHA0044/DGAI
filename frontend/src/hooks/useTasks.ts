import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { taskApi } from '../api/taskApi';
import { QUERY_KEYS } from '../constants';
import type { Task, TasksResponse, CreateTaskData, UpdateTaskData } from '../types';

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────

export function useTasks(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): UseQueryResult<TasksResponse, Error> {
  return useQuery({
    queryKey: [...QUERY_KEYS.TASKS, params],
    queryFn: () => taskApi.getAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useTask(id: string): UseQueryResult<Task, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.TASK(id),
    queryFn: () => taskApi.getById(id),
    enabled: id.length > 0,
  });
}

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskData>({
    mutationFn: taskApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { id: string; data: UpdateTaskData }>({
    mutationFn: ({ id, data }) => taskApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.TASK(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
    },
  });
}

export function useAnalyzeTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, string>({
    mutationFn: taskApi.analyze,
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.TASK(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
    },
  });
}

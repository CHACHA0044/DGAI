import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api/plannerApi';
import type { UserInsight } from '../types';

export function useGetInsights() {
  return useQuery<UserInsight[], Error>({
    queryKey: ['insights'] as const,
    queryFn: plannerApi.getInsights,
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation<UserInsight[], Error, void>({
    mutationFn: plannerApi.generateInsights,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

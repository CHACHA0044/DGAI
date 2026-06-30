import { useQuery } from '@tanstack/react-query';
import { plannerApi } from '../api/plannerApi';
import type { CoachingAdvice } from '../types';

export function useGetCoachingAdvice() {
  return useQuery<CoachingAdvice, Error>({
    queryKey: ['coach', 'advice'] as const,
    queryFn: plannerApi.getCoachingAdvice,
    staleTime: 1000 * 60 * 10, // Cache coaching advice for 10 minutes
  });
}

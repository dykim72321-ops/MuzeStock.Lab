import { useQuery } from '@tanstack/react-query';
import { fetchStrategyStats, type StrategyStats } from '../services/pythonApiService';

export function useStrategyStats() {
  return useQuery<StrategyStats | null>({
    queryKey: ['strategy-stats'],
    queryFn: fetchStrategyStats,
    staleTime: 60 * 1000,   // 1분 캐시 (두 페이지가 공유)
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });
}

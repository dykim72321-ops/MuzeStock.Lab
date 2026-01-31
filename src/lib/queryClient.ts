import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 15 * 60 * 1000, // 15분 (구 cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

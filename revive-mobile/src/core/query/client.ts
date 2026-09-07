import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        return failureCount < 2 && (status === 0 || status === 429 || (status ?? 500) >= 500);
      },
    },
    mutations: { retry: false },
  },
});

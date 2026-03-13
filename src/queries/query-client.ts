import { QueryClient } from '@tanstack/react-query'

export const DEFAULT_STALE_TIME_MS = 30_000
export const DEFAULT_GC_TIME_MS = 5 * 60_000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      gcTime: DEFAULT_GC_TIME_MS,
      refetchOnWindowFocus: false,
    },
  },
})
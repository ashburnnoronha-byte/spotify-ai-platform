import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { analyticsApi } from '../services/api'
import { useAuth } from './useAuth'
import type { TimeRange } from '../types'

export function useAnalyticsDashboard(timeRange: TimeRange = 'medium_term') {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['analytics', 'dashboard', timeRange],
    queryFn: () => analyticsApi.getDashboard(timeRange),
    enabled: isAuthenticated,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: AxiosError) =>
      error.response?.status === 429 && failureCount < 3,
    retryDelay: (attemptIndex: number) => Math.min(2000 * 2 ** attemptIndex, 30000),
  })
}

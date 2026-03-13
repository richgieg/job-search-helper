import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import { queryKeys } from './query-keys'

export const useDashboardSummaryQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboardSummary(),
    queryFn: () => getAppApiClient().getDashboardSummary(),
  })
import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import type { DashboardActivityPeriodDays } from '../api/read-models'
import { queryKeys } from './query-keys'

export const useDashboardActivityQuery = (periodDays: DashboardActivityPeriodDays) =>
  useQuery({
    queryKey: queryKeys.dashboardActivity(periodDays),
    queryFn: () => getAppApiClient().getDashboardActivity(periodDays),
  })
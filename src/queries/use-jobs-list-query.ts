import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import { queryKeys } from './query-keys'

export const useJobsListQuery = () =>
  useQuery({
    queryKey: queryKeys.jobsList(),
    queryFn: () => getAppApiClient().getJobsList(),
  })
import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import { queryKeys } from './query-keys'

export const useJobDetailQuery = (jobId: string) =>
  useQuery({
    enabled: Boolean(jobId),
    queryKey: queryKeys.jobsDetail(jobId),
    queryFn: () => getAppApiClient().getJobDetail(jobId),
  })
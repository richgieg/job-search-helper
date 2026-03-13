import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import { queryKeys } from './query-keys'

export const useProfilesListQuery = (kind: 'base' | 'job' | 'all') =>
  useQuery({
    queryKey: queryKeys.profilesList(kind),
    queryFn: () => getAppApiClient().getProfilesList(kind),
  })
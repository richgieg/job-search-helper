import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import { queryKeys } from './query-keys'

export const useProfileDetailQuery = (profileId: string) =>
  useQuery({
    enabled: Boolean(profileId),
    queryKey: queryKeys.profilesDetail(profileId),
    queryFn: () => getAppApiClient().getProfileDetail(profileId),
  })
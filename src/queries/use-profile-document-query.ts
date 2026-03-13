import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import { queryKeys } from './query-keys'

export const useProfileDocumentQuery = (profileId: string) =>
  useQuery({
    enabled: Boolean(profileId),
    queryKey: queryKeys.profilesDocument(profileId),
    queryFn: () => getAppApiClient().getProfileDocument(profileId),
  })
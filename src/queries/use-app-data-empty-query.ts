import { useQuery } from '@tanstack/react-query'

import { getAppApiClient } from '../api'
import { queryKeys } from './query-keys'

export const useAppDataEmptyQuery = () =>
  useQuery({
    queryKey: queryKeys.appDataEmpty(),
    queryFn: () => getAppApiClient().isAppDataEmpty(),
  })
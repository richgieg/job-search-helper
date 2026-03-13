import { useMemo } from 'react'

import type { JobDetailDto, ProfilesListItemDto } from '../../api/read-models'
import type { Profile } from '../../types/state'
import { useProfilesListQuery } from '../../queries/use-profiles-list-query'

export interface JobEditorProfilesModel {
  attachedProfiles: Profile[]
  baseProfiles: ProfilesListItemDto[]
}

export interface JobEditorModel {
  profiles: JobEditorProfilesModel
}

export const useJobEditorModel = (jobDetail: JobDetailDto | null | undefined): JobEditorModel => {
  const { data: baseProfilesList } = useProfilesListQuery('base')

  return useMemo(
    () => ({
      profiles: {
        attachedProfiles: [...(jobDetail?.relatedProfiles ?? [])].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
        baseProfiles: baseProfilesList?.items ?? [],
      },
    }),
    [baseProfilesList?.items, jobDetail?.relatedProfiles],
  )
}
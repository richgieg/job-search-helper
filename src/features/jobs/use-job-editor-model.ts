import { useMemo } from 'react'

import type { JobDetailDto, ProfilesListItemDto } from '../../api/read-models'
import type { JobLink, Profile } from '../../types/state'
import { useProfilesListQuery } from '../../queries/use-profiles-list-query'

export interface JobEditorProfilesModel {
  attachedProfiles: Profile[]
  baseProfiles: ProfilesListItemDto[]
}

export interface JobEditorLinksModel {
  jobLinks: JobLink[]
}

export interface JobEditorModel {
  profiles: JobEditorProfilesModel
  links: JobEditorLinksModel
}

export const useJobEditorModel = (jobDetail: JobDetailDto | null | undefined): JobEditorModel => {
  const { data: baseProfilesList } = useProfilesListQuery('base')

  return useMemo(
    () => ({
      profiles: {
        attachedProfiles: [...(jobDetail?.relatedProfiles ?? [])].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
        baseProfiles: baseProfilesList?.items ?? [],
      },
      links: {
        jobLinks: [...(jobDetail?.jobLinks ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
      },
    }),
    [baseProfilesList?.items, jobDetail?.jobLinks, jobDetail?.relatedProfiles],
  )
}
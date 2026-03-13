import { useMemo } from 'react'

import type { JobDetailDto, JobDetailInterviewDto, ProfilesListItemDto } from '../../api/read-models'
import type { ApplicationQuestion, JobContact, JobLink, Profile } from '../../types/state'
import { useProfilesListQuery } from '../../queries/use-profiles-list-query'

export interface JobEditorProfilesModel {
  attachedProfiles: Profile[]
  baseProfiles: ProfilesListItemDto[]
}

export interface JobEditorLinksModel {
  jobLinks: JobLink[]
}

export interface JobEditorContactsModel {
  jobContacts: JobContact[]
}

export interface JobEditorInterviewsModel {
  interviews: JobDetailInterviewDto[]
}

export interface JobEditorApplicationQuestionsModel {
  applicationQuestions: ApplicationQuestion[]
}

export interface JobEditorModel {
  profiles: JobEditorProfilesModel
  links: JobEditorLinksModel
  contacts: JobEditorContactsModel
  interviews: JobEditorInterviewsModel
  applicationQuestions: JobEditorApplicationQuestionsModel
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
      contacts: {
        jobContacts: [...(jobDetail?.jobContacts ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
      },
      interviews: {
        interviews: [...(jobDetail?.interviews ?? [])]
          .map((item) => ({
            ...item,
            contacts: [...item.contacts].sort((left, right) => left.interviewContact.sortOrder - right.interviewContact.sortOrder),
          }))
          .sort((left, right) => {
            if (!left.interview.startAt && !right.interview.startAt) {
              return 0
            }

            if (!left.interview.startAt) {
              return 1
            }

            if (!right.interview.startAt) {
              return -1
            }

            return left.interview.startAt.localeCompare(right.interview.startAt)
          }),
      },
      applicationQuestions: {
        applicationQuestions: [...(jobDetail?.applicationQuestions ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
      },
    }),
    [baseProfilesList?.items, jobDetail?.applicationQuestions, jobDetail?.interviews, jobDetail?.jobContacts, jobDetail?.jobLinks, jobDetail?.relatedProfiles],
  )
}
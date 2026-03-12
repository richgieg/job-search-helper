import { create } from 'zustand'

import { getAppApiClient } from '../api'
import type {
  AddInterviewContactInput,
  CreateJobInput,
  JobMutationResult,
  ReorderInterviewContactsInput,
  ReorderJobEntitiesInput,
  SetJobAppliedAtInput,
  SetJobFinalOutcomeInput,
  UpdateApplicationQuestionInput,
  UpdateInterviewInput,
  UpdateJobContactInput,
  UpdateJobInput,
  UpdateJobLinkInput,
} from '../domain/job-data'
import type {
  DuplicateProfileInput,
  ReorderEducationBulletsInput,
  ProfileMutationResult,
  ReorderExperienceBulletsInput,
  ReorderProjectBulletsInput,
  ReorderProfileEntitiesInput,
  ReorderResumeSectionsInput,
  SetDocumentHeaderTemplateInput,
  SetResumeSectionEnabledInput,
  SetResumeSectionLabelInput,
  UpdateAchievementInput,
  UpdateEducationBulletInput,
  UpdateEducationEntryInput,
  UpdateExperienceBulletInput,
  UpdateExperienceEntryInput,
  UpdateProjectBulletInput,
  UpdateProjectInput,
  UpdateProfileLinkInput,
  UpdateProfileInput,
  UpdateSkillCategoryInput,
  UpdateSkillInput,
} from '../domain/profile-data'
import { createDefaultUiState, createEmptyDataState } from './create-initial-state'
import { defaultBulletLevel, isBulletLevel } from '../utils/bullet-levels'
import type {
  AdditionalExperienceBullet,
  AdditionalExperienceEntry,
  AppDataState,
  AppExportFile,
  AppUiState,
  BulletLevel,
  Certification,
  Id,
  Reference,
  ThemePreference,
} from '../types/state'

type AppStoreHydrationStatus = 'idle' | 'loading' | 'ready' | 'error'
type AppStoreSavingStatus = 'idle' | 'saving' | 'error'

interface AppStoreStatus {
  hydration: AppStoreHydrationStatus
  saving: AppStoreSavingStatus
  errorMessage: string | null
}

interface AppStoreState {
  data: AppDataState
  ui: AppUiState
  status: AppStoreStatus
  actions: {
    hydrate: () => Promise<void>
    createBaseProfile: (name: string) => Promise<Id | null>
    updateProfile: (input: UpdateProfileInput) => Promise<void>
    setDocumentHeaderTemplate: (input: SetDocumentHeaderTemplateInput) => Promise<void>
    setResumeSectionEnabled: (input: SetResumeSectionEnabledInput) => Promise<void>
    setResumeSectionLabel: (input: SetResumeSectionLabelInput) => Promise<void>
    reorderResumeSections: (input: ReorderResumeSectionsInput) => Promise<void>
    duplicateProfile: (input: DuplicateProfileInput) => Promise<Id | null>
    deleteProfile: (profileId: Id) => Promise<void>
    createProfileLink: (profileId: Id) => Promise<Id | null>
    updateProfileLink: (input: UpdateProfileLinkInput) => Promise<void>
    deleteProfileLink: (profileLinkId: Id) => Promise<void>
    reorderProfileLinks: (input: ReorderProfileEntitiesInput) => Promise<void>
    createSkillCategory: (profileId: Id) => Promise<Id | null>
    updateSkillCategory: (input: UpdateSkillCategoryInput) => Promise<void>
    deleteSkillCategory: (skillCategoryId: Id) => Promise<void>
    reorderSkillCategories: (input: ReorderProfileEntitiesInput) => Promise<void>
    createSkill: (skillCategoryId: Id) => Promise<Id | null>
    updateSkill: (input: UpdateSkillInput) => Promise<void>
    deleteSkill: (skillId: Id) => Promise<void>
    reorderSkills: (input: { skillCategoryId: Id; orderedIds: Id[] }) => Promise<void>
    createAchievement: (profileId: Id) => Promise<Id | null>
    updateAchievement: (input: UpdateAchievementInput) => Promise<void>
    deleteAchievement: (achievementId: Id) => Promise<void>
    reorderAchievements: (input: ReorderProfileEntitiesInput) => Promise<void>
    createExperienceEntry: (profileId: Id) => Promise<Id | null>
    updateExperienceEntry: (input: UpdateExperienceEntryInput) => Promise<void>
    deleteExperienceEntry: (experienceEntryId: Id) => Promise<void>
    reorderExperienceEntries: (input: ReorderProfileEntitiesInput) => Promise<void>
    createExperienceBullet: (experienceEntryId: Id) => Promise<Id | null>
    updateExperienceBullet: (input: UpdateExperienceBulletInput) => Promise<void>
    deleteExperienceBullet: (experienceBulletId: Id) => Promise<void>
    reorderExperienceBullets: (input: ReorderExperienceBulletsInput) => Promise<void>
    createEducationEntry: (profileId: Id) => Promise<Id | null>
    updateEducationEntry: (input: UpdateEducationEntryInput) => Promise<void>
    deleteEducationEntry: (educationEntryId: Id) => Promise<void>
    reorderEducationEntries: (input: ReorderProfileEntitiesInput) => Promise<void>
    createEducationBullet: (educationEntryId: Id) => Promise<Id | null>
    updateEducationBullet: (input: UpdateEducationBulletInput) => Promise<void>
    deleteEducationBullet: (educationBulletId: Id) => Promise<void>
    reorderEducationBullets: (input: ReorderEducationBulletsInput) => Promise<void>
    createProject: (profileId: Id) => Promise<Id | null>
    updateProject: (input: UpdateProjectInput) => Promise<void>
    deleteProject: (projectId: Id) => Promise<void>
    reorderProjects: (input: ReorderProfileEntitiesInput) => Promise<void>
    createProjectBullet: (projectId: Id) => Promise<Id | null>
    updateProjectBullet: (input: UpdateProjectBulletInput) => Promise<void>
    deleteProjectBullet: (projectBulletId: Id) => Promise<void>
    reorderProjectBullets: (input: ReorderProjectBulletsInput) => Promise<void>
    createAdditionalExperienceEntry: (profileId: Id) => Id | null
    updateAdditionalExperienceEntry: (input: {
      additionalExperienceEntryId: Id
      changes: Partial<Omit<AdditionalExperienceEntry, 'id' | 'profileId'>>
    }) => void
    deleteAdditionalExperienceEntry: (additionalExperienceEntryId: Id) => void
    reorderAdditionalExperienceEntries: (input: { profileId: Id; orderedIds: Id[] }) => void
    createAdditionalExperienceBullet: (additionalExperienceEntryId: Id) => void
    updateAdditionalExperienceBullet: (input: {
      additionalExperienceBulletId: Id
      changes: Partial<Pick<AdditionalExperienceBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>
    }) => void
    deleteAdditionalExperienceBullet: (additionalExperienceBulletId: Id) => void
    reorderAdditionalExperienceBullets: (input: { additionalExperienceEntryId: Id; orderedIds: Id[] }) => void
    createCertification: (profileId: Id) => Id | null
    updateCertification: (input: {
      certificationId: Id
      changes: Partial<Omit<Certification, 'id' | 'profileId'>>
    }) => void
    deleteCertification: (certificationId: Id) => void
    reorderCertifications: (input: { profileId: Id; orderedIds: Id[] }) => void
    createReference: (profileId: Id) => Id | null
    updateReference: (input: {
      referenceId: Id
      changes: Partial<Omit<Reference, 'id' | 'profileId'>>
    }) => void
    deleteReference: (referenceId: Id) => void
    reorderReferences: (input: { profileId: Id; orderedIds: Id[] }) => void
    createJob: (input: CreateJobInput) => Promise<Id | null>
    updateJob: (input: UpdateJobInput) => Promise<void>
    deleteJob: (jobId: Id) => Promise<void>
    createJobLink: (jobId: Id) => Promise<Id | null>
    updateJobLink: (input: UpdateJobLinkInput) => Promise<void>
    deleteJobLink: (jobLinkId: Id) => Promise<void>
    reorderJobLinks: (input: ReorderJobEntitiesInput) => Promise<void>
    createJobContact: (jobId: Id) => Promise<Id | null>
    updateJobContact: (input: UpdateJobContactInput) => Promise<void>
    deleteJobContact: (jobContactId: Id) => Promise<void>
    reorderJobContacts: (input: ReorderJobEntitiesInput) => Promise<void>
    createApplicationQuestion: (jobId: Id) => Promise<Id | null>
    updateApplicationQuestion: (input: UpdateApplicationQuestionInput) => Promise<void>
    deleteApplicationQuestion: (applicationQuestionId: Id) => Promise<void>
    reorderApplicationQuestions: (input: ReorderJobEntitiesInput) => Promise<void>
    setJobAppliedAt: (input: SetJobAppliedAtInput) => Promise<void>
    clearJobAppliedAt: (jobId: Id) => Promise<void>
    setJobFinalOutcome: (input: SetJobFinalOutcomeInput) => Promise<void>
    clearJobFinalOutcome: (jobId: Id) => Promise<void>
    createInterview: (jobId: Id) => Promise<Id | null>
    updateInterview: (input: UpdateInterviewInput) => Promise<void>
    deleteInterview: (interviewId: Id) => Promise<void>
    addInterviewContact: (input: AddInterviewContactInput) => Promise<void>
    removeInterviewContact: (interviewContactId: Id) => Promise<void>
    reorderInterviewContacts: (input: ReorderInterviewContactsInput) => Promise<void>
    importAppData: (file: AppExportFile) => Promise<void>
    exportAppData: () => Promise<AppExportFile>
    resetUiState: () => void
    setThemePreference: (themePreference: ThemePreference) => void
    selectJob: (jobId: Id | null) => void
    selectProfile: (profileId: Id | null) => void
  }
}

const now = () => new Date().toISOString()
const createId = () => crypto.randomUUID()
const createInitialStoreStatus = (): AppStoreStatus => ({
  hydration: 'idle',
  saving: 'idle',
  errorMessage: null,
})

const getNextSortOrder = (sortOrders: number[]) => {
  if (sortOrders.length === 0) {
    return 1
  }

  return Math.max(...sortOrders) + 1
}

const hasExactIds = (expectedIds: Id[], orderedIds: Id[]) => {
  if (expectedIds.length !== orderedIds.length) {
    return false
  }

  const expectedIdSet = new Set(expectedIds)
  const orderedIdSet = new Set(orderedIds)

  if (expectedIdSet.size !== orderedIdSet.size) {
    return false
  }

  return expectedIds.every((id) => orderedIdSet.has(id))
}

const reorderSortableEntities = <T extends { id: Id; sortOrder: number }>(entities: Record<Id, T>, orderedIds: Id[]) => {
  const nextEntities = { ...entities }

  orderedIds.forEach((id, index) => {
    const entity = nextEntities[id]

    if (!entity) {
      return
    }

    nextEntities[id] = {
      ...entity,
      sortOrder: index + 1,
    }
  })

  return nextEntities
}

const normalizeAdditionalExperienceEntry = (
  existing: AdditionalExperienceEntry,
  changes: Partial<Omit<AdditionalExperienceEntry, 'id' | 'profileId'>>,
): AdditionalExperienceEntry | null => {
  const nextEntry: AdditionalExperienceEntry = {
    ...existing,
    ...changes,
  }

  if (nextEntry.startDate && nextEntry.endDate && nextEntry.startDate > nextEntry.endDate) {
    return null
  }

  return nextEntry
}

const mergeBulletChanges = <T extends { level: BulletLevel }>(existing: T, changes: Partial<T>): T | null => {
  if (changes.level !== undefined && !isBulletLevel(changes.level)) {
    return null
  }

  return {
    ...existing,
    ...changes,
  }
}

const stampUpdatedProfile = (data: AppDataState, profileId: Id, timestamp: string): AppDataState => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return data
  }

  return {
    ...data,
    profiles: {
      ...data.profiles,
      [profileId]: {
        ...profile,
        updatedAt: timestamp,
      },
    },
  }
}

const deleteAdditionalExperienceEntryCascade = (data: AppDataState, additionalExperienceEntryId: Id): AppDataState => {
  const nextAdditionalExperienceEntries = { ...data.additionalExperienceEntries }
  const nextAdditionalExperienceBullets = { ...data.additionalExperienceBullets }

  delete nextAdditionalExperienceEntries[additionalExperienceEntryId]

  Object.values(data.additionalExperienceBullets).forEach((item) => {
    if (item.additionalExperienceEntryId === additionalExperienceEntryId) {
      delete nextAdditionalExperienceBullets[item.id]
    }
  })

  return {
    ...data,
    additionalExperienceEntries: nextAdditionalExperienceEntries,
    additionalExperienceBullets: nextAdditionalExperienceBullets,
  }
}

 export const useAppStore = create<AppStoreState>((set, get) => {
  const runPersistedProfileMutation = async (
    mutation: (data: AppDataState) => Promise<ProfileMutationResult>,
    updateUi?: (state: AppStoreState, result: ProfileMutationResult) => AppUiState,
  ): Promise<ProfileMutationResult | null> => {
    set((state) => ({
      ...state,
      status: {
        ...state.status,
        saving: 'saving',
        errorMessage: null,
      },
    }))

    try {
      const result = await mutation(get().data)

      set((state) => ({
        ...state,
        data: result.data,
        ui: updateUi ? updateUi(state, result) : state.ui,
        status: {
          ...state.status,
          saving: 'idle',
          errorMessage: null,
        },
      }))

      return result
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown profile mutation error.'

      set((state) => ({
        ...state,
        status: {
          ...state.status,
          saving: 'error',
          errorMessage,
        },
      }))

      return null
    }
  }

  const runPersistedJobMutation = async (
    mutation: (data: AppDataState) => Promise<JobMutationResult>,
    updateUi?: (state: AppStoreState, result: JobMutationResult) => AppUiState,
  ): Promise<JobMutationResult | null> => {
    set((state) => ({
      ...state,
      status: {
        ...state.status,
        saving: 'saving',
        errorMessage: null,
      },
    }))

    try {
      const result = await mutation(get().data)

      set((state) => ({
        ...state,
        data: result.data,
        ui: updateUi ? updateUi(state, result) : state.ui,
        status: {
          ...state.status,
          saving: 'idle',
          errorMessage: null,
        },
      }))

      return result
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown job mutation error.'

      set((state) => ({
        ...state,
        status: {
          ...state.status,
          saving: 'error',
          errorMessage,
        },
      }))

      return null
    }
  }

  return {
  data: createEmptyDataState(),
  ui: createDefaultUiState(),
  status: createInitialStoreStatus(),
  actions: {
    hydrate: async () => {
      if (get().status.hydration === 'loading') {
        return
      }

      set((state) => ({
        ...state,
        status: {
          ...state.status,
          hydration: 'loading',
          errorMessage: null,
        },
      }))

      try {
        const data = await getAppApiClient().getAppData()

        set((state) => ({
          ...state,
          data,
          status: {
            ...state.status,
            hydration: 'ready',
            errorMessage: null,
          },
        }))
      } catch (caughtError) {
        const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown hydration error.'

        set((state) => ({
          ...state,
          status: {
            ...state.status,
            hydration: 'error',
            errorMessage,
          },
        }))
      }
    },
    createBaseProfile: async (name) => {
      const result = await runPersistedProfileMutation(
        (data) => getAppApiClient().createBaseProfile(data, name),
        (state, mutationResult) => ({
          ...state.ui,
          selectedProfileId: mutationResult.createdId ?? state.ui.selectedProfileId,
        }),
      )

      return result?.createdId ?? null
    },
    updateProfile: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateProfile(data, input))
    },
    setDocumentHeaderTemplate: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().setDocumentHeaderTemplate(data, input))
    },
    setResumeSectionEnabled: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().setResumeSectionEnabled(data, input))
    },
    setResumeSectionLabel: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().setResumeSectionLabel(data, input))
    },
    reorderResumeSections: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderResumeSections(data, input))
    },
    duplicateProfile: async (input) => {
      const result = await runPersistedProfileMutation(
        (data) => getAppApiClient().duplicateProfile(data, input),
        (state, mutationResult) => {
          const createdProfileId = mutationResult.createdId ?? null
          const createdProfile = createdProfileId ? mutationResult.data.profiles[createdProfileId] : null

          return {
            ...state.ui,
            selectedProfileId: createdProfileId ?? state.ui.selectedProfileId,
            selectedJobId: createdProfile?.jobId ?? state.ui.selectedJobId,
          }
        },
      )

      return result?.createdId ?? null
    },
    deleteProfile: async (profileId) => {
      await runPersistedProfileMutation(
        (data) => getAppApiClient().deleteProfile(data, profileId),
        (state) => ({
          ...state.ui,
          selectedProfileId: state.ui.selectedProfileId === profileId ? null : state.ui.selectedProfileId,
        }),
      )
    },
    createProfileLink: async (profileId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createProfileLink(data, profileId))
      return result?.createdId ?? null
    },
    updateProfileLink: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateProfileLink(data, input))
    },
    deleteProfileLink: async (profileLinkId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteProfileLink(data, profileLinkId))
    },
    reorderProfileLinks: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderProfileLinks(data, input))
    },
    createSkillCategory: async (profileId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createSkillCategory(data, profileId))
      return result?.createdId ?? null
    },
    updateSkillCategory: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateSkillCategory(data, input))
    },
    deleteSkillCategory: async (skillCategoryId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteSkillCategory(data, skillCategoryId))
    },
    reorderSkillCategories: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderSkillCategories(data, input))
    },
    createSkill: async (skillCategoryId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createSkill(data, skillCategoryId))
      return result?.createdId ?? null
    },
    updateSkill: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateSkill(data, input))
    },
    deleteSkill: async (skillId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteSkill(data, skillId))
    },
    reorderSkills: async ({ skillCategoryId, orderedIds }) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderSkills(data, skillCategoryId, orderedIds))
    },
    createAchievement: async (profileId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createAchievement(data, profileId))
      return result?.createdId ?? null
    },
    updateAchievement: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateAchievement(data, input))
    },
    deleteAchievement: async (achievementId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteAchievement(data, achievementId))
    },
    reorderAchievements: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderAchievements(data, input))
    },
    createExperienceEntry: async (profileId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createExperienceEntry(data, profileId))
      return result?.createdId ?? null
    },
    updateExperienceEntry: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateExperienceEntry(data, input))
    },
    deleteExperienceEntry: async (experienceEntryId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteExperienceEntry(data, experienceEntryId))
    },
    reorderExperienceEntries: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderExperienceEntries(data, input))
    },
    createExperienceBullet: async (experienceEntryId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createExperienceBullet(data, experienceEntryId))
      return result?.createdId ?? null
    },
    updateExperienceBullet: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateExperienceBullet(data, input))
    },
    deleteExperienceBullet: async (experienceBulletId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteExperienceBullet(data, experienceBulletId))
    },
    reorderExperienceBullets: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderExperienceBullets(data, input))
    },
    createEducationEntry: async (profileId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createEducationEntry(data, profileId))
      return result?.createdId ?? null
    },
    updateEducationEntry: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateEducationEntry(data, input))
    },
    deleteEducationEntry: async (educationEntryId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteEducationEntry(data, educationEntryId))
    },
    reorderEducationEntries: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderEducationEntries(data, input))
    },
    createEducationBullet: async (educationEntryId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createEducationBullet(data, educationEntryId))
      return result?.createdId ?? null
    },
    updateEducationBullet: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateEducationBullet(data, input))
    },
    deleteEducationBullet: async (educationBulletId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteEducationBullet(data, educationBulletId))
    },
    reorderEducationBullets: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderEducationBullets(data, input))
    },
    createProject: async (profileId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createProject(data, profileId))
      return result?.createdId ?? null
    },
    updateProject: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateProject(data, input))
    },
    deleteProject: async (projectId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteProject(data, projectId))
    },
    reorderProjects: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderProjects(data, input))
    },
    createProjectBullet: async (projectId) => {
      const result = await runPersistedProfileMutation((data) => getAppApiClient().createProjectBullet(data, projectId))
      return result?.createdId ?? null
    },
    updateProjectBullet: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().updateProjectBullet(data, input))
    },
    deleteProjectBullet: async (projectBulletId) => {
      await runPersistedProfileMutation((data) => getAppApiClient().deleteProjectBullet(data, projectBulletId))
    },
    reorderProjectBullets: async (input) => {
      await runPersistedProfileMutation((data) => getAppApiClient().reorderProjectBullets(data, input))
    },
    createAdditionalExperienceEntry: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return null
      }

      const additionalExperienceEntry: AdditionalExperienceEntry = {
        id: createId(),
        profileId,
        title: '',
        organization: '',
        location: '',
        startDate: null,
        endDate: null,
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.additionalExperienceEntries)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            additionalExperienceEntries: {
              ...state.data.additionalExperienceEntries,
              [additionalExperienceEntry.id]: additionalExperienceEntry,
            },
          },
          profileId,
          now(),
        ),
      }))

      return additionalExperienceEntry.id
    },
    updateAdditionalExperienceEntry: ({ additionalExperienceEntryId, changes }) => {
      const existing = get().data.additionalExperienceEntries[additionalExperienceEntryId]

      if (!existing) {
        return
      }

      const nextEntry = normalizeAdditionalExperienceEntry(existing, changes)

      if (!nextEntry) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            additionalExperienceEntries: {
              ...state.data.additionalExperienceEntries,
              [additionalExperienceEntryId]: nextEntry,
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteAdditionalExperienceEntry: (additionalExperienceEntryId) => {
      const existing = get().data.additionalExperienceEntries[additionalExperienceEntryId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(deleteAdditionalExperienceEntryCascade(state.data, additionalExperienceEntryId), existing.profileId, now()),
      }))
    },
    reorderAdditionalExperienceEntries: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.additionalExperienceEntries)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            additionalExperienceEntries: reorderSortableEntities(state.data.additionalExperienceEntries, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createAdditionalExperienceBullet: (additionalExperienceEntryId) => {
      const entry = get().data.additionalExperienceEntries[additionalExperienceEntryId]

      if (!entry) {
        return
      }

      const additionalExperienceBullet: AdditionalExperienceBullet = {
        id: createId(),
        additionalExperienceEntryId,
        content: '',
        level: defaultBulletLevel,
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.additionalExperienceBullets)
            .filter((item) => item.additionalExperienceEntryId === additionalExperienceEntryId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            additionalExperienceBullets: {
              ...state.data.additionalExperienceBullets,
              [additionalExperienceBullet.id]: additionalExperienceBullet,
            },
          },
          entry.profileId,
          now(),
        ),
      }))
    },
    updateAdditionalExperienceBullet: ({ additionalExperienceBulletId, changes }) => {
      const existing = get().data.additionalExperienceBullets[additionalExperienceBulletId]

      if (!existing) {
        return
      }

      const entry = get().data.additionalExperienceEntries[existing.additionalExperienceEntryId]

      if (!entry) {
        return
      }

      const nextBullet = mergeBulletChanges<AdditionalExperienceBullet>(existing, changes)

      if (!nextBullet) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            additionalExperienceBullets: {
              ...state.data.additionalExperienceBullets,
              [additionalExperienceBulletId]: nextBullet,
            },
          },
          entry.profileId,
          now(),
        ),
      }))
    },
    deleteAdditionalExperienceBullet: (additionalExperienceBulletId) => {
      const existing = get().data.additionalExperienceBullets[additionalExperienceBulletId]

      if (!existing) {
        return
      }

      const entry = get().data.additionalExperienceEntries[existing.additionalExperienceEntryId]

      if (!entry) {
        return
      }

      set((state) => {
        const nextAdditionalExperienceBullets = { ...state.data.additionalExperienceBullets }
        delete nextAdditionalExperienceBullets[additionalExperienceBulletId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              additionalExperienceBullets: nextAdditionalExperienceBullets,
            },
            entry.profileId,
            now(),
          ),
        }
      })
    },
    reorderAdditionalExperienceBullets: ({ additionalExperienceEntryId, orderedIds }) => {
      const entry = get().data.additionalExperienceEntries[additionalExperienceEntryId]

      if (!entry) {
        return
      }

      const existingIds = Object.values(get().data.additionalExperienceBullets)
        .filter((item) => item.additionalExperienceEntryId === additionalExperienceEntryId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            additionalExperienceBullets: reorderSortableEntities(state.data.additionalExperienceBullets, orderedIds),
          },
          entry.profileId,
          now(),
        ),
      }))
    },
    createCertification: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return null
      }

      const certification: Certification = {
        id: createId(),
        profileId,
        name: '',
        issuer: '',
        issueDate: null,
        expiryDate: null,
        credentialId: '',
        credentialUrl: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.certifications)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            certifications: {
              ...state.data.certifications,
              [certification.id]: certification,
            },
          },
          profileId,
          now(),
        ),
      }))

      return certification.id
    },
    updateCertification: ({ certificationId, changes }) => {
      const existing = get().data.certifications[certificationId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            certifications: {
              ...state.data.certifications,
              [certificationId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteCertification: (certificationId) => {
      const existing = get().data.certifications[certificationId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextCertifications = { ...state.data.certifications }
        delete nextCertifications[certificationId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              certifications: nextCertifications,
            },
            existing.profileId,
            now(),
          ),
        }
      })
    },
    reorderCertifications: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.certifications)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            certifications: reorderSortableEntities(state.data.certifications, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createReference: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return null
      }

      const reference: Reference = {
        id: createId(),
        profileId,
        type: 'professional',
        name: '',
        relationship: '',
        company: '',
        title: '',
        email: '',
        phone: '',
        notes: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.references)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            references: {
              ...state.data.references,
              [reference.id]: reference,
            },
          },
          profileId,
          now(),
        ),
      }))

      return reference.id
    },
    updateReference: ({ referenceId, changes }) => {
      const existing = get().data.references[referenceId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            references: {
              ...state.data.references,
              [referenceId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteReference: (referenceId) => {
      const existing = get().data.references[referenceId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextReferences = { ...state.data.references }
        delete nextReferences[referenceId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              references: nextReferences,
            },
            existing.profileId,
            now(),
          ),
        }
      })
    },
    reorderReferences: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.references)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            references: reorderSortableEntities(state.data.references, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createJob: async (input) => {
      const result = await runPersistedJobMutation(
        (data) => getAppApiClient().createJob(data, input),
        (state, mutationResult) => ({
          ...state.ui,
          selectedJobId: mutationResult.createdId ?? state.ui.selectedJobId,
        }),
      )

      return result?.createdId ?? null
    },
    updateJob: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().updateJob(data, input))
    },
    deleteJob: async (jobId) => {
      await runPersistedJobMutation(
        (data) => getAppApiClient().deleteJob(data, jobId),
        (state, mutationResult) => ({
          ...state.ui,
          selectedJobId: state.ui.selectedJobId === jobId ? null : state.ui.selectedJobId,
          selectedProfileId:
            state.ui.selectedProfileId && mutationResult.data.profiles[state.ui.selectedProfileId] === undefined
              ? null
              : state.ui.selectedProfileId,
        }),
      )
    },
    createJobLink: async (jobId) => {
      const result = await runPersistedJobMutation((data) => getAppApiClient().createJobLink(data, jobId))
      return result?.createdId ?? null
    },
    updateJobLink: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().updateJobLink(data, input))
    },
    deleteJobLink: async (jobLinkId) => {
      await runPersistedJobMutation((data) => getAppApiClient().deleteJobLink(data, jobLinkId))
    },
    reorderJobLinks: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().reorderJobLinks(data, input))
    },
    createJobContact: async (jobId) => {
      const result = await runPersistedJobMutation((data) => getAppApiClient().createJobContact(data, jobId))
      return result?.createdId ?? null
    },
    updateJobContact: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().updateJobContact(data, input))
    },
    deleteJobContact: async (jobContactId) => {
      await runPersistedJobMutation((data) => getAppApiClient().deleteJobContact(data, jobContactId))
    },
    reorderJobContacts: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().reorderJobContacts(data, input))
    },
    createApplicationQuestion: async (jobId) => {
      const result = await runPersistedJobMutation((data) => getAppApiClient().createApplicationQuestion(data, jobId))
      return result?.createdId ?? null
    },
    updateApplicationQuestion: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().updateApplicationQuestion(data, input))
    },
    deleteApplicationQuestion: async (applicationQuestionId) => {
      await runPersistedJobMutation((data) => getAppApiClient().deleteApplicationQuestion(data, applicationQuestionId))
    },
    reorderApplicationQuestions: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().reorderApplicationQuestions(data, input))
    },
    setJobAppliedAt: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().setJobAppliedAt(data, input))
    },
    clearJobAppliedAt: async (jobId) => {
      await runPersistedJobMutation((data) => getAppApiClient().clearJobAppliedAt(data, jobId))
    },
    setJobFinalOutcome: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().setJobFinalOutcome(data, input))
    },
    clearJobFinalOutcome: async (jobId) => {
      await runPersistedJobMutation((data) => getAppApiClient().clearJobFinalOutcome(data, jobId))
    },
    createInterview: async (jobId) => {
      const result = await runPersistedJobMutation((data) => getAppApiClient().createInterview(data, jobId))
      return result?.createdId ?? null
    },
    updateInterview: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().updateInterview(data, input))
    },
    deleteInterview: async (interviewId) => {
      await runPersistedJobMutation((data) => getAppApiClient().deleteInterview(data, interviewId))
    },
    addInterviewContact: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().addInterviewContact(data, input))
    },
    removeInterviewContact: async (interviewContactId) => {
      await runPersistedJobMutation((data) => getAppApiClient().removeInterviewContact(data, interviewContactId))
    },
    reorderInterviewContacts: async (input) => {
      await runPersistedJobMutation((data) => getAppApiClient().reorderInterviewContacts(data, input))
    },
    importAppData: async (file) => {
      const currentThemePreference = get().ui.themePreference

      set((state) => ({
        ...state,
        status: {
          ...state.status,
          saving: 'saving',
          errorMessage: null,
        },
      }))

      try {
        const data = await getAppApiClient().importAppData(file)

        set((state) => ({
          ...state,
          data,
          ui: createDefaultUiState(currentThemePreference),
          status: {
            ...state.status,
            saving: 'idle',
            errorMessage: null,
          },
        }))
      } catch (caughtError) {
        const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown import error.'

        set((state) => ({
          ...state,
          status: {
            ...state.status,
            saving: 'error',
            errorMessage,
          },
        }))

        throw caughtError
      }
    },
    exportAppData: async () => {
      set((state) => ({
        ...state,
        status: {
          ...state.status,
          saving: 'saving',
          errorMessage: null,
        },
      }))

      try {
        const file = await getAppApiClient().exportAppData(get().data)

        set((state) => ({
          ...state,
          status: {
            ...state.status,
            saving: 'idle',
            errorMessage: null,
          },
        }))

        return file
      } catch (caughtError) {
        const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown export error.'

        set((state) => ({
          ...state,
          status: {
            ...state.status,
            saving: 'error',
            errorMessage,
          },
        }))

        throw caughtError
      }
    },
    resetUiState: () => set((state) => ({ ...state, ui: createDefaultUiState(state.ui.themePreference) })),
    setThemePreference: (themePreference) => set((state) => ({ ...state, ui: { ...state.ui, themePreference } })),
    selectJob: (jobId) => set((state) => ({ ...state, ui: { ...state.ui, selectedJobId: jobId } })),
    selectProfile: (profileId) =>
      set((state) => ({ ...state, ui: { ...state.ui, selectedProfileId: profileId } })),
  },
}
})

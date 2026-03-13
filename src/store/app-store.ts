import { create } from 'zustand'

import { getAppApiClient } from '../api'
import { queryKeys } from '../queries/query-keys'
import { queryClient } from '../queries/query-client'
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
  ReorderAdditionalExperienceBulletsInput,
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
  UpdateAdditionalExperienceBulletInput,
  UpdateAdditionalExperienceEntryInput,
  UpdateCertificationInput,
  UpdateReferenceInput,
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
import type {
  AppDataState,
  AppExportFile,
  AppUiState,
  Id,
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
    mergeDataSnapshot: (snapshot: Partial<AppDataState>) => void
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
    createAdditionalExperienceEntry: (profileId: Id) => Promise<Id | null>
    updateAdditionalExperienceEntry: (input: UpdateAdditionalExperienceEntryInput) => Promise<void>
    deleteAdditionalExperienceEntry: (additionalExperienceEntryId: Id) => Promise<void>
    reorderAdditionalExperienceEntries: (input: ReorderProfileEntitiesInput) => Promise<void>
    createAdditionalExperienceBullet: (additionalExperienceEntryId: Id) => Promise<Id | null>
    updateAdditionalExperienceBullet: (input: UpdateAdditionalExperienceBulletInput) => Promise<void>
    deleteAdditionalExperienceBullet: (additionalExperienceBulletId: Id) => Promise<void>
    reorderAdditionalExperienceBullets: (input: ReorderAdditionalExperienceBulletsInput) => Promise<void>
    createCertification: (profileId: Id) => Promise<Id | null>
    updateCertification: (input: UpdateCertificationInput) => Promise<void>
    deleteCertification: (certificationId: Id) => Promise<void>
    reorderCertifications: (input: ReorderProfileEntitiesInput) => Promise<void>
    createReference: (profileId: Id) => Promise<Id | null>
    updateReference: (input: UpdateReferenceInput) => Promise<void>
    deleteReference: (referenceId: Id) => Promise<void>
    reorderReferences: (input: ReorderProfileEntitiesInput) => Promise<void>
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

const createInitialStoreStatus = (): AppStoreStatus => ({
  hydration: 'idle',
  saving: 'idle',
  errorMessage: null,
})

const mergeDataSnapshot = (current: AppDataState, snapshot: Partial<AppDataState>): AppDataState => ({
  ...current,
  ...snapshot,
  profiles: { ...current.profiles, ...snapshot.profiles },
  profileLinks: { ...current.profileLinks, ...snapshot.profileLinks },
  skillCategories: { ...current.skillCategories, ...snapshot.skillCategories },
  skills: { ...current.skills, ...snapshot.skills },
  achievements: { ...current.achievements, ...snapshot.achievements },
  experienceEntries: { ...current.experienceEntries, ...snapshot.experienceEntries },
  experienceBullets: { ...current.experienceBullets, ...snapshot.experienceBullets },
  educationEntries: { ...current.educationEntries, ...snapshot.educationEntries },
  educationBullets: { ...current.educationBullets, ...snapshot.educationBullets },
  projects: { ...current.projects, ...snapshot.projects },
  projectBullets: { ...current.projectBullets, ...snapshot.projectBullets },
  additionalExperienceEntries: { ...current.additionalExperienceEntries, ...snapshot.additionalExperienceEntries },
  additionalExperienceBullets: { ...current.additionalExperienceBullets, ...snapshot.additionalExperienceBullets },
  certifications: { ...current.certifications, ...snapshot.certifications },
  references: { ...current.references, ...snapshot.references },
  jobs: { ...current.jobs, ...snapshot.jobs },
  jobLinks: { ...current.jobLinks, ...snapshot.jobLinks },
  jobContacts: { ...current.jobContacts, ...snapshot.jobContacts },
  interviews: { ...current.interviews, ...snapshot.interviews },
  interviewContacts: { ...current.interviewContacts, ...snapshot.interviewContacts },
  applicationQuestions: { ...current.applicationQuestions, ...snapshot.applicationQuestions },
})

 export const useAppStore = create<AppStoreState>((set, get) => {
  const runPersistedProfileMutation = async (
    mutation: () => Promise<ProfileMutationResult>,
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
      const result = await mutation()

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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profilesListRoot() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.jobsDetailRoot() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() }),
      ])

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
    mutation: () => Promise<JobMutationResult>,
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
      const result = await mutation()

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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.jobsList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.jobsDetailRoot() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profilesListRoot() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() }),
      ])

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
    mergeDataSnapshot: (snapshot) =>
      set((state) => ({
        ...state,
        data: mergeDataSnapshot(state.data, snapshot),
      })),
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
        () => getAppApiClient().createBaseProfile(name),
        (state, mutationResult) => ({
          ...state.ui,
          selectedProfileId: mutationResult.createdId ?? state.ui.selectedProfileId,
        }),
      )

      return result?.createdId ?? null
    },
    updateProfile: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateProfile(input))
    },
    setDocumentHeaderTemplate: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().setDocumentHeaderTemplate(input))
    },
    setResumeSectionEnabled: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().setResumeSectionEnabled(input))
    },
    setResumeSectionLabel: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().setResumeSectionLabel(input))
    },
    reorderResumeSections: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderResumeSections(input))
    },
    duplicateProfile: async (input) => {
      const result = await runPersistedProfileMutation(
        () => getAppApiClient().duplicateProfile(input),
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
        () => getAppApiClient().deleteProfile(profileId),
        (state) => ({
          ...state.ui,
          selectedProfileId: state.ui.selectedProfileId === profileId ? null : state.ui.selectedProfileId,
        }),
      )
    },
    createProfileLink: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createProfileLink(profileId))
      return result?.createdId ?? null
    },
    updateProfileLink: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateProfileLink(input))
    },
    deleteProfileLink: async (profileLinkId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteProfileLink(profileLinkId))
    },
    reorderProfileLinks: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderProfileLinks(input))
    },
    createSkillCategory: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createSkillCategory(profileId))
      return result?.createdId ?? null
    },
    updateSkillCategory: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateSkillCategory(input))
    },
    deleteSkillCategory: async (skillCategoryId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteSkillCategory(skillCategoryId))
    },
    reorderSkillCategories: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderSkillCategories(input))
    },
    createSkill: async (skillCategoryId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createSkill(skillCategoryId))
      return result?.createdId ?? null
    },
    updateSkill: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateSkill(input))
    },
    deleteSkill: async (skillId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteSkill(skillId))
    },
    reorderSkills: async ({ skillCategoryId, orderedIds }) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderSkills(skillCategoryId, orderedIds))
    },
    createAchievement: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createAchievement(profileId))
      return result?.createdId ?? null
    },
    updateAchievement: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateAchievement(input))
    },
    deleteAchievement: async (achievementId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteAchievement(achievementId))
    },
    reorderAchievements: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderAchievements(input))
    },
    createExperienceEntry: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createExperienceEntry(profileId))
      return result?.createdId ?? null
    },
    updateExperienceEntry: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateExperienceEntry(input))
    },
    deleteExperienceEntry: async (experienceEntryId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteExperienceEntry(experienceEntryId))
    },
    reorderExperienceEntries: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderExperienceEntries(input))
    },
    createExperienceBullet: async (experienceEntryId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createExperienceBullet(experienceEntryId))
      return result?.createdId ?? null
    },
    updateExperienceBullet: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateExperienceBullet(input))
    },
    deleteExperienceBullet: async (experienceBulletId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteExperienceBullet(experienceBulletId))
    },
    reorderExperienceBullets: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderExperienceBullets(input))
    },
    createEducationEntry: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createEducationEntry(profileId))
      return result?.createdId ?? null
    },
    updateEducationEntry: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateEducationEntry(input))
    },
    deleteEducationEntry: async (educationEntryId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteEducationEntry(educationEntryId))
    },
    reorderEducationEntries: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderEducationEntries(input))
    },
    createEducationBullet: async (educationEntryId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createEducationBullet(educationEntryId))
      return result?.createdId ?? null
    },
    updateEducationBullet: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateEducationBullet(input))
    },
    deleteEducationBullet: async (educationBulletId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteEducationBullet(educationBulletId))
    },
    reorderEducationBullets: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderEducationBullets(input))
    },
    createProject: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createProject(profileId))
      return result?.createdId ?? null
    },
    updateProject: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateProject(input))
    },
    deleteProject: async (projectId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteProject(projectId))
    },
    reorderProjects: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderProjects(input))
    },
    createProjectBullet: async (projectId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createProjectBullet(projectId))
      return result?.createdId ?? null
    },
    updateProjectBullet: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateProjectBullet(input))
    },
    deleteProjectBullet: async (projectBulletId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteProjectBullet(projectBulletId))
    },
    reorderProjectBullets: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderProjectBullets(input))
    },
    createAdditionalExperienceEntry: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createAdditionalExperienceEntry(profileId))
      return result?.createdId ?? null
    },
    updateAdditionalExperienceEntry: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateAdditionalExperienceEntry(input))
    },
    deleteAdditionalExperienceEntry: async (additionalExperienceEntryId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteAdditionalExperienceEntry(additionalExperienceEntryId))
    },
    reorderAdditionalExperienceEntries: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderAdditionalExperienceEntries(input))
    },
    createAdditionalExperienceBullet: async (additionalExperienceEntryId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createAdditionalExperienceBullet(additionalExperienceEntryId))
      return result?.createdId ?? null
    },
    updateAdditionalExperienceBullet: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateAdditionalExperienceBullet(input))
    },
    deleteAdditionalExperienceBullet: async (additionalExperienceBulletId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteAdditionalExperienceBullet(additionalExperienceBulletId))
    },
    reorderAdditionalExperienceBullets: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderAdditionalExperienceBullets(input))
    },
    createCertification: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createCertification(profileId))
      return result?.createdId ?? null
    },
    updateCertification: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateCertification(input))
    },
    deleteCertification: async (certificationId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteCertification(certificationId))
    },
    reorderCertifications: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderCertifications(input))
    },
    createReference: async (profileId) => {
      const result = await runPersistedProfileMutation(() => getAppApiClient().createReference(profileId))
      return result?.createdId ?? null
    },
    updateReference: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().updateReference(input))
    },
    deleteReference: async (referenceId) => {
      await runPersistedProfileMutation(() => getAppApiClient().deleteReference(referenceId))
    },
    reorderReferences: async (input) => {
      await runPersistedProfileMutation(() => getAppApiClient().reorderReferences(input))
    },
    createJob: async (input) => {
      const result = await runPersistedJobMutation(
        () => getAppApiClient().createJob(input),
        (state, mutationResult) => ({
          ...state.ui,
          selectedJobId: mutationResult.createdId ?? state.ui.selectedJobId,
        }),
      )

      return result?.createdId ?? null
    },
    updateJob: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().updateJob(input))
    },
    deleteJob: async (jobId) => {
      await runPersistedJobMutation(
        () => getAppApiClient().deleteJob(jobId),
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
      const result = await runPersistedJobMutation(() => getAppApiClient().createJobLink(jobId))
      return result?.createdId ?? null
    },
    updateJobLink: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().updateJobLink(input))
    },
    deleteJobLink: async (jobLinkId) => {
      await runPersistedJobMutation(() => getAppApiClient().deleteJobLink(jobLinkId))
    },
    reorderJobLinks: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().reorderJobLinks(input))
    },
    createJobContact: async (jobId) => {
      const result = await runPersistedJobMutation(() => getAppApiClient().createJobContact(jobId))
      return result?.createdId ?? null
    },
    updateJobContact: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().updateJobContact(input))
    },
    deleteJobContact: async (jobContactId) => {
      await runPersistedJobMutation(() => getAppApiClient().deleteJobContact(jobContactId))
    },
    reorderJobContacts: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().reorderJobContacts(input))
    },
    createApplicationQuestion: async (jobId) => {
      const result = await runPersistedJobMutation(() => getAppApiClient().createApplicationQuestion(jobId))
      return result?.createdId ?? null
    },
    updateApplicationQuestion: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().updateApplicationQuestion(input))
    },
    deleteApplicationQuestion: async (applicationQuestionId) => {
      await runPersistedJobMutation(() => getAppApiClient().deleteApplicationQuestion(applicationQuestionId))
    },
    reorderApplicationQuestions: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().reorderApplicationQuestions(input))
    },
    setJobAppliedAt: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().setJobAppliedAt(input))
    },
    clearJobAppliedAt: async (jobId) => {
      await runPersistedJobMutation(() => getAppApiClient().clearJobAppliedAt(jobId))
    },
    setJobFinalOutcome: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().setJobFinalOutcome(input))
    },
    clearJobFinalOutcome: async (jobId) => {
      await runPersistedJobMutation(() => getAppApiClient().clearJobFinalOutcome(jobId))
    },
    createInterview: async (jobId) => {
      const result = await runPersistedJobMutation(() => getAppApiClient().createInterview(jobId))
      return result?.createdId ?? null
    },
    updateInterview: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().updateInterview(input))
    },
    deleteInterview: async (interviewId) => {
      await runPersistedJobMutation(() => getAppApiClient().deleteInterview(interviewId))
    },
    addInterviewContact: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().addInterviewContact(input))
    },
    removeInterviewContact: async (interviewContactId) => {
      await runPersistedJobMutation(() => getAppApiClient().removeInterviewContact(interviewContactId))
    },
    reorderInterviewContacts: async (input) => {
      await runPersistedJobMutation(() => getAppApiClient().reorderInterviewContacts(input))
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

        queryClient.clear()

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
        const file = await getAppApiClient().exportAppData()

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

import { createEmptyDataState } from '../store/create-initial-state'
import type { AppDataState, AppExportFile, IsoTimestamp } from '../types/state'
import {
  addInterviewContactMutation,
  clearJobAppliedAtMutation,
  clearJobFinalOutcomeMutation,
  createApplicationQuestionMutation,
  createInterviewMutation,
  createJobContactMutation,
  createJobLinkMutation,
  createJobMutation,
  deleteApplicationQuestionMutation,
  deleteInterviewMutation,
  deleteJobContactMutation,
  deleteJobLinkMutation,
  deleteJobMutation,
  removeInterviewContactMutation,
  reorderApplicationQuestionsMutation,
  reorderInterviewContactsMutation,
  reorderJobContactsMutation,
  reorderJobLinksMutation,
  setJobAppliedAtMutation,
  setJobFinalOutcomeMutation,
  updateApplicationQuestionMutation,
  updateInterviewMutation,
  updateJobContactMutation,
  updateJobLinkMutation,
  updateJobMutation,
  type AddInterviewContactInput,
  type CreateJobInput,
  type JobMutationContext,
  type JobMutationResult,
  type ReorderInterviewContactsInput,
  type ReorderJobEntitiesInput,
  type SetJobAppliedAtInput,
  type SetJobFinalOutcomeInput,
  type UpdateApplicationQuestionInput,
  type UpdateInterviewInput,
  type UpdateJobContactInput,
  type UpdateJobInput,
  type UpdateJobLinkInput,
} from '../domain/job-data'
import {
  createBaseProfileMutation,
  createAchievementMutation,
  createExperienceBulletMutation,
  createExperienceEntryMutation,
  createProfileLinkMutation,
  createSkillCategoryMutation,
  createSkillMutation,
  deleteAchievementMutation,
  deleteExperienceBulletMutation,
  deleteExperienceEntryMutation,
  deleteProfileMutation,
  deleteProfileLinkMutation,
  deleteSkillCategoryMutation,
  deleteSkillMutation,
  duplicateProfileMutation,
  reorderExperienceBulletsMutation,
  reorderExperienceEntriesMutation,
  reorderAchievementsMutation,
  reorderProfileLinksMutation,
  reorderSkillCategoriesMutation,
  reorderResumeSectionsMutation,
  reorderSkillsMutation,
  setDocumentHeaderTemplateMutation,
  setResumeSectionEnabledMutation,
  setResumeSectionLabelMutation,
  updateAchievementMutation,
  updateExperienceBulletMutation,
  updateExperienceEntryMutation,
  updateProfileLinkMutation,
  updateProfileMutation,
  updateSkillCategoryMutation,
  updateSkillMutation,
  type DuplicateProfileInput,
  type ProfileMutationContext,
  type ProfileMutationResult,
  type ReorderExperienceBulletsInput,
  type ReorderProfileEntitiesInput,
  type ReorderResumeSectionsInput,
  type SetDocumentHeaderTemplateInput,
  type SetResumeSectionEnabledInput,
  type SetResumeSectionLabelInput,
  type UpdateAchievementInput,
  type UpdateExperienceBulletInput,
  type UpdateExperienceEntryInput,
  type UpdateProfileLinkInput,
  type UpdateProfileInput,
  type UpdateSkillCategoryInput,
  type UpdateSkillInput,
} from '../domain/profile-data'
import type { AppDataService } from './app-data-service'

interface MockAppBackendOptions {
  initialData?: AppDataState
  now?: () => IsoTimestamp
}

const cloneAppData = (data: AppDataState): AppDataState => structuredClone(data)
const cloneExportData = (data: AppExportFile['data']): AppExportFile['data'] => structuredClone(data)

export class MockAppBackend implements AppDataService {
  private data: AppDataState
  private readonly now: () => IsoTimestamp

  constructor(options: MockAppBackendOptions = {}) {
    this.data = cloneAppData(options.initialData ?? createEmptyDataState())
    this.now = options.now ?? (() => new Date().toISOString())
  }

  async getAppData(): Promise<AppDataState> {
    return cloneAppData(this.data)
  }

  async replaceAppData(data: AppDataState): Promise<AppDataState> {
    this.data = cloneAppData(data)
    return cloneAppData(this.data)
  }

  async importAppData(file: AppExportFile): Promise<AppDataState> {
    this.data = {
      version: 1,
      exportedAt: file.exportedAt,
      ...cloneExportData(file.data),
    }

    return cloneAppData(this.data)
  }

  async exportAppData(data: AppDataState): Promise<AppExportFile> {
    this.data = cloneAppData(data)

    return {
      version: 1,
      exportedAt: this.now(),
      data: cloneAppData(this.data),
    }
  }

  private mutate(mutation: (data: AppDataState, context: JobMutationContext) => JobMutationResult): JobMutationResult {
    const result = mutation(this.data, { now: this.now, createId: () => crypto.randomUUID() })
    this.data = cloneAppData(result.data)
    return {
      ...result,
      data: cloneAppData(this.data),
    }
  }

  private mutateProfile(mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult): ProfileMutationResult {
    const result = mutation(this.data, { now: this.now, createId: () => crypto.randomUUID() })
    this.data = cloneAppData(result.data)
    return {
      ...result,
      data: cloneAppData(this.data),
    }
  }

  async createBaseProfile(name: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createBaseProfileMutation(data, name, context))
  }

  async updateProfile(input: UpdateProfileInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateProfileMutation(data, input, context))
  }

  async setDocumentHeaderTemplate(input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => setDocumentHeaderTemplateMutation(data, input, context))
  }

  async setResumeSectionEnabled(input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => setResumeSectionEnabledMutation(data, input, context))
  }

  async setResumeSectionLabel(input: SetResumeSectionLabelInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => setResumeSectionLabelMutation(data, input, context))
  }

  async reorderResumeSections(input: ReorderResumeSectionsInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderResumeSectionsMutation(data, input, context))
  }

  async duplicateProfile(input: DuplicateProfileInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => duplicateProfileMutation(data, input, context))
  }

  async deleteProfile(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data) => deleteProfileMutation(data, profileId))
  }

  async createProfileLink(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createProfileLinkMutation(data, profileId, context))
  }

  async updateProfileLink(input: UpdateProfileLinkInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateProfileLinkMutation(data, input, context))
  }

  async deleteProfileLink(profileLinkId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => deleteProfileLinkMutation(data, profileLinkId, context))
  }

  async reorderProfileLinks(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderProfileLinksMutation(data, input, context))
  }

  async createSkillCategory(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createSkillCategoryMutation(data, profileId, context))
  }

  async updateSkillCategory(input: UpdateSkillCategoryInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateSkillCategoryMutation(data, input, context))
  }

  async deleteSkillCategory(skillCategoryId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => deleteSkillCategoryMutation(data, skillCategoryId, context))
  }

  async reorderSkillCategories(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderSkillCategoriesMutation(data, input, context))
  }

  async createSkill(skillCategoryId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createSkillMutation(data, skillCategoryId, context))
  }

  async updateSkill(input: UpdateSkillInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateSkillMutation(data, input, context))
  }

  async deleteSkill(skillId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => deleteSkillMutation(data, skillId, context))
  }

  async reorderSkills(skillCategoryId: string, orderedIds: string[]): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderSkillsMutation(data, skillCategoryId, orderedIds, context))
  }

  async createAchievement(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createAchievementMutation(data, profileId, context))
  }

  async updateAchievement(input: UpdateAchievementInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateAchievementMutation(data, input, context))
  }

  async deleteAchievement(achievementId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => deleteAchievementMutation(data, achievementId, context))
  }

  async reorderAchievements(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderAchievementsMutation(data, input, context))
  }

  async createExperienceEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createExperienceEntryMutation(data, profileId, context))
  }

  async updateExperienceEntry(input: UpdateExperienceEntryInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateExperienceEntryMutation(data, input, context))
  }

  async deleteExperienceEntry(experienceEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => deleteExperienceEntryMutation(data, experienceEntryId, context))
  }

  async reorderExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderExperienceEntriesMutation(data, input, context))
  }

  async createExperienceBullet(experienceEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createExperienceBulletMutation(data, experienceEntryId, context))
  }

  async updateExperienceBullet(input: UpdateExperienceBulletInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateExperienceBulletMutation(data, input, context))
  }

  async deleteExperienceBullet(experienceBulletId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => deleteExperienceBulletMutation(data, experienceBulletId, context))
  }

  async reorderExperienceBullets(input: ReorderExperienceBulletsInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderExperienceBulletsMutation(data, input, context))
  }

  async createJob(input: CreateJobInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => createJobMutation(data, input, context))
  }

  async updateJob(input: UpdateJobInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateJobMutation(data, input, context))
  }

  async deleteJob(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data) => deleteJobMutation(data, jobId))
  }

  async createJobLink(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createJobLinkMutation(data, jobId, context))
  }

  async updateJobLink(input: UpdateJobLinkInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateJobLinkMutation(data, input, context))
  }

  async deleteJobLink(jobLinkId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteJobLinkMutation(data, jobLinkId, context))
  }

  async reorderJobLinks(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderJobLinksMutation(data, input, context))
  }

  async createJobContact(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createJobContactMutation(data, jobId, context))
  }

  async updateJobContact(input: UpdateJobContactInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateJobContactMutation(data, input, context))
  }

  async deleteJobContact(jobContactId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteJobContactMutation(data, jobContactId, context))
  }

  async reorderJobContacts(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderJobContactsMutation(data, input, context))
  }

  async createApplicationQuestion(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createApplicationQuestionMutation(data, jobId, context))
  }

  async updateApplicationQuestion(input: UpdateApplicationQuestionInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateApplicationQuestionMutation(data, input, context))
  }

  async deleteApplicationQuestion(applicationQuestionId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteApplicationQuestionMutation(data, applicationQuestionId, context))
  }

  async reorderApplicationQuestions(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderApplicationQuestionsMutation(data, input, context))
  }

  async setJobAppliedAt(input: SetJobAppliedAtInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => setJobAppliedAtMutation(data, input, context))
  }

  async clearJobAppliedAt(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => clearJobAppliedAtMutation(data, jobId, context))
  }

  async setJobFinalOutcome(input: SetJobFinalOutcomeInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => setJobFinalOutcomeMutation(data, input, context))
  }

  async clearJobFinalOutcome(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => clearJobFinalOutcomeMutation(data, jobId, context))
  }

  async createInterview(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createInterviewMutation(data, jobId, context))
  }

  async updateInterview(input: UpdateInterviewInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateInterviewMutation(data, input, context))
  }

  async deleteInterview(interviewId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteInterviewMutation(data, interviewId, context))
  }

  async addInterviewContact(input: AddInterviewContactInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => addInterviewContactMutation(data, input, context))
  }

  async removeInterviewContact(interviewContactId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => removeInterviewContactMutation(data, interviewContactId, context))
  }

  async reorderInterviewContacts(input: ReorderInterviewContactsInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderInterviewContactsMutation(data, input, context))
  }
}

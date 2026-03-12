import type { AppDataState, AppExportFile } from '../types/state'
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
  ProfileMutationResult,
  ReorderEducationBulletsInput,
  ReorderExperienceBulletsInput,
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
  UpdateProfileLinkInput,
  UpdateProfileInput,
  UpdateSkillCategoryInput,
  UpdateSkillInput,
} from '../domain/profile-data'
import type { AppDataService } from './app-data-service'

export interface AppApiClient {
  getAppData(): Promise<AppDataState>
  replaceAppData(data: AppDataState): Promise<AppDataState>
  importAppData(file: AppExportFile): Promise<AppDataState>
  exportAppData(data: AppDataState): Promise<AppExportFile>
  createBaseProfile(data: AppDataState, name: string): Promise<ProfileMutationResult>
  updateProfile(data: AppDataState, input: UpdateProfileInput): Promise<ProfileMutationResult>
  setDocumentHeaderTemplate(data: AppDataState, input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult>
  setResumeSectionEnabled(data: AppDataState, input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult>
  setResumeSectionLabel(data: AppDataState, input: SetResumeSectionLabelInput): Promise<ProfileMutationResult>
  reorderResumeSections(data: AppDataState, input: ReorderResumeSectionsInput): Promise<ProfileMutationResult>
  duplicateProfile(data: AppDataState, input: DuplicateProfileInput): Promise<ProfileMutationResult>
  deleteProfile(data: AppDataState, profileId: string): Promise<ProfileMutationResult>
  createProfileLink(data: AppDataState, profileId: string): Promise<ProfileMutationResult>
  updateProfileLink(data: AppDataState, input: UpdateProfileLinkInput): Promise<ProfileMutationResult>
  deleteProfileLink(data: AppDataState, profileLinkId: string): Promise<ProfileMutationResult>
  reorderProfileLinks(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createSkillCategory(data: AppDataState, profileId: string): Promise<ProfileMutationResult>
  updateSkillCategory(data: AppDataState, input: UpdateSkillCategoryInput): Promise<ProfileMutationResult>
  deleteSkillCategory(data: AppDataState, skillCategoryId: string): Promise<ProfileMutationResult>
  reorderSkillCategories(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createSkill(data: AppDataState, skillCategoryId: string): Promise<ProfileMutationResult>
  updateSkill(data: AppDataState, input: UpdateSkillInput): Promise<ProfileMutationResult>
  deleteSkill(data: AppDataState, skillId: string): Promise<ProfileMutationResult>
  reorderSkills(data: AppDataState, skillCategoryId: string, orderedIds: string[]): Promise<ProfileMutationResult>
  createAchievement(data: AppDataState, profileId: string): Promise<ProfileMutationResult>
  updateAchievement(data: AppDataState, input: UpdateAchievementInput): Promise<ProfileMutationResult>
  deleteAchievement(data: AppDataState, achievementId: string): Promise<ProfileMutationResult>
  reorderAchievements(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createExperienceEntry(data: AppDataState, profileId: string): Promise<ProfileMutationResult>
  updateExperienceEntry(data: AppDataState, input: UpdateExperienceEntryInput): Promise<ProfileMutationResult>
  deleteExperienceEntry(data: AppDataState, experienceEntryId: string): Promise<ProfileMutationResult>
  reorderExperienceEntries(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createExperienceBullet(data: AppDataState, experienceEntryId: string): Promise<ProfileMutationResult>
  updateExperienceBullet(data: AppDataState, input: UpdateExperienceBulletInput): Promise<ProfileMutationResult>
  deleteExperienceBullet(data: AppDataState, experienceBulletId: string): Promise<ProfileMutationResult>
  reorderExperienceBullets(data: AppDataState, input: ReorderExperienceBulletsInput): Promise<ProfileMutationResult>
  createEducationEntry(data: AppDataState, profileId: string): Promise<ProfileMutationResult>
  updateEducationEntry(data: AppDataState, input: UpdateEducationEntryInput): Promise<ProfileMutationResult>
  deleteEducationEntry(data: AppDataState, educationEntryId: string): Promise<ProfileMutationResult>
  reorderEducationEntries(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createEducationBullet(data: AppDataState, educationEntryId: string): Promise<ProfileMutationResult>
  updateEducationBullet(data: AppDataState, input: UpdateEducationBulletInput): Promise<ProfileMutationResult>
  deleteEducationBullet(data: AppDataState, educationBulletId: string): Promise<ProfileMutationResult>
  reorderEducationBullets(data: AppDataState, input: ReorderEducationBulletsInput): Promise<ProfileMutationResult>
  createJob(data: AppDataState, input: CreateJobInput): Promise<JobMutationResult>
  updateJob(data: AppDataState, input: UpdateJobInput): Promise<JobMutationResult>
  deleteJob(data: AppDataState, jobId: string): Promise<JobMutationResult>
  createJobLink(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateJobLink(data: AppDataState, input: UpdateJobLinkInput): Promise<JobMutationResult>
  deleteJobLink(data: AppDataState, jobLinkId: string): Promise<JobMutationResult>
  reorderJobLinks(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createJobContact(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateJobContact(data: AppDataState, input: UpdateJobContactInput): Promise<JobMutationResult>
  deleteJobContact(data: AppDataState, jobContactId: string): Promise<JobMutationResult>
  reorderJobContacts(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createApplicationQuestion(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateApplicationQuestion(data: AppDataState, input: UpdateApplicationQuestionInput): Promise<JobMutationResult>
  deleteApplicationQuestion(data: AppDataState, applicationQuestionId: string): Promise<JobMutationResult>
  reorderApplicationQuestions(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  setJobAppliedAt(data: AppDataState, input: SetJobAppliedAtInput): Promise<JobMutationResult>
  clearJobAppliedAt(data: AppDataState, jobId: string): Promise<JobMutationResult>
  setJobFinalOutcome(data: AppDataState, input: SetJobFinalOutcomeInput): Promise<JobMutationResult>
  clearJobFinalOutcome(data: AppDataState, jobId: string): Promise<JobMutationResult>
  createInterview(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateInterview(data: AppDataState, input: UpdateInterviewInput): Promise<JobMutationResult>
  deleteInterview(data: AppDataState, interviewId: string): Promise<JobMutationResult>
  addInterviewContact(data: AppDataState, input: AddInterviewContactInput): Promise<JobMutationResult>
  removeInterviewContact(data: AppDataState, interviewContactId: string): Promise<JobMutationResult>
  reorderInterviewContacts(data: AppDataState, input: ReorderInterviewContactsInput): Promise<JobMutationResult>
}

export class LocalAppApiClient implements AppApiClient {
  constructor(private readonly service: AppDataService) {}

  private async sync(data: AppDataState) {
    await this.service.replaceAppData(data)
  }

  getAppData(): Promise<AppDataState> {
    return this.service.getAppData()
  }

  replaceAppData(data: AppDataState): Promise<AppDataState> {
    return this.service.replaceAppData(data)
  }

  importAppData(file: AppExportFile): Promise<AppDataState> {
    return this.service.importAppData(file)
  }

  exportAppData(data: AppDataState): Promise<AppExportFile> {
    return this.service.exportAppData(data)
  }

  async createBaseProfile(data: AppDataState, name: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createBaseProfile(name)
  }

  async updateProfile(data: AppDataState, input: UpdateProfileInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateProfile(input)
  }

  async setDocumentHeaderTemplate(data: AppDataState, input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.setDocumentHeaderTemplate(input)
  }

  async setResumeSectionEnabled(data: AppDataState, input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.setResumeSectionEnabled(input)
  }

  async setResumeSectionLabel(data: AppDataState, input: SetResumeSectionLabelInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.setResumeSectionLabel(input)
  }

  async reorderResumeSections(data: AppDataState, input: ReorderResumeSectionsInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderResumeSections(input)
  }

  async duplicateProfile(data: AppDataState, input: DuplicateProfileInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.duplicateProfile(input)
  }

  async deleteProfile(data: AppDataState, profileId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteProfile(profileId)
  }

  async createProfileLink(data: AppDataState, profileId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createProfileLink(profileId)
  }

  async updateProfileLink(data: AppDataState, input: UpdateProfileLinkInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateProfileLink(input)
  }

  async deleteProfileLink(data: AppDataState, profileLinkId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteProfileLink(profileLinkId)
  }

  async reorderProfileLinks(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderProfileLinks(input)
  }

  async createSkillCategory(data: AppDataState, profileId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createSkillCategory(profileId)
  }

  async updateSkillCategory(data: AppDataState, input: UpdateSkillCategoryInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateSkillCategory(input)
  }

  async deleteSkillCategory(data: AppDataState, skillCategoryId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteSkillCategory(skillCategoryId)
  }

  async reorderSkillCategories(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderSkillCategories(input)
  }

  async createSkill(data: AppDataState, skillCategoryId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createSkill(skillCategoryId)
  }

  async updateSkill(data: AppDataState, input: UpdateSkillInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateSkill(input)
  }

  async deleteSkill(data: AppDataState, skillId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteSkill(skillId)
  }

  async reorderSkills(data: AppDataState, skillCategoryId: string, orderedIds: string[]): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderSkills(skillCategoryId, orderedIds)
  }

  async createAchievement(data: AppDataState, profileId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createAchievement(profileId)
  }

  async updateAchievement(data: AppDataState, input: UpdateAchievementInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateAchievement(input)
  }

  async deleteAchievement(data: AppDataState, achievementId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteAchievement(achievementId)
  }

  async reorderAchievements(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderAchievements(input)
  }

  async createExperienceEntry(data: AppDataState, profileId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createExperienceEntry(profileId)
  }

  async updateExperienceEntry(data: AppDataState, input: UpdateExperienceEntryInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateExperienceEntry(input)
  }

  async deleteExperienceEntry(data: AppDataState, experienceEntryId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteExperienceEntry(experienceEntryId)
  }

  async reorderExperienceEntries(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderExperienceEntries(input)
  }

  async createExperienceBullet(data: AppDataState, experienceEntryId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createExperienceBullet(experienceEntryId)
  }

  async updateExperienceBullet(data: AppDataState, input: UpdateExperienceBulletInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateExperienceBullet(input)
  }

  async deleteExperienceBullet(data: AppDataState, experienceBulletId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteExperienceBullet(experienceBulletId)
  }

  async reorderExperienceBullets(data: AppDataState, input: ReorderExperienceBulletsInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderExperienceBullets(input)
  }

  async createEducationEntry(data: AppDataState, profileId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createEducationEntry(profileId)
  }

  async updateEducationEntry(data: AppDataState, input: UpdateEducationEntryInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateEducationEntry(input)
  }

  async deleteEducationEntry(data: AppDataState, educationEntryId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteEducationEntry(educationEntryId)
  }

  async reorderEducationEntries(data: AppDataState, input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderEducationEntries(input)
  }

  async createEducationBullet(data: AppDataState, educationEntryId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.createEducationBullet(educationEntryId)
  }

  async updateEducationBullet(data: AppDataState, input: UpdateEducationBulletInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.updateEducationBullet(input)
  }

  async deleteEducationBullet(data: AppDataState, educationBulletId: string): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.deleteEducationBullet(educationBulletId)
  }

  async reorderEducationBullets(data: AppDataState, input: ReorderEducationBulletsInput): Promise<ProfileMutationResult> {
    await this.sync(data)
    return this.service.reorderEducationBullets(input)
  }

  async createJob(data: AppDataState, input: CreateJobInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createJob(input)
  }

  async updateJob(data: AppDataState, input: UpdateJobInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateJob(input)
  }

  async deleteJob(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteJob(jobId)
  }

  async createJobLink(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createJobLink(jobId)
  }

  async updateJobLink(data: AppDataState, input: UpdateJobLinkInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateJobLink(input)
  }

  async deleteJobLink(data: AppDataState, jobLinkId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteJobLink(jobLinkId)
  }

  async reorderJobLinks(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderJobLinks(input)
  }

  async createJobContact(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createJobContact(jobId)
  }

  async updateJobContact(data: AppDataState, input: UpdateJobContactInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateJobContact(input)
  }

  async deleteJobContact(data: AppDataState, jobContactId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteJobContact(jobContactId)
  }

  async reorderJobContacts(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderJobContacts(input)
  }

  async createApplicationQuestion(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createApplicationQuestion(jobId)
  }

  async updateApplicationQuestion(data: AppDataState, input: UpdateApplicationQuestionInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateApplicationQuestion(input)
  }

  async deleteApplicationQuestion(data: AppDataState, applicationQuestionId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteApplicationQuestion(applicationQuestionId)
  }

  async reorderApplicationQuestions(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderApplicationQuestions(input)
  }

  async setJobAppliedAt(data: AppDataState, input: SetJobAppliedAtInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.setJobAppliedAt(input)
  }

  async clearJobAppliedAt(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.clearJobAppliedAt(jobId)
  }

  async setJobFinalOutcome(data: AppDataState, input: SetJobFinalOutcomeInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.setJobFinalOutcome(input)
  }

  async clearJobFinalOutcome(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.clearJobFinalOutcome(jobId)
  }

  async createInterview(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createInterview(jobId)
  }

  async updateInterview(data: AppDataState, input: UpdateInterviewInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateInterview(input)
  }

  async deleteInterview(data: AppDataState, interviewId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteInterview(interviewId)
  }

  async addInterviewContact(data: AppDataState, input: AddInterviewContactInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.addInterviewContact(input)
  }

  async removeInterviewContact(data: AppDataState, interviewContactId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.removeInterviewContact(interviewContactId)
  }

  async reorderInterviewContacts(data: AppDataState, input: ReorderInterviewContactsInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderInterviewContacts(input)
  }
}

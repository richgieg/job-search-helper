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
  ReorderAdditionalExperienceBulletsInput,
  ReorderEducationBulletsInput,
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
import type { AppDataService } from './app-data-service'
import type { JobsListDto } from './read-models'

export interface AppApiClient {
  getAppData(): Promise<AppDataState>
  getJobsList(): Promise<JobsListDto>
  importAppData(file: AppExportFile): Promise<AppDataState>
  exportAppData(): Promise<AppExportFile>
  createBaseProfile(name: string): Promise<ProfileMutationResult>
  updateProfile(input: UpdateProfileInput): Promise<ProfileMutationResult>
  setDocumentHeaderTemplate(input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult>
  setResumeSectionEnabled(input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult>
  setResumeSectionLabel(input: SetResumeSectionLabelInput): Promise<ProfileMutationResult>
  reorderResumeSections(input: ReorderResumeSectionsInput): Promise<ProfileMutationResult>
  duplicateProfile(input: DuplicateProfileInput): Promise<ProfileMutationResult>
  deleteProfile(profileId: string): Promise<ProfileMutationResult>
  createProfileLink(profileId: string): Promise<ProfileMutationResult>
  updateProfileLink(input: UpdateProfileLinkInput): Promise<ProfileMutationResult>
  deleteProfileLink(profileLinkId: string): Promise<ProfileMutationResult>
  reorderProfileLinks(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createSkillCategory(profileId: string): Promise<ProfileMutationResult>
  updateSkillCategory(input: UpdateSkillCategoryInput): Promise<ProfileMutationResult>
  deleteSkillCategory(skillCategoryId: string): Promise<ProfileMutationResult>
  reorderSkillCategories(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createSkill(skillCategoryId: string): Promise<ProfileMutationResult>
  updateSkill(input: UpdateSkillInput): Promise<ProfileMutationResult>
  deleteSkill(skillId: string): Promise<ProfileMutationResult>
  reorderSkills(skillCategoryId: string, orderedIds: string[]): Promise<ProfileMutationResult>
  createAchievement(profileId: string): Promise<ProfileMutationResult>
  updateAchievement(input: UpdateAchievementInput): Promise<ProfileMutationResult>
  deleteAchievement(achievementId: string): Promise<ProfileMutationResult>
  reorderAchievements(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createExperienceEntry(profileId: string): Promise<ProfileMutationResult>
  updateExperienceEntry(input: UpdateExperienceEntryInput): Promise<ProfileMutationResult>
  deleteExperienceEntry(experienceEntryId: string): Promise<ProfileMutationResult>
  reorderExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createExperienceBullet(experienceEntryId: string): Promise<ProfileMutationResult>
  updateExperienceBullet(input: UpdateExperienceBulletInput): Promise<ProfileMutationResult>
  deleteExperienceBullet(experienceBulletId: string): Promise<ProfileMutationResult>
  reorderExperienceBullets(input: ReorderExperienceBulletsInput): Promise<ProfileMutationResult>
  createEducationEntry(profileId: string): Promise<ProfileMutationResult>
  updateEducationEntry(input: UpdateEducationEntryInput): Promise<ProfileMutationResult>
  deleteEducationEntry(educationEntryId: string): Promise<ProfileMutationResult>
  reorderEducationEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createEducationBullet(educationEntryId: string): Promise<ProfileMutationResult>
  updateEducationBullet(input: UpdateEducationBulletInput): Promise<ProfileMutationResult>
  deleteEducationBullet(educationBulletId: string): Promise<ProfileMutationResult>
  reorderEducationBullets(input: ReorderEducationBulletsInput): Promise<ProfileMutationResult>
  createProject(profileId: string): Promise<ProfileMutationResult>
  updateProject(input: UpdateProjectInput): Promise<ProfileMutationResult>
  deleteProject(projectId: string): Promise<ProfileMutationResult>
  reorderProjects(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createProjectBullet(projectId: string): Promise<ProfileMutationResult>
  updateProjectBullet(input: UpdateProjectBulletInput): Promise<ProfileMutationResult>
  deleteProjectBullet(projectBulletId: string): Promise<ProfileMutationResult>
  reorderProjectBullets(input: ReorderProjectBulletsInput): Promise<ProfileMutationResult>
  createAdditionalExperienceEntry(profileId: string): Promise<ProfileMutationResult>
  updateAdditionalExperienceEntry(input: UpdateAdditionalExperienceEntryInput): Promise<ProfileMutationResult>
  deleteAdditionalExperienceEntry(additionalExperienceEntryId: string): Promise<ProfileMutationResult>
  reorderAdditionalExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createAdditionalExperienceBullet(additionalExperienceEntryId: string): Promise<ProfileMutationResult>
  updateAdditionalExperienceBullet(input: UpdateAdditionalExperienceBulletInput): Promise<ProfileMutationResult>
  deleteAdditionalExperienceBullet(additionalExperienceBulletId: string): Promise<ProfileMutationResult>
  reorderAdditionalExperienceBullets(input: ReorderAdditionalExperienceBulletsInput): Promise<ProfileMutationResult>
  createCertification(profileId: string): Promise<ProfileMutationResult>
  updateCertification(input: UpdateCertificationInput): Promise<ProfileMutationResult>
  deleteCertification(certificationId: string): Promise<ProfileMutationResult>
  reorderCertifications(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createReference(profileId: string): Promise<ProfileMutationResult>
  updateReference(input: UpdateReferenceInput): Promise<ProfileMutationResult>
  deleteReference(referenceId: string): Promise<ProfileMutationResult>
  reorderReferences(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult>
  createJob(input: CreateJobInput): Promise<JobMutationResult>
  updateJob(input: UpdateJobInput): Promise<JobMutationResult>
  deleteJob(jobId: string): Promise<JobMutationResult>
  createJobLink(jobId: string): Promise<JobMutationResult>
  updateJobLink(input: UpdateJobLinkInput): Promise<JobMutationResult>
  deleteJobLink(jobLinkId: string): Promise<JobMutationResult>
  reorderJobLinks(input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createJobContact(jobId: string): Promise<JobMutationResult>
  updateJobContact(input: UpdateJobContactInput): Promise<JobMutationResult>
  deleteJobContact(jobContactId: string): Promise<JobMutationResult>
  reorderJobContacts(input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createApplicationQuestion(jobId: string): Promise<JobMutationResult>
  updateApplicationQuestion(input: UpdateApplicationQuestionInput): Promise<JobMutationResult>
  deleteApplicationQuestion(applicationQuestionId: string): Promise<JobMutationResult>
  reorderApplicationQuestions(input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  setJobAppliedAt(input: SetJobAppliedAtInput): Promise<JobMutationResult>
  clearJobAppliedAt(jobId: string): Promise<JobMutationResult>
  setJobFinalOutcome(input: SetJobFinalOutcomeInput): Promise<JobMutationResult>
  clearJobFinalOutcome(jobId: string): Promise<JobMutationResult>
  createInterview(jobId: string): Promise<JobMutationResult>
  updateInterview(input: UpdateInterviewInput): Promise<JobMutationResult>
  deleteInterview(interviewId: string): Promise<JobMutationResult>
  addInterviewContact(input: AddInterviewContactInput): Promise<JobMutationResult>
  removeInterviewContact(interviewContactId: string): Promise<JobMutationResult>
  reorderInterviewContacts(input: ReorderInterviewContactsInput): Promise<JobMutationResult>
}

export class LocalAppApiClient implements AppApiClient {
  constructor(private readonly service: AppDataService) {}

  getAppData(): Promise<AppDataState> {
    return this.service.getAppData()
  }

  getJobsList(): Promise<JobsListDto> {
    return this.service.getJobsList()
  }

  importAppData(file: AppExportFile): Promise<AppDataState> {
    return this.service.importAppData(file)
  }

  exportAppData(): Promise<AppExportFile> {
    return this.service.exportAppData()
  }

  createBaseProfile(name: string): Promise<ProfileMutationResult> {
    return this.service.createBaseProfile(name)
  }

  updateProfile(input: UpdateProfileInput): Promise<ProfileMutationResult> {
    return this.service.updateProfile(input)
  }

  setDocumentHeaderTemplate(input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult> {
    return this.service.setDocumentHeaderTemplate(input)
  }

  setResumeSectionEnabled(input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult> {
    return this.service.setResumeSectionEnabled(input)
  }

  setResumeSectionLabel(input: SetResumeSectionLabelInput): Promise<ProfileMutationResult> {
    return this.service.setResumeSectionLabel(input)
  }

  reorderResumeSections(input: ReorderResumeSectionsInput): Promise<ProfileMutationResult> {
    return this.service.reorderResumeSections(input)
  }

  duplicateProfile(input: DuplicateProfileInput): Promise<ProfileMutationResult> {
    return this.service.duplicateProfile(input)
  }

  deleteProfile(profileId: string): Promise<ProfileMutationResult> {
    return this.service.deleteProfile(profileId)
  }

  createProfileLink(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createProfileLink(profileId)
  }

  updateProfileLink(input: UpdateProfileLinkInput): Promise<ProfileMutationResult> {
    return this.service.updateProfileLink(input)
  }

  deleteProfileLink(profileLinkId: string): Promise<ProfileMutationResult> {
    return this.service.deleteProfileLink(profileLinkId)
  }

  reorderProfileLinks(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderProfileLinks(input)
  }

  createSkillCategory(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createSkillCategory(profileId)
  }

  updateSkillCategory(input: UpdateSkillCategoryInput): Promise<ProfileMutationResult> {
    return this.service.updateSkillCategory(input)
  }

  deleteSkillCategory(skillCategoryId: string): Promise<ProfileMutationResult> {
    return this.service.deleteSkillCategory(skillCategoryId)
  }

  reorderSkillCategories(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderSkillCategories(input)
  }

  createSkill(skillCategoryId: string): Promise<ProfileMutationResult> {
    return this.service.createSkill(skillCategoryId)
  }

  updateSkill(input: UpdateSkillInput): Promise<ProfileMutationResult> {
    return this.service.updateSkill(input)
  }

  deleteSkill(skillId: string): Promise<ProfileMutationResult> {
    return this.service.deleteSkill(skillId)
  }

  reorderSkills(skillCategoryId: string, orderedIds: string[]): Promise<ProfileMutationResult> {
    return this.service.reorderSkills(skillCategoryId, orderedIds)
  }

  createAchievement(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createAchievement(profileId)
  }

  updateAchievement(input: UpdateAchievementInput): Promise<ProfileMutationResult> {
    return this.service.updateAchievement(input)
  }

  deleteAchievement(achievementId: string): Promise<ProfileMutationResult> {
    return this.service.deleteAchievement(achievementId)
  }

  reorderAchievements(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderAchievements(input)
  }

  createExperienceEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createExperienceEntry(profileId)
  }

  updateExperienceEntry(input: UpdateExperienceEntryInput): Promise<ProfileMutationResult> {
    return this.service.updateExperienceEntry(input)
  }

  deleteExperienceEntry(experienceEntryId: string): Promise<ProfileMutationResult> {
    return this.service.deleteExperienceEntry(experienceEntryId)
  }

  reorderExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderExperienceEntries(input)
  }

  createExperienceBullet(experienceEntryId: string): Promise<ProfileMutationResult> {
    return this.service.createExperienceBullet(experienceEntryId)
  }

  updateExperienceBullet(input: UpdateExperienceBulletInput): Promise<ProfileMutationResult> {
    return this.service.updateExperienceBullet(input)
  }

  deleteExperienceBullet(experienceBulletId: string): Promise<ProfileMutationResult> {
    return this.service.deleteExperienceBullet(experienceBulletId)
  }

  reorderExperienceBullets(input: ReorderExperienceBulletsInput): Promise<ProfileMutationResult> {
    return this.service.reorderExperienceBullets(input)
  }

  createEducationEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createEducationEntry(profileId)
  }

  updateEducationEntry(input: UpdateEducationEntryInput): Promise<ProfileMutationResult> {
    return this.service.updateEducationEntry(input)
  }

  deleteEducationEntry(educationEntryId: string): Promise<ProfileMutationResult> {
    return this.service.deleteEducationEntry(educationEntryId)
  }

  reorderEducationEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderEducationEntries(input)
  }

  createEducationBullet(educationEntryId: string): Promise<ProfileMutationResult> {
    return this.service.createEducationBullet(educationEntryId)
  }

  updateEducationBullet(input: UpdateEducationBulletInput): Promise<ProfileMutationResult> {
    return this.service.updateEducationBullet(input)
  }

  deleteEducationBullet(educationBulletId: string): Promise<ProfileMutationResult> {
    return this.service.deleteEducationBullet(educationBulletId)
  }

  reorderEducationBullets(input: ReorderEducationBulletsInput): Promise<ProfileMutationResult> {
    return this.service.reorderEducationBullets(input)
  }

  createProject(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createProject(profileId)
  }

  updateProject(input: UpdateProjectInput): Promise<ProfileMutationResult> {
    return this.service.updateProject(input)
  }

  deleteProject(projectId: string): Promise<ProfileMutationResult> {
    return this.service.deleteProject(projectId)
  }

  reorderProjects(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderProjects(input)
  }

  createProjectBullet(projectId: string): Promise<ProfileMutationResult> {
    return this.service.createProjectBullet(projectId)
  }

  updateProjectBullet(input: UpdateProjectBulletInput): Promise<ProfileMutationResult> {
    return this.service.updateProjectBullet(input)
  }

  deleteProjectBullet(projectBulletId: string): Promise<ProfileMutationResult> {
    return this.service.deleteProjectBullet(projectBulletId)
  }

  reorderProjectBullets(input: ReorderProjectBulletsInput): Promise<ProfileMutationResult> {
    return this.service.reorderProjectBullets(input)
  }

  createAdditionalExperienceEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createAdditionalExperienceEntry(profileId)
  }

  updateAdditionalExperienceEntry(input: UpdateAdditionalExperienceEntryInput): Promise<ProfileMutationResult> {
    return this.service.updateAdditionalExperienceEntry(input)
  }

  deleteAdditionalExperienceEntry(additionalExperienceEntryId: string): Promise<ProfileMutationResult> {
    return this.service.deleteAdditionalExperienceEntry(additionalExperienceEntryId)
  }

  reorderAdditionalExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderAdditionalExperienceEntries(input)
  }

  createAdditionalExperienceBullet(additionalExperienceEntryId: string): Promise<ProfileMutationResult> {
    return this.service.createAdditionalExperienceBullet(additionalExperienceEntryId)
  }

  updateAdditionalExperienceBullet(input: UpdateAdditionalExperienceBulletInput): Promise<ProfileMutationResult> {
    return this.service.updateAdditionalExperienceBullet(input)
  }

  deleteAdditionalExperienceBullet(additionalExperienceBulletId: string): Promise<ProfileMutationResult> {
    return this.service.deleteAdditionalExperienceBullet(additionalExperienceBulletId)
  }

  reorderAdditionalExperienceBullets(input: ReorderAdditionalExperienceBulletsInput): Promise<ProfileMutationResult> {
    return this.service.reorderAdditionalExperienceBullets(input)
  }

  createCertification(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createCertification(profileId)
  }

  updateCertification(input: UpdateCertificationInput): Promise<ProfileMutationResult> {
    return this.service.updateCertification(input)
  }

  deleteCertification(certificationId: string): Promise<ProfileMutationResult> {
    return this.service.deleteCertification(certificationId)
  }

  reorderCertifications(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderCertifications(input)
  }

  createReference(profileId: string): Promise<ProfileMutationResult> {
    return this.service.createReference(profileId)
  }

  updateReference(input: UpdateReferenceInput): Promise<ProfileMutationResult> {
    return this.service.updateReference(input)
  }

  deleteReference(referenceId: string): Promise<ProfileMutationResult> {
    return this.service.deleteReference(referenceId)
  }

  reorderReferences(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.service.reorderReferences(input)
  }

  createJob(input: CreateJobInput): Promise<JobMutationResult> {
    return this.service.createJob(input)
  }

  updateJob(input: UpdateJobInput): Promise<JobMutationResult> {
    return this.service.updateJob(input)
  }

  deleteJob(jobId: string): Promise<JobMutationResult> {
    return this.service.deleteJob(jobId)
  }

  createJobLink(jobId: string): Promise<JobMutationResult> {
    return this.service.createJobLink(jobId)
  }

  updateJobLink(input: UpdateJobLinkInput): Promise<JobMutationResult> {
    return this.service.updateJobLink(input)
  }

  deleteJobLink(jobLinkId: string): Promise<JobMutationResult> {
    return this.service.deleteJobLink(jobLinkId)
  }

  reorderJobLinks(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.service.reorderJobLinks(input)
  }

  createJobContact(jobId: string): Promise<JobMutationResult> {
    return this.service.createJobContact(jobId)
  }

  updateJobContact(input: UpdateJobContactInput): Promise<JobMutationResult> {
    return this.service.updateJobContact(input)
  }

  deleteJobContact(jobContactId: string): Promise<JobMutationResult> {
    return this.service.deleteJobContact(jobContactId)
  }

  reorderJobContacts(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.service.reorderJobContacts(input)
  }

  createApplicationQuestion(jobId: string): Promise<JobMutationResult> {
    return this.service.createApplicationQuestion(jobId)
  }

  updateApplicationQuestion(input: UpdateApplicationQuestionInput): Promise<JobMutationResult> {
    return this.service.updateApplicationQuestion(input)
  }

  deleteApplicationQuestion(applicationQuestionId: string): Promise<JobMutationResult> {
    return this.service.deleteApplicationQuestion(applicationQuestionId)
  }

  reorderApplicationQuestions(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.service.reorderApplicationQuestions(input)
  }

  setJobAppliedAt(input: SetJobAppliedAtInput): Promise<JobMutationResult> {
    return this.service.setJobAppliedAt(input)
  }

  clearJobAppliedAt(jobId: string): Promise<JobMutationResult> {
    return this.service.clearJobAppliedAt(jobId)
  }

  setJobFinalOutcome(input: SetJobFinalOutcomeInput): Promise<JobMutationResult> {
    return this.service.setJobFinalOutcome(input)
  }

  clearJobFinalOutcome(jobId: string): Promise<JobMutationResult> {
    return this.service.clearJobFinalOutcome(jobId)
  }

  createInterview(jobId: string): Promise<JobMutationResult> {
    return this.service.createInterview(jobId)
  }

  updateInterview(input: UpdateInterviewInput): Promise<JobMutationResult> {
    return this.service.updateInterview(input)
  }

  deleteInterview(interviewId: string): Promise<JobMutationResult> {
    return this.service.deleteInterview(interviewId)
  }

  addInterviewContact(input: AddInterviewContactInput): Promise<JobMutationResult> {
    return this.service.addInterviewContact(input)
  }

  removeInterviewContact(interviewContactId: string): Promise<JobMutationResult> {
    return this.service.removeInterviewContact(interviewContactId)
  }

  reorderInterviewContacts(input: ReorderInterviewContactsInput): Promise<JobMutationResult> {
    return this.service.reorderInterviewContacts(input)
  }
}

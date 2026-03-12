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
  ReorderAdditionalExperienceBulletsInput,
  ReorderEducationBulletsInput,
  ReorderProjectBulletsInput,
  ProfileMutationResult,
  ReorderProfileEntitiesInput,
  ReorderResumeSectionsInput,
  ReorderExperienceBulletsInput,
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

export interface AppDataService {
  getAppData(): Promise<AppDataState>
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

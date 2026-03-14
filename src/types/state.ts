import type { z } from 'zod'

import {
  AdditionalExperienceBulletSchema,
  AdditionalExperienceEntrySchema,
  AppDataStateSchema,
  AppExportFileSchema,
  ApplicationQuestionSchema,
  AchievementSchema,
  BulletLevelSchema,
  CertificationSchema,
  ContactOrganizationKindSchema,
  DocumentContactSchema,
  DocumentHeaderTemplateSchema,
  EducationBulletSchema,
  EducationEntrySchema,
  EducationStatusSchema,
  EmploymentTypeSchema,
  ExperienceBulletSchema,
  ExperienceEntrySchema,
  ExperienceSupervisorSchema,
  FinalOutcomeSchema,
  FinalOutcomeStatusSchema,
  IdSchema,
  InterviewContactSchema,
  InterviewSchema,
  IsoDateSchema,
  IsoTimestampSchema,
  JobComputedStatusSchema,
  JobContactSchema,
  JobLinkSchema,
  JobSchema,
  JobStatusFilterSchema,
  PersonalDetailsSchema,
  ProfileLinkSchema,
  ProfileSchema,
  ProjectBulletSchema,
  ProjectSchema,
  ReferenceSchema,
  ReferenceTypeSchema,
  ResumeSectionKeySchema,
  ResumeSectionSettingsSchema,
  ResumeSettingsSchema,
  SkillCategorySchema,
  SkillSchema,
  WorkArrangementSchema,
} from './state-schema'

export type Id = z.infer<typeof IdSchema>
export type IsoTimestamp = z.infer<typeof IsoTimestampSchema>
export type IsoDate = z.infer<typeof IsoDateSchema>

export type WorkArrangement = z.infer<typeof WorkArrangementSchema>
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>

export type ContactOrganizationKind = z.infer<typeof ContactOrganizationKindSchema>

export type ReferenceType = z.infer<typeof ReferenceTypeSchema>

export type EducationStatus = z.infer<typeof EducationStatusSchema>

export type FinalOutcomeStatus = z.infer<typeof FinalOutcomeStatusSchema>

export type JobComputedStatus = z.infer<typeof JobComputedStatusSchema>

export type JobStatusFilter = z.infer<typeof JobStatusFilterSchema>

export type DocumentHeaderTemplate = z.infer<typeof DocumentHeaderTemplateSchema>
export type BulletLevel = z.infer<typeof BulletLevelSchema>

export type ResumeSectionKey = z.infer<typeof ResumeSectionKeySchema>

export type ResumeSectionSettings = z.infer<typeof ResumeSectionSettingsSchema>

export type ResumeSettings = z.infer<typeof ResumeSettingsSchema>

export type PersonalDetails = z.infer<typeof PersonalDetailsSchema>

export type Profile = z.infer<typeof ProfileSchema>

export type ProfileLink = z.infer<typeof ProfileLinkSchema>

export type SkillCategory = z.infer<typeof SkillCategorySchema>

export type Skill = z.infer<typeof SkillSchema>

export type Achievement = z.infer<typeof AchievementSchema>

export type ExperienceSupervisor = z.infer<typeof ExperienceSupervisorSchema>

export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>

export type ExperienceBullet = z.infer<typeof ExperienceBulletSchema>

export type EducationEntry = z.infer<typeof EducationEntrySchema>

export type EducationBullet = z.infer<typeof EducationBulletSchema>

export type Project = z.infer<typeof ProjectSchema>

export type ProjectBullet = z.infer<typeof ProjectBulletSchema>

export type AdditionalExperienceEntry = z.infer<typeof AdditionalExperienceEntrySchema>

export type AdditionalExperienceBullet = z.infer<typeof AdditionalExperienceBulletSchema>

export type Certification = z.infer<typeof CertificationSchema>

export type Reference = z.infer<typeof ReferenceSchema>

export type Job = z.infer<typeof JobSchema>

export type FinalOutcome = z.infer<typeof FinalOutcomeSchema>

export type JobLink = z.infer<typeof JobLinkSchema>

export type JobContact = z.infer<typeof JobContactSchema>

export type DocumentContact = z.infer<typeof DocumentContactSchema>

export type ApplicationQuestion = z.infer<typeof ApplicationQuestionSchema>

export type Interview = z.infer<typeof InterviewSchema>

export type InterviewContact = z.infer<typeof InterviewContactSchema>

export type AppDataState = z.infer<typeof AppDataStateSchema>

export type AppExportFile = z.infer<typeof AppExportFileSchema>

export {
  AdditionalExperienceBulletSchema,
  AdditionalExperienceEntrySchema,
  AppDataStateSchema,
  AppExportFileSchema,
  ApplicationQuestionSchema,
  AchievementSchema,
  BulletLevelSchema,
  CertificationSchema,
  ContactOrganizationKindSchema,
  DocumentContactSchema,
  DocumentHeaderTemplateSchema,
  EducationBulletSchema,
  EducationEntrySchema,
  EducationStatusSchema,
  EmploymentTypeSchema,
  ExperienceBulletSchema,
  ExperienceEntrySchema,
  ExperienceSupervisorSchema,
  FinalOutcomeSchema,
  FinalOutcomeStatusSchema,
  IdSchema,
  InterviewContactSchema,
  InterviewSchema,
  IsoDateSchema,
  IsoTimestampSchema,
  JobComputedStatusSchema,
  JobContactSchema,
  JobLinkSchema,
  JobSchema,
  JobStatusFilterSchema,
  PersonalDetailsSchema,
  ProfileLinkSchema,
  ProfileSchema,
  ProjectBulletSchema,
  ProjectSchema,
  ReferenceSchema,
  ReferenceTypeSchema,
  ResumeSectionKeySchema,
  ResumeSectionSettingsSchema,
  ResumeSettingsSchema,
  SkillCategorySchema,
  SkillSchema,
  WorkArrangementSchema,
}

import { z } from 'zod'

export const IdSchema = z.string()
export const IsoTimestampSchema = z.string()
export const IsoDateSchema = z.string()

export const WorkArrangementSchema = z.enum(['onsite', 'hybrid', 'remote', 'unknown'])
export const EmploymentTypeSchema = z.enum(['unknown', 'full_time', 'part_time', 'contract', 'internship', 'temporary', 'other'])
export const ContactOrganizationKindSchema = z.enum(['company', 'staffing_agency'])
export const ReferenceTypeSchema = z.enum(['professional', 'personal'])
export const EducationStatusSchema = z.enum(['graduated', 'attended', 'in_progress'])
export const FinalOutcomeStatusSchema = z.enum(['withdrew', 'rejected', 'offer_received', 'offer_accepted'])
export const JobComputedStatusSchema = z.enum(['interested', 'applied', 'interview', 'offer_received', 'offer_accepted', 'rejected', 'withdrew'])
export const JobStatusFilterSchema = z.union([JobComputedStatusSchema, z.literal('all')])
export const DocumentHeaderTemplateSchema = z.enum(['classic', 'stacked'])
export const BulletLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export const ResumeSectionKeySchema = z.enum([
  'summary',
  'skills',
  'achievements',
  'experience',
  'education',
  'projects',
  'additional_experience',
  'certifications',
  'references',
])

export const ResumeSectionSettingsSchema = z.object({
  enabled: z.boolean(),
  sortOrder: z.number(),
  label: z.string(),
})

export const ResumeSettingsSchema = z.object({
  headerTemplate: DocumentHeaderTemplateSchema,
  sections: z.record(ResumeSectionKeySchema, ResumeSectionSettingsSchema),
})

export const PersonalDetailsSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  addressLine3: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
})

export const ProfileSchema = z.object({
  id: IdSchema,
  name: z.string(),
  summary: z.string(),
  coverLetter: z.string(),
  coverLetterContactId: IdSchema.nullable(),
  resumeSettings: ResumeSettingsSchema,
  personalDetails: PersonalDetailsSchema,
  jobId: IdSchema.nullable(),
  clonedFromProfileId: IdSchema.nullable(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
})

export const ProfileLinkSchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  name: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const SkillCategorySchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  name: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const SkillSchema = z.object({
  id: IdSchema,
  skillCategoryId: IdSchema,
  name: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const AchievementSchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const ExperienceSupervisorSchema = z.object({
  name: z.string(),
  title: z.string(),
  phone: z.string(),
  email: z.string(),
})

export const ExperienceEntrySchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  company: z.string(),
  title: z.string(),
  location: z.string(),
  workArrangement: WorkArrangementSchema,
  employmentType: EmploymentTypeSchema,
  startDate: IsoDateSchema.nullable(),
  endDate: IsoDateSchema.nullable(),
  isCurrent: z.boolean(),
  reasonForLeavingShort: z.string(),
  reasonForLeavingDetails: z.string(),
  supervisor: ExperienceSupervisorSchema,
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const ExperienceBulletSchema = z.object({
  id: IdSchema,
  experienceEntryId: IdSchema,
  content: z.string(),
  level: BulletLevelSchema,
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const EducationEntrySchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  school: z.string(),
  degree: z.string(),
  startDate: IsoDateSchema.nullable(),
  endDate: IsoDateSchema.nullable(),
  status: EducationStatusSchema,
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const EducationBulletSchema = z.object({
  id: IdSchema,
  educationEntryId: IdSchema,
  content: z.string(),
  level: BulletLevelSchema,
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const ProjectSchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  name: z.string(),
  organization: z.string(),
  startDate: IsoDateSchema.nullable(),
  endDate: IsoDateSchema.nullable(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const ProjectBulletSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  content: z.string(),
  level: BulletLevelSchema,
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const AdditionalExperienceEntrySchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  title: z.string(),
  organization: z.string(),
  location: z.string(),
  startDate: IsoDateSchema.nullable(),
  endDate: IsoDateSchema.nullable(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const AdditionalExperienceBulletSchema = z.object({
  id: IdSchema,
  additionalExperienceEntryId: IdSchema,
  content: z.string(),
  level: BulletLevelSchema,
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const CertificationSchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  name: z.string(),
  issuer: z.string(),
  issueDate: IsoDateSchema.nullable(),
  expiryDate: IsoDateSchema.nullable(),
  credentialId: z.string(),
  credentialUrl: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const ReferenceSchema = z.object({
  id: IdSchema,
  profileId: IdSchema,
  type: ReferenceTypeSchema,
  name: z.string(),
  relationship: z.string(),
  company: z.string(),
  title: z.string(),
  email: z.string(),
  phone: z.string(),
  notes: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number(),
})

export const FinalOutcomeSchema = z.object({
  status: FinalOutcomeStatusSchema,
  setAt: IsoTimestampSchema,
})

export const JobSchema = z.object({
  id: IdSchema,
  companyName: z.string(),
  staffingAgencyName: z.string(),
  jobTitle: z.string(),
  description: z.string(),
  location: z.string(),
  postedCompensation: z.string(),
  desiredCompensation: z.string(),
  compensationNotes: z.string(),
  workArrangement: WorkArrangementSchema,
  employmentType: EmploymentTypeSchema,
  datePosted: IsoDateSchema.nullable(),
  appliedAt: IsoTimestampSchema.nullable(),
  finalOutcome: FinalOutcomeSchema.nullable(),
  notes: z.string(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
})

export const JobLinkSchema = z.object({
  id: IdSchema,
  jobId: IdSchema,
  url: z.string(),
  sortOrder: z.number(),
  createdAt: IsoTimestampSchema,
})

export const JobContactSchema = z.object({
  id: IdSchema,
  jobId: IdSchema,
  name: z.string(),
  title: z.string(),
  company: z.string(),
  organizationKind: ContactOrganizationKindSchema,
  addressLine1: z.string(),
  addressLine2: z.string(),
  addressLine3: z.string(),
  addressLine4: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedinUrl: z.string(),
  notes: z.string(),
  sortOrder: z.number(),
})

export const DocumentContactSchema = z.object({
  id: IdSchema,
  name: z.string(),
  title: z.string(),
  company: z.string(),
  organizationKind: ContactOrganizationKindSchema,
  addressLine1: z.string(),
  addressLine2: z.string(),
  addressLine3: z.string(),
  addressLine4: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedinUrl: z.string(),
  notes: z.string(),
  sortOrder: z.number(),
  isVirtual: z.boolean(),
})

export const ApplicationQuestionSchema = z.object({
  id: IdSchema,
  jobId: IdSchema,
  question: z.string(),
  answer: z.string(),
  sortOrder: z.number(),
})

export const InterviewSchema = z.object({
  id: IdSchema,
  jobId: IdSchema,
  createdAt: IsoTimestampSchema,
  startAt: IsoTimestampSchema.nullable(),
  notes: z.string(),
})

export const InterviewContactSchema = z.object({
  id: IdSchema,
  interviewId: IdSchema,
  jobContactId: IdSchema,
  sortOrder: z.number(),
})

export const AppDataStateSchema = z.object({
  version: z.literal(1),
  exportedAt: IsoTimestampSchema.optional(),
  profiles: z.record(IdSchema, ProfileSchema),
  profileLinks: z.record(IdSchema, ProfileLinkSchema),
  skillCategories: z.record(IdSchema, SkillCategorySchema),
  skills: z.record(IdSchema, SkillSchema),
  achievements: z.record(IdSchema, AchievementSchema),
  experienceEntries: z.record(IdSchema, ExperienceEntrySchema),
  experienceBullets: z.record(IdSchema, ExperienceBulletSchema),
  educationEntries: z.record(IdSchema, EducationEntrySchema),
  educationBullets: z.record(IdSchema, EducationBulletSchema),
  projects: z.record(IdSchema, ProjectSchema),
  projectBullets: z.record(IdSchema, ProjectBulletSchema),
  additionalExperienceEntries: z.record(IdSchema, AdditionalExperienceEntrySchema),
  additionalExperienceBullets: z.record(IdSchema, AdditionalExperienceBulletSchema),
  certifications: z.record(IdSchema, CertificationSchema),
  references: z.record(IdSchema, ReferenceSchema),
  jobs: z.record(IdSchema, JobSchema),
  jobLinks: z.record(IdSchema, JobLinkSchema),
  jobContacts: z.record(IdSchema, JobContactSchema),
  interviews: z.record(IdSchema, InterviewSchema),
  interviewContacts: z.record(IdSchema, InterviewContactSchema),
  applicationQuestions: z.record(IdSchema, ApplicationQuestionSchema),
})

export const AppDataExportPayloadSchema = AppDataStateSchema.omit({ version: true, exportedAt: true })

export const AppExportFileSchema = z.object({
  version: z.literal(1),
  exportedAt: IsoTimestampSchema,
  data: AppDataExportPayloadSchema,
})
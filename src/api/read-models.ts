import type {
  Achievement,
  AdditionalExperienceBullet,
  AdditionalExperienceEntry,
  ApplicationQuestion,
  Certification,
  EducationBullet,
  EducationEntry,
  ExperienceBullet,
  ExperienceEntry,
  Interview,
  InterviewContact,
  Job,
  JobComputedStatus,
  JobContact,
  JobLink,
  Profile,
  ProfileLink,
  Project,
  ProjectBullet,
  Reference,
  Skill,
  SkillCategory,
} from '../types/state'
import type { ProfileDocumentData } from '../features/documents/document-data'

export interface DashboardSummaryDto {
  profileCount: number
  baseProfileCount: number
  jobProfileCount: number
  jobCount: number
  activeInterviewCount: number
  contactCount: number
  updatedAt: string
}

export interface JobsListLinkDto {
  id: string
  url: string
}

export interface JobsListItemDto {
  id: string
  companyName: string
  staffingAgencyName: string
  jobTitle: string
  computedStatus: JobComputedStatus
  interviewCount: number
  jobLinks: JobsListLinkDto[]
  createdAt: string
  updatedAt: string
}

export interface JobsListDto {
  items: JobsListItemDto[]
  updatedAt: string
}

export interface JobDetailInterviewContactDto {
  interviewContact: InterviewContact
  jobContact: JobContact | null
}

export interface JobDetailInterviewDto {
  interview: Interview
  contacts: JobDetailInterviewContactDto[]
}

export interface JobDetailDto {
  job: Job
  computedStatus: JobComputedStatus
  relatedProfiles: Profile[]
  jobLinks: JobLink[]
  jobContacts: JobContact[]
  interviews: JobDetailInterviewDto[]
  applicationQuestions: ApplicationQuestion[]
}

export interface ProfilesListItemDto {
  id: string
  name: string
  kind: 'base' | 'job'
  jobId: string | null
  jobSummary: null | {
    id: string
    companyName: string
    staffingAgencyName: string
    jobTitle: string
  }
  createdAt: string
  updatedAt: string
}

export interface ProfilesListDto {
  items: ProfilesListItemDto[]
  updatedAt: string
}

export interface ProfileDetailSkillCategoryDto {
  category: SkillCategory
  skills: Skill[]
}

export interface ProfileDetailExperienceEntryDto {
  entry: ExperienceEntry
  bullets: ExperienceBullet[]
}

export interface ProfileDetailEducationEntryDto {
  entry: EducationEntry
  bullets: EducationBullet[]
}

export interface ProfileDetailProjectEntryDto {
  entry: Project
  bullets: ProjectBullet[]
}

export interface ProfileDetailAdditionalExperienceEntryDto {
  entry: AdditionalExperienceEntry
  bullets: AdditionalExperienceBullet[]
}

export interface ProfileDetailDto {
  profile: Profile
  attachedJob: Job | null
  profileLinks: ProfileLink[]
  skillCategories: ProfileDetailSkillCategoryDto[]
  achievements: Achievement[]
  experienceEntries: ProfileDetailExperienceEntryDto[]
  educationEntries: ProfileDetailEducationEntryDto[]
  projectEntries: ProfileDetailProjectEntryDto[]
  additionalExperienceEntries: ProfileDetailAdditionalExperienceEntryDto[]
  certifications: Certification[]
  references: Reference[]
}

export type ProfileDocumentDto = ProfileDocumentData
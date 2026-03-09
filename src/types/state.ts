export type Id = string
export type IsoTimestamp = string
export type IsoDate = string

export type WorkArrangement = 'onsite' | 'hybrid' | 'remote' | 'unknown'
export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'
  | 'other'

export type ContactRelationshipType =
  | 'recruiter'
  | 'hiring_manager'
  | 'referral'
  | 'interviewer'
  | 'other'

export type ReferenceType = 'professional' | 'personal'

export type FinalOutcomeStatus =
  | 'withdrew'
  | 'rejected'
  | 'offer_received'
  | 'offer_accepted'

export type JobComputedStatus =
  | 'interested'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrew'

export type JobStatusFilter = JobComputedStatus | 'all'

export type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'references'

export interface ResumeSectionSettings {
  enabled: boolean
  sortOrder: number
}

export interface ResumeSettings {
  sections: Record<ResumeSectionKey, ResumeSectionSettings>
}

export interface PersonalDetails {
  fullName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  city: string
  state: string
  postalCode: string
}

export interface Profile {
  id: Id
  name: string
  summary: string
  coverLetter: string
  resumeSettings: ResumeSettings
  personalDetails: PersonalDetails
  jobId: Id | null
  clonedFromProfileId: Id | null
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
}

export interface ProfileLink {
  id: Id
  profileId: Id
  name: string
  url: string
  enabled: boolean
  sortOrder: number
}

export interface SkillCategory {
  id: Id
  profileId: Id
  name: string
  enabled: boolean
  sortOrder: number
}

export interface Skill {
  id: Id
  skillCategoryId: Id
  name: string
  enabled: boolean
  sortOrder: number
}

export interface ExperienceSupervisor {
  name: string
  title: string
  phone: string
  email: string
}

export interface ExperienceEntry {
  id: Id
  profileId: Id
  company: string
  title: string
  location: string
  workArrangement: WorkArrangement
  employmentType: EmploymentType
  startDate: IsoDate | null
  endDate: IsoDate | null
  isCurrent: boolean
  reasonForLeavingShort: string
  reasonForLeavingDetails: string
  supervisor: ExperienceSupervisor
  enabled: boolean
  sortOrder: number
}

export interface ExperienceBullet {
  id: Id
  experienceEntryId: Id
  content: string
  enabled: boolean
  sortOrder: number
}

export interface EducationEntry {
  id: Id
  profileId: Id
  school: string
  degree: string
  graduationDate: IsoDate | null
  enabled: boolean
  sortOrder: number
}

export interface Certification {
  id: Id
  profileId: Id
  name: string
  issuer: string
  issueDate: IsoDate | null
  expiryDate: IsoDate | null
  credentialId: string
  credentialUrl: string
  enabled: boolean
  sortOrder: number
}

export interface Reference {
  id: Id
  profileId: Id
  type: ReferenceType
  name: string
  relationship: string
  company: string
  title: string
  email: string
  phone: string
  notes: string
  enabled: boolean
  sortOrder: number
}

export interface Job {
  id: Id
  companyName: string
  jobTitle: string
  description: string
  location: string
  postedCompensation: string
  desiredCompensation: string
  compensationNotes: string
  workArrangement: WorkArrangement
  employmentType: EmploymentType
  datePosted: IsoDate | null
  appliedAt: IsoTimestamp | null
  finalOutcome: FinalOutcome | null
  notes: string
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
}

export interface FinalOutcome {
  status: FinalOutcomeStatus
  setAt: IsoTimestamp
}

export interface JobLink {
  id: Id
  jobId: Id
  url: string
  sortOrder: number
  createdAt: IsoTimestamp
}

export interface JobContact {
  id: Id
  jobId: Id
  name: string
  title: string
  company: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  addressLine4: string
  email: string
  phone: string
  linkedinUrl: string
  relationshipType: ContactRelationshipType
  notes: string
  sortOrder: number
}

export interface ApplicationQuestion {
  id: Id
  jobId: Id
  question: string
  answer: string
  sortOrder: number
}

export interface Interview {
  id: Id
  jobId: Id
  startAt: IsoTimestamp
  endAt: IsoTimestamp | null
  completed: boolean
  notes: string
}

export interface InterviewContact {
  id: Id
  interviewId: Id
  jobContactId: Id
  sortOrder: number
}

export interface AppDataState {
  version: 1
  exportedAt?: IsoTimestamp
  profiles: Record<Id, Profile>
  profileLinks: Record<Id, ProfileLink>
  skillCategories: Record<Id, SkillCategory>
  skills: Record<Id, Skill>
  experienceEntries: Record<Id, ExperienceEntry>
  experienceBullets: Record<Id, ExperienceBullet>
  educationEntries: Record<Id, EducationEntry>
  certifications: Record<Id, Certification>
  references: Record<Id, Reference>
  jobs: Record<Id, Job>
  jobLinks: Record<Id, JobLink>
  jobContacts: Record<Id, JobContact>
  interviews: Record<Id, Interview>
  interviewContacts: Record<Id, InterviewContact>
  applicationQuestions: Record<Id, ApplicationQuestion>
}

export interface JobsListUiState {
  searchText: string
  statusFilter: JobStatusFilter | null
  sortBy: 'updated_at' | 'created_at' | 'company_name' | 'job_title'
  sortDirection: 'asc' | 'desc'
}

export interface ProfilesListUiState {
  searchText: string
  kindFilter: 'base' | 'job' | null
  sortBy: 'updated_at' | 'created_at' | 'name'
  sortDirection: 'asc' | 'desc'
}

export interface DialogUiState {
  importExportOpen: boolean
  duplicateProfileOpen: boolean
  createJobProfileOpen: boolean
}

export interface AppUiState {
  selectedJobId: Id | null
  selectedProfileId: Id | null
  jobsList: JobsListUiState
  profilesList: ProfilesListUiState
  dialogs: DialogUiState
}

export interface AppState {
  data: AppDataState
  ui: AppUiState
}

export interface AppExportFile {
  version: 1
  exportedAt: IsoTimestamp
  data: Omit<AppDataState, 'version' | 'exportedAt'>
}

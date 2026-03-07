import type { AppDataState, AppUiState, PersonalDetails, ProfileLinks, ResumeSettings } from '../types/state'

const createEmptyPersonalDetails = (): PersonalDetails => ({
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  city: '',
  state: '',
  postalCode: '',
})

const createEmptyProfileLinks = (): ProfileLinks => ({
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  websiteUrl: '',
})

export const createDefaultResumeSettings = (): ResumeSettings => ({
  sections: {
    summary: { enabled: true, sortOrder: 1 },
    skills: { enabled: true, sortOrder: 2 },
    experience: { enabled: true, sortOrder: 3 },
    education: { enabled: true, sortOrder: 4 },
    certifications: { enabled: true, sortOrder: 5 },
    references: { enabled: true, sortOrder: 6 },
  },
})

export const createEmptyDataState = (): AppDataState => ({
  version: 1,
  profiles: {},
  skillCategories: {},
  skills: {},
  experienceEntries: {},
  experienceBullets: {},
  educationEntries: {},
  certifications: {},
  references: {},
  jobs: {},
  jobPostingSources: {},
  jobContacts: {},
  applicationQuestions: {},
  jobEvents: {},
})

export const createDefaultUiState = (): AppUiState => ({
  selectedJobId: null,
  selectedProfileId: null,
  jobsList: {
    searchText: '',
    statusFilter: null,
    sortBy: 'updated_at',
    sortDirection: 'desc',
  },
  profilesList: {
    searchText: '',
    kindFilter: null,
    sortBy: 'updated_at',
    sortDirection: 'desc',
  },
  dialogs: {
    importExportOpen: false,
    duplicateProfileOpen: false,
    createJobProfileOpen: false,
  },
})

export const emptyProfileDefaults = {
  summary: '',
  coverLetter: '',
  resumeSettings: createDefaultResumeSettings(),
  personalDetails: createEmptyPersonalDetails(),
  links: createEmptyProfileLinks(),
}

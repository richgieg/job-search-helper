import { readStoredThemePreference } from '../app/theme'
import type { AppDataState, AppUiState, PersonalDetails, ResumeSettings, ThemePreference } from '../types/state'

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
  profileLinks: {},
  skillCategories: {},
  skills: {},
  experienceEntries: {},
  experienceBullets: {},
  educationEntries: {},
  certifications: {},
  references: {},
  jobs: {},
  jobLinks: {},
  jobContacts: {},
  interviews: {},
  interviewContacts: {},
  applicationQuestions: {},
})

export const createDefaultUiState = (themePreference: ThemePreference = readStoredThemePreference()): AppUiState => ({
  selectedJobId: null,
  selectedProfileId: null,
  themePreference,
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
}

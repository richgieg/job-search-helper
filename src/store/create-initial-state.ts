import { readStoredThemePreference } from '../app/theme'
import type { AppDataState, AppUiState, PersonalDetails, ResumeSettings, ThemePreference } from '../types/state'
import { defaultResumeSectionLabels } from '../utils/resume-section-labels'

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
    summary: { enabled: true, sortOrder: 1, label: defaultResumeSectionLabels.summary },
    skills: { enabled: true, sortOrder: 2, label: defaultResumeSectionLabels.skills },
    achievements: { enabled: true, sortOrder: 3, label: defaultResumeSectionLabels.achievements },
    experience: { enabled: true, sortOrder: 4, label: defaultResumeSectionLabels.experience },
    education: { enabled: true, sortOrder: 5, label: defaultResumeSectionLabels.education },
    projects: { enabled: true, sortOrder: 6, label: defaultResumeSectionLabels.projects },
    certifications: { enabled: true, sortOrder: 7, label: defaultResumeSectionLabels.certifications },
    references: { enabled: true, sortOrder: 8, label: defaultResumeSectionLabels.references },
  },
})

export const createEmptyDataState = (): AppDataState => ({
  version: 1,
  profiles: {},
  profileLinks: {},
  skillCategories: {},
  skills: {},
  achievements: {},
  experienceEntries: {},
  experienceBullets: {},
  educationEntries: {},
  educationBullets: {},
  projects: {},
  projectBullets: {},
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

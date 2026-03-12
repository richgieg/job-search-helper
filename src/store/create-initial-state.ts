import { readStoredThemePreference } from '../app/theme'
import type { AppDataState, AppUiState, PersonalDetails, ResumeSettings, ThemePreference } from '../types/state'
import { defaultDocumentHeaderTemplate } from '../utils/document-header-templates'
import { defaultResumeSectionLabels, defaultResumeSectionOrder } from '../utils/resume-section-labels'

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
  headerTemplate: defaultDocumentHeaderTemplate,
  sections: defaultResumeSectionOrder.reduce<ResumeSettings['sections']>((sections, section, index) => {
    sections[section] = {
      enabled: true,
      sortOrder: index + 1,
      label: defaultResumeSectionLabels[section],
    }

    return sections
  }, {} as ResumeSettings['sections']),
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
  additionalExperienceEntries: {},
  additionalExperienceBullets: {},
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

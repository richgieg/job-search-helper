import type { AppDataState, AppUiState, PersonalDetails, ProfileLinks } from '../types/state'

const createEmptyPersonalDetails = (): PersonalDetails => ({
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  addressLine4: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
})

const createEmptyProfileLinks = (): ProfileLinks => ({
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  websiteUrl: '',
})

export const createEmptyDataState = (): AppDataState => ({
  version: 1,
  profiles: {},
  skillCategories: {},
  skills: {},
  experienceEntries: {},
  educationEntries: {},
  certifications: {},
  references: {},
  jobs: {},
  jobPostingSources: {},
  jobContacts: {},
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
  personalDetails: createEmptyPersonalDetails(),
  links: createEmptyProfileLinks(),
}

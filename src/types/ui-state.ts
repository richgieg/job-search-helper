import type { Id, JobStatusFilter } from './state'

export type ThemePreference = 'light' | 'dark' | 'system'

interface JobsListUiState {
  searchText: string
  statusFilter: JobStatusFilter | null
  sortBy: 'updated_at' | 'created_at' | 'company_name' | 'job_title'
  sortDirection: 'asc' | 'desc'
}

interface ProfilesListUiState {
  searchText: string
  kindFilter: 'base' | 'job' | null
  sortBy: 'updated_at' | 'created_at' | 'name'
  sortDirection: 'asc' | 'desc'
}

interface DialogUiState {
  importExportOpen: boolean
  duplicateProfileOpen: boolean
  createJobProfileOpen: boolean
}

interface ProfilePagePanelsUiState {
  [profileId: Id]: Record<string, boolean>
}

interface JobPagePanelsUiState {
  [jobId: Id]: Record<string, boolean>
}

export interface AppUiState {
  selectedJobId: Id | null
  selectedProfileId: Id | null
  themePreference: ThemePreference
  jobsList: JobsListUiState
  profilesList: ProfilesListUiState
  dialogs: DialogUiState
  jobPagePanels: JobPagePanelsUiState
  profilePagePanels: ProfilePagePanelsUiState
}
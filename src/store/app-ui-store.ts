import { create } from 'zustand'

import { readStoredThemePreference } from '../app/theme'
import type { AppUiState, Id, ThemePreference } from '../types/state'

interface AppUiStoreState {
  ui: AppUiState
  actions: {
    resetUiState: () => void
    setThemePreference: (themePreference: ThemePreference) => void
    selectJob: (jobId: Id | null) => void
    selectProfile: (profileId: Id | null) => void
  }
}

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

export const useAppUiStore = create<AppUiStoreState>((set) => ({
  ui: createDefaultUiState(),
  actions: {
    resetUiState: () => set((state) => ({ ...state, ui: createDefaultUiState(state.ui.themePreference) })),
    setThemePreference: (themePreference) => set((state) => ({ ...state, ui: { ...state.ui, themePreference } })),
    selectJob: (jobId) => set((state) => ({ ...state, ui: { ...state.ui, selectedJobId: jobId } })),
    selectProfile: (profileId) => set((state) => ({ ...state, ui: { ...state.ui, selectedProfileId: profileId } })),
  },
}))

export const useThemePreference = () => useAppUiStore((state) => state.ui.themePreference)

export const useSetThemePreference = () => useAppUiStore((state) => state.actions.setThemePreference)

export const useSelectedJobId = () => useAppUiStore((state) => state.ui.selectedJobId)

export const useSelectedProfileId = () => useAppUiStore((state) => state.ui.selectedProfileId)

export const useResetUiState = () => useAppUiStore((state) => state.actions.resetUiState)

export const useSelectJob = () => useAppUiStore((state) => state.actions.selectJob)

export const useSelectProfile = () => useAppUiStore((state) => state.actions.selectProfile)
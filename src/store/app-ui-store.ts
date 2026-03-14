import { useLayoutEffect } from 'react'

import { create } from 'zustand'

import { readStoredThemePreference } from '../app/theme'
import type { Id } from '../types/state'
import type { AppUiState, ThemePreference } from '../types/ui-state'

interface AppUiStoreState {
  ui: AppUiState
  actions: {
    setJobPagePanelExpanded: (jobId: Id, panelKey: string, expanded: boolean) => void
    resetUiState: () => void
    setProfilePagePanelExpanded: (profileId: Id, panelKey: string, expanded: boolean) => void
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
  jobPagePanels: {},
  profilePagePanels: {},
})

export const useAppUiStore = create<AppUiStoreState>((set) => ({
  ui: createDefaultUiState(),
  actions: {
    resetUiState: () => set((state) => ({ ...state, ui: createDefaultUiState(state.ui.themePreference) })),
    setJobPagePanelExpanded: (jobId, panelKey, expanded) => set((state) => ({
      ...state,
      ui: {
        ...state.ui,
        jobPagePanels: {
          ...state.ui.jobPagePanels,
          [jobId]: {
            ...(state.ui.jobPagePanels[jobId] ?? {}),
            [panelKey]: expanded,
          },
        },
      },
    })),
    setProfilePagePanelExpanded: (profileId, panelKey, expanded) => set((state) => ({
      ...state,
      ui: {
        ...state.ui,
        profilePagePanels: {
          ...state.ui.profilePagePanels,
          [profileId]: {
            ...(state.ui.profilePagePanels[profileId] ?? {}),
            [panelKey]: expanded,
          },
        },
      },
    })),
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

export const useProfilePagePanelState = (profileId: Id, panelKey: string, defaultExpanded = false) => {
  const expanded = useAppUiStore((state) => state.ui.profilePagePanels[profileId]?.[panelKey])
  const setProfilePagePanelExpanded = useAppUiStore((state) => state.actions.setProfilePagePanelExpanded)

  useLayoutEffect(() => {
    if (expanded === undefined && defaultExpanded) {
      setProfilePagePanelExpanded(profileId, panelKey, true)
    }
  }, [defaultExpanded, expanded, panelKey, profileId, setProfilePagePanelExpanded])

  return {
    expanded: expanded ?? defaultExpanded,
    onExpandedChange: (nextExpanded: boolean) => {
      setProfilePagePanelExpanded(profileId, panelKey, nextExpanded)
    },
  }
}

export const useJobPagePanelState = (jobId: Id, panelKey: string, defaultExpanded = false) => {
  const expanded = useAppUiStore((state) => state.ui.jobPagePanels[jobId]?.[panelKey])
  const setJobPagePanelExpanded = useAppUiStore((state) => state.actions.setJobPagePanelExpanded)

  useLayoutEffect(() => {
    if (expanded === undefined && defaultExpanded) {
      setJobPagePanelExpanded(jobId, panelKey, true)
    }
  }, [defaultExpanded, expanded, jobId, panelKey, setJobPagePanelExpanded])

  return {
    expanded: expanded ?? defaultExpanded,
    onExpandedChange: (nextExpanded: boolean) => {
      setJobPagePanelExpanded(jobId, panelKey, nextExpanded)
    },
  }
}
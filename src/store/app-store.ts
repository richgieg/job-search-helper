import { create } from 'zustand'

import { createDefaultUiState } from './create-initial-state'
import type { AppUiState, Id, ThemePreference } from '../types/state'

interface AppStoreState {
  ui: AppUiState
  actions: {
    resetUiState: () => void
    setThemePreference: (themePreference: ThemePreference) => void
    selectJob: (jobId: Id | null) => void
    selectProfile: (profileId: Id | null) => void
  }
}

export const useAppStore = create<AppStoreState>((set) => ({
    ui: createDefaultUiState(),
    actions: {
      resetUiState: () => set((state) => ({ ...state, ui: createDefaultUiState(state.ui.themePreference) })),
      setThemePreference: (themePreference) => set((state) => ({ ...state, ui: { ...state.ui, themePreference } })),
      selectJob: (jobId) => set((state) => ({ ...state, ui: { ...state.ui, selectedJobId: jobId } })),
      selectProfile: (profileId) =>
        set((state) => ({ ...state, ui: { ...state.ui, selectedProfileId: profileId } })),
    },
}))

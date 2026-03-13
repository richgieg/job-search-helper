import { useAppStore } from './app-store'
import type { Id, ThemePreference } from '../types/state'

export const useThemePreference = () => useAppStore((state) => state.ui.themePreference)

export const useSetThemePreference = () => useAppStore((state) => state.actions.setThemePreference)

export const useSelectedJobId = () => useAppStore((state) => state.ui.selectedJobId)

export const useSelectedProfileId = () => useAppStore((state) => state.ui.selectedProfileId)

export const useResetUiState = () => useAppStore((state) => state.actions.resetUiState)

export const useSelectJob = () => useAppStore((state) => state.actions.selectJob)

export const useSelectProfile = () => useAppStore((state) => state.actions.selectProfile)

export type AppUiStoreActions = {
  resetUiState: () => void
  setThemePreference: (themePreference: ThemePreference) => void
  selectJob: (jobId: Id | null) => void
  selectProfile: (profileId: Id | null) => void
}
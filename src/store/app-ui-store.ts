import { useAppUiZustandStore } from './app-ui-zustand-store'
import type { Id, ThemePreference } from '../types/state'

export const useThemePreference = () => useAppUiZustandStore((state) => state.ui.themePreference)

export const useSetThemePreference = () => useAppUiZustandStore((state) => state.actions.setThemePreference)

export const useSelectedJobId = () => useAppUiZustandStore((state) => state.ui.selectedJobId)

export const useSelectedProfileId = () => useAppUiZustandStore((state) => state.ui.selectedProfileId)

export const useResetUiState = () => useAppUiZustandStore((state) => state.actions.resetUiState)

export const useSelectJob = () => useAppUiZustandStore((state) => state.actions.selectJob)

export const useSelectProfile = () => useAppUiZustandStore((state) => state.actions.selectProfile)

export type AppUiStoreActions = {
  resetUiState: () => void
  setThemePreference: (themePreference: ThemePreference) => void
  selectJob: (jobId: Id | null) => void
  selectProfile: (profileId: Id | null) => void
}
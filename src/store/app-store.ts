import { create } from 'zustand'

import { getAppApiClient } from '../api'
import { queryKeys } from '../queries/query-keys'
import { queryClient } from '../queries/query-client'
import { createDefaultUiState, createEmptyDataState } from './create-initial-state'
import type {
  AppDataState,
  AppExportFile,
  AppUiState,
  Id,
  ThemePreference,
} from '../types/state'

type AppStoreSavingStatus = 'idle' | 'saving' | 'error'

interface AppStoreStatus {
  saving: AppStoreSavingStatus
  errorMessage: string | null
}

interface AppStoreState {
  data: AppDataState
  ui: AppUiState
  status: AppStoreStatus
  actions: {
    importAppData: (file: AppExportFile) => Promise<void>
    exportAppData: () => Promise<AppExportFile>
    resetUiState: () => void
    setThemePreference: (themePreference: ThemePreference) => void
    selectJob: (jobId: Id | null) => void
    selectProfile: (profileId: Id | null) => void
  }
}

const createInitialStoreStatus = (): AppStoreStatus => ({
  saving: 'idle',
  errorMessage: null,
})

export const useAppStore = create<AppStoreState>((set, get) => {
  return {
    data: createEmptyDataState(),
    ui: createDefaultUiState(),
    status: createInitialStoreStatus(),
    actions: {
    importAppData: async (file) => {
      const currentThemePreference = get().ui.themePreference

      set((state) => ({
        ...state,
        status: {
          ...state.status,
          saving: 'saving',
          errorMessage: null,
        },
      }))

      try {
        const data = await getAppApiClient().importAppData(file)

        set((state) => ({
          ...state,
          data,
          ui: createDefaultUiState(currentThemePreference),
          status: {
            ...state.status,
            saving: 'idle',
            errorMessage: null,
          },
        }))

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.jobsList() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.jobsDetailRoot() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.profilesListRoot() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.profilesDetailRoot() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.profilesDocumentRoot() }),
        ])
      } catch (caughtError) {
        const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown import error.'

        set((state) => ({
          ...state,
          status: {
            ...state.status,
            saving: 'error',
            errorMessage,
          },
        }))

        throw caughtError
      }
    },
    exportAppData: async () => {
      set((state) => ({
        ...state,
        status: {
          ...state.status,
          saving: 'saving',
          errorMessage: null,
        },
      }))

      try {
        const file = await getAppApiClient().exportAppData()

        set((state) => ({
          ...state,
          status: {
            ...state.status,
            saving: 'idle',
            errorMessage: null,
          },
        }))

        return file
      } catch (caughtError) {
        const errorMessage = caughtError instanceof Error ? caughtError.message : 'Unknown export error.'

        set((state) => ({
          ...state,
          status: {
            ...state.status,
            saving: 'error',
            errorMessage,
          },
        }))

        throw caughtError
      }
    },
    resetUiState: () => set((state) => ({ ...state, ui: createDefaultUiState(state.ui.themePreference) })),
    setThemePreference: (themePreference) => set((state) => ({ ...state, ui: { ...state.ui, themePreference } })),
    selectJob: (jobId) => set((state) => ({ ...state, ui: { ...state.ui, selectedJobId: jobId } })),
    selectProfile: (profileId) =>
      set((state) => ({ ...state, ui: { ...state.ui, selectedProfileId: profileId } })),
    },
  }
})

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppApiClient, resetAppApiClient, setAppApiClient } from '../../api'
import { createEmptyAppDataState } from '../../domain/app-data-state'
import { queryKeys } from '../../queries/query-keys'
import { queryClient } from '../../queries/query-client'
import { createDefaultUiState, useAppUiStore } from '../../store/app-ui-store'
import type { AppExportFile } from '../../types/state'
import { useAppDataTransfer } from './use-app-data-transfer'

const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>

const resetUiStore = () => {
  resetAppApiClient()
  queryClient.clear()
  useAppUiStore.setState((state) => ({
    ...state,
    ui: createDefaultUiState('system'),
  }))
}

describe('useAppDataTransfer', () => {
  beforeEach(() => {
    resetUiStore()
    setAppApiClient(createAppApiClient({ initialData: createEmptyAppDataState() }))
  })

  it('imports and exports through the app api client while resetting ui state and preserving theme preference', async () => {
    const imported: AppExportFile = {
      version: 1 as const,
      exportedAt: '2026-03-12T09:00:00.000Z',
      data: {
        ...createEmptyAppDataState(),
        jobs: {
          job_1: {
            id: 'job_1',
            companyName: 'Example Co',
            jobTitle: 'Engineer',
            description: '',
            location: '',
            postedCompensation: '',
            desiredCompensation: '',
            compensationNotes: '',
            workArrangement: 'unknown',
            employmentType: 'other',
            datePosted: null,
            notes: '',
            createdAt: '2026-03-12T09:00:00.000Z',
            updatedAt: '2026-03-12T09:00:00.000Z',
            appliedAt: null,
            finalOutcome: null,
          },
        },
      },
    }

    queryClient.setQueryData(queryKeys.dashboardSummary(), { profileCount: 0, jobCount: 0 })

    useAppUiStore.getState().actions.setThemePreference('dark')
    useAppUiStore.getState().actions.selectJob('job-123')
    useAppUiStore.getState().actions.selectProfile('profile-123')

    const { result } = renderHook(() => useAppDataTransfer(), { wrapper })

    await result.current.importAppData(imported)
    const exported = await result.current.exportAppData()

    expect(result.current.isSaving).toBe(false)
    expect(useAppUiStore.getState().ui.themePreference).toBe('dark')
    expect(useAppUiStore.getState().ui.selectedJobId).toBeNull()
    expect(useAppUiStore.getState().ui.selectedProfileId).toBeNull()
    expect(exported.data.jobs.job_1?.companyName).toBe('Example Co')
    expect(exported.data.jobs.job_1?.jobTitle).toBe('Engineer')
  })
})
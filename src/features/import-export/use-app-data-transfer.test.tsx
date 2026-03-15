// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppApiClient, getAppApiClient, resetAppApiClient, setAppApiClient } from '../../api'
import { createEmptyAppDataState } from '../../domain/app-data-state'
import { queryKeys } from '../../queries/query-keys'
import { queryClient } from '../../queries/query-client'
import { createDefaultUiState, useAppUiStore } from '../../store/app-ui-store'
import type { AppExportFile } from '../../types/state'
import { useAppDataTransfer } from './use-app-data-transfer'

const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>

const toExportPayload = (data: ReturnType<typeof createEmptyAppDataState>) => {
  const { version: _version, exportedAt: _exportedAt, ...payload } = data
  return payload
}

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
        ...toExportPayload(createEmptyAppDataState()),
        jobs: {
          job_1: {
            id: 'job_1',
            companyName: 'Example Co',
            staffingAgencyName: '',
            jobTitle: 'Engineer',
            description: '',
            location: '',
            postedCompensation: '',
            desiredCompensation: '',
            compensationNotes: '',
            workArrangement: 'unknown',
            employmentType: 'unknown',
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

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false)
    })
    expect(useAppUiStore.getState().ui.themePreference).toBe('dark')
    expect(useAppUiStore.getState().ui.selectedJobId).toBeNull()
    expect(useAppUiStore.getState().ui.selectedProfileId).toBeNull()
    expect(exported.data.jobs.job_1?.companyName).toBe('Example Co')
    expect(exported.data.jobs.job_1?.jobTitle).toBe('Engineer')
  })

  it('clears inactive cached queries after import so later navigation does not render stale data first', async () => {
    const imported: AppExportFile = {
      version: 1 as const,
      exportedAt: '2026-03-12T09:00:00.000Z',
      data: toExportPayload(createEmptyAppDataState()),
    }

    queryClient.setQueryData(queryKeys.dashboardSummary(), { profileCount: 99, jobCount: 99 })
    queryClient.setQueryData(queryKeys.jobsList(), { items: [{ id: 'stale-job' }], updatedAt: 'stale' })
    queryClient.setQueryData(queryKeys.jobsDetail('job_stale'), { job: { id: 'job_stale' } })
    queryClient.setQueryData(queryKeys.profilesList('base'), { items: [{ id: 'stale-profile' }], updatedAt: 'stale' })
    queryClient.setQueryData(queryKeys.profilesDetail('profile_stale'), { profile: { id: 'profile_stale' } })
    queryClient.setQueryData(queryKeys.profilesDocument('profile_stale'), { profile: { id: 'profile_stale' } })

    const { result } = renderHook(() => useAppDataTransfer(), { wrapper })

    await result.current.importAppData(imported)

    expect(queryClient.getQueryData(queryKeys.dashboardSummary())).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.jobsList())).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.jobsDetail('job_stale'))).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.profilesList('base'))).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.profilesDetail('profile_stale'))).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.profilesDocument('profile_stale'))).toBeUndefined()
  })

  it('resets local data, swaps in a fresh client, and leaves the app ready for new writes', async () => {
    const imported: AppExportFile = {
      version: 1 as const,
      exportedAt: '2026-03-12T09:00:00.000Z',
      data: {
        ...toExportPayload(createEmptyAppDataState()),
        jobs: {
          job_1: {
            id: 'job_1',
            companyName: 'Example Co',
            staffingAgencyName: '',
            jobTitle: 'Engineer',
            description: '',
            location: '',
            postedCompensation: '',
            desiredCompensation: '',
            compensationNotes: '',
            workArrangement: 'unknown',
            employmentType: 'unknown',
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

    const { result } = renderHook(() => useAppDataTransfer(), { wrapper })

    await result.current.importAppData(imported)
    await result.current.resetLocalData()

    const appData = await result.current.exportAppData()
    const profileMutation = await getAppApiClient().createBaseProfile('Fresh Profile')
    const dashboard = await getAppApiClient().getDashboardSummary()
    const createdProfile = profileMutation.createdId ? profileMutation.data.profiles[profileMutation.createdId] : null

    expect(Object.keys(appData.data.jobs)).toHaveLength(0)
    expect(Object.keys(appData.data.profiles)).toHaveLength(0)
    expect(createdProfile?.name).toBe('Fresh Profile')
    expect(dashboard).toMatchObject({ profileCount: 1, jobCount: 0 })
  })

  it('surfaces backend validation errors for schema-invalid imports', async () => {
    const { result } = renderHook(() => useAppDataTransfer(), { wrapper })

    await expect(
      result.current.importAppData({
        version: 1,
        exportedAt: '2026-03-12T09:00:00.000Z',
        data: {
          ...toExportPayload(createEmptyAppDataState()),
          unexpected: true,
        },
      } as AppExportFile),
    ).rejects.toThrow('Import file does not match the expected format.')
  })
})
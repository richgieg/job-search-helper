import { beforeEach, describe, expect, it } from 'vitest'

import { resetAppApiClient } from '../api'
import type { AppExportFile } from '../types/state'
import { createDefaultUiState, createEmptyDataState } from './create-initial-state'
import { useAppStore } from './app-store'

const resetStore = () => {
  resetAppApiClient()
  useAppStore.setState((state) => ({
    ...state,
    data: createEmptyDataState(),
    ui: createDefaultUiState('system'),
    status: {
      saving: 'idle',
      errorMessage: null,
    },
  }))
}

describe('app store persistence boundary', () => {
  beforeEach(() => {
    resetStore()
  })

  it('imports and exports through the app api client asynchronously', async () => {
    const imported: AppExportFile = {
      version: 1 as const,
      exportedAt: '2026-03-12T09:00:00.000Z',
      data: {
        ...createEmptyDataState(),
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

    await useAppStore.getState().actions.importAppData(imported)

    const exported = await useAppStore.getState().actions.exportAppData()

    expect(useAppStore.getState().status.saving).toBe('idle')
    expect(useAppStore.getState().data.jobs.job_1?.companyName).toBe('Example Co')
    expect(exported.data.jobs.job_1?.jobTitle).toBe('Engineer')
  })
})

describe('app store theme preference', () => {
  beforeEach(() => {
    resetStore()
  })

  it('updates the theme preference and preserves it when resetting ui state', async () => {
    const { actions } = useAppStore.getState()

    actions.setThemePreference('dark')
    actions.selectJob('job-123')
    actions.selectProfile('profile-123')

    expect(useAppStore.getState().ui.themePreference).toBe('dark')

    actions.resetUiState()

    expect(useAppStore.getState().ui.themePreference).toBe('dark')
    expect(useAppStore.getState().ui.selectedJobId).toBeNull()
    expect(useAppStore.getState().ui.selectedProfileId).toBeNull()
  })
})

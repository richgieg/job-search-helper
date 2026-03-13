import { beforeEach, describe, expect, it } from 'vitest'

import { resetAppApiClient } from '../api'
import { createDefaultUiState } from './create-initial-state'
import { useAppStore } from './app-store'

const resetStore = () => {
  resetAppApiClient()
  useAppStore.setState((state) => ({
    ...state,
    ui: createDefaultUiState('system'),
  }))
}

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

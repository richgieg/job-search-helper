import { beforeEach, describe, expect, it } from 'vitest'

import { resetAppApiClient } from '../api'
import { createDefaultUiState, useAppUiStore } from './app-ui-store'

const resetStore = () => {
  resetAppApiClient()
  useAppUiStore.setState((state) => ({
    ...state,
    ui: createDefaultUiState('system'),
  }))
}

describe('app ui store', () => {
  beforeEach(() => {
    resetStore()
  })

  it('updates the theme preference and preserves it when resetting ui state', async () => {
    const { actions } = useAppUiStore.getState()

    actions.setThemePreference('dark')
    actions.selectJob('job-123')
    actions.selectProfile('profile-123')

    expect(useAppUiStore.getState().ui.themePreference).toBe('dark')

    actions.resetUiState()

    expect(useAppUiStore.getState().ui.themePreference).toBe('dark')
    expect(useAppUiStore.getState().ui.selectedJobId).toBeNull()
    expect(useAppUiStore.getState().ui.selectedProfileId).toBeNull()
  })
})
import { beforeEach, describe, expect, it } from 'vitest'

import { resetAppApiClient } from '../api'
import { createDefaultUiState } from './create-initial-state'
import { useAppUiZustandStore } from './app-ui-zustand-store'

const resetStore = () => {
  resetAppApiClient()
  useAppUiZustandStore.setState((state) => ({
    ...state,
    ui: createDefaultUiState('system'),
  }))
}

describe('app ui zustand store', () => {
  beforeEach(() => {
    resetStore()
  })

  it('updates the theme preference and preserves it when resetting ui state', async () => {
    const { actions } = useAppUiZustandStore.getState()

    actions.setThemePreference('dark')
    actions.selectJob('job-123')
    actions.selectProfile('profile-123')

    expect(useAppUiZustandStore.getState().ui.themePreference).toBe('dark')

    actions.resetUiState()

    expect(useAppUiZustandStore.getState().ui.themePreference).toBe('dark')
    expect(useAppUiZustandStore.getState().ui.selectedJobId).toBeNull()
    expect(useAppUiZustandStore.getState().ui.selectedProfileId).toBeNull()
  })
})
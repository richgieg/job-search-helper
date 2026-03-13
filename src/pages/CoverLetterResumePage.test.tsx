// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { CoverLetterResumePage } from './CoverLetterResumePage'
import { queryClient } from '../queries/query-client'
import { queryKeys } from '../queries/query-keys'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('CoverLetterResumePage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the combined document and updates the document title', async () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <CoverLetterResumePage />,
      path: '/profiles/:profileId/combined',
      route: '/profiles/profile_1/combined',
    })

    expect(await screen.findByText('Dear Hiring Manager,')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Ada_Example_Cover_Letter_and_Resume')
    })
  })

  it('shows cached combined document data when the document refresh fails', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    queryClient.setQueryData(queryKeys.profilesDocument('profile_1'), await apiClient.getProfileDocument('profile_1'))
    setAppApiClient({
      ...apiClient,
      getProfileDocument: vi.fn(async () => {
        throw new Error('combined refresh failed')
      }),
    })

    renderRoute({
      element: <CoverLetterResumePage />,
      path: '/profiles/:profileId/combined',
      route: '/profiles/profile_1/combined',
    })

    expect(await screen.findByText('Dear Hiring Manager,')).toBeInTheDocument()
    expect(await screen.findByText('Unable to refresh this document right now. Showing the most recently cached result if available.')).toBeInTheDocument()
  })
})
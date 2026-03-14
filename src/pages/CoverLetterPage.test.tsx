// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { CoverLetterPage } from './CoverLetterPage'
import { queryClient } from '../queries/query-client'
import { queryKeys } from '../queries/query-keys'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('CoverLetterPage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the cover letter document and updates the document title', async () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Hiring Manager,')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Ada_Example_Cover_Letter')
    })
  })

  it('shows cached cover letter data when the document refresh fails', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    queryClient.setQueryData(queryKeys.profilesDocument('profile_1'), await apiClient.getProfileDocument('profile_1'))
    setAppApiClient({
      ...apiClient,
      getProfileDocument: vi.fn(async () => {
        throw new Error('cover letter refresh failed')
      }),
    })

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Hiring Manager,')).toBeInTheDocument()
    expect(await screen.findByText('Unable to refresh this document right now. Showing the most recently cached result if available.')).toBeInTheDocument()
  })

  it('uses the selected cover letter recipient when the profile specifies one', async () => {
    const initialData = createSeedData()
    initialData.profiles.profile_1!.coverLetterContactId = 'job_contact_2'

    setupRouteTestEnvironment({ initialData })

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Taylor Recruiter,')).toBeInTheDocument()
  })
})
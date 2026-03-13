// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { queryKeys } from '../queries/query-keys'
import { queryClient } from '../queries/query-client'
import { ResumePage } from './ResumePage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('ResumePage', () => {
  beforeEach(() => {
    setupRouteTestEnvironment()
  })

  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the resume route from the profile document query and updates the document title', async () => {
    renderRoute({
      element: <ResumePage />,
      path: '/profiles/:profileId/resume',
      route: '/profiles/profile_1/resume',
    })

    expect(await screen.findByText('Ada Example')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Ada_Example_Resume')
    })

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('shows cached resume data when document refresh fails', async () => {
    const seededData = createSeedData()
    const apiClient = createAppApiClient({ initialData: seededData })

    queryClient.setQueryData(queryKeys.profilesDocument('profile_1'), await apiClient.getProfileDocument('profile_1'))

    setAppApiClient({
      ...apiClient,
      getProfileDocument: vi.fn(async () => {
        throw new Error('refresh failed')
      }),
    })

    renderRoute({
      element: <ResumePage />,
      path: '/profiles/:profileId/resume',
      route: '/profiles/profile_1/resume',
    })

    expect(await screen.findByText('Ada Example')).toBeInTheDocument()
    expect(await screen.findByText(/Unable to refresh this document right now/i)).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })
})
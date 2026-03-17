// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { APP_NAME } from '../app/page-titles'
import { ApplicationPage } from './ApplicationPage'
import { queryClient } from '../queries/query-client'
import { queryKeys } from '../queries/query-keys'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('ApplicationPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetRouteTestState()
  })

  it('renders application data with transformed values from the document query', async () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <ApplicationPage />,
      path: '/profiles/:profileId/application',
      route: '/profiles/profile_1/application',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()
    expect(document.title).toBe(`Application | Tailored Profile | Senior Engineer at Example Co | ${APP_NAME}`)
    expect(screen.getByText('Job profile for Senior Engineer at Example Co')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '01/01/2024' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20240101' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '- Built feature flags' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ada@example.com' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'References' })).toBeInTheDocument()
  })

  it('copies selected application values to the clipboard', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async (_value: string) => {})

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    setupRouteTestEnvironment()

    renderRoute({
      element: <ApplicationPage />,
      path: '/profiles/:profileId/application',
      route: '/profiles/profile_1/application',
    })

    await user.click(await screen.findByRole('button', { name: 'ada@example.com' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('ada@example.com')
    })
    expect(await screen.findByText('Copied!')).toBeInTheDocument()
  })

  it('renders the unavailable state when the requested profile does not exist', async () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <ApplicationPage />,
      path: '/profiles/:profileId/application',
      route: '/profiles/missing-profile/application',
    })

    expect(await screen.findByText('Application unavailable')).toBeInTheDocument()
    expect(screen.getByText('The selected profile could not be found.')).toBeInTheDocument()
  })

  it('uses the profile-only title fallback for base profiles', async () => {
    const initialData = createSeedData()
    const sourceProfile = initialData.profiles.profile_1!

    initialData.profiles.profile_base = {
      ...sourceProfile,
      id: 'profile_base',
      name: 'Base Profile',
      jobId: null,
      coverLetterContactId: null,
      clonedFromProfileId: null,
    }

    setupRouteTestEnvironment({ initialData })

    renderRoute({
      element: <ApplicationPage />,
      path: '/profiles/:profileId/application',
      route: '/profiles/profile_base/application',
    })

    expect(await screen.findByText('Base Profile')).toBeInTheDocument()
    expect(document.title).toBe(`Application | Base Profile | ${APP_NAME}`)
  })

  it('shows cached application data when the document refresh fails', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    queryClient.setQueryData(queryKeys.profilesDocument('profile_1'), await apiClient.getProfileDocument('profile_1'))
    setAppApiClient({
      ...apiClient,
      getProfileDocument: vi.fn(async () => {
        throw new Error('application refresh failed')
      }),
    })

    renderRoute({
      element: <ApplicationPage />,
      path: '/profiles/:profileId/application',
      route: '/profiles/profile_1/application',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()
    expect(await screen.findByText('Unable to refresh this application data right now. Showing the most recently cached result if available.')).toBeInTheDocument()
  })
})
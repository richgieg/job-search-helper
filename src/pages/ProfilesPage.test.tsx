// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { createEmptyAppDataState } from '../domain/app-data-state'
import { createDefaultResumeSettings } from '../domain/profile-defaults'
import { ProfilesPage } from './ProfilesPage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

const createBaseProfilesSeedData = () => {
  const data = createSeedData()

  data.profiles.profile_base_1 = {
    id: 'profile_base_1',
    name: 'Base Profile',
    summary: 'Reusable summary',
    coverLetter: '',
    resumeSettings: createDefaultResumeSettings(),
    personalDetails: {
      fullName: 'Base Candidate',
      email: 'base@example.com',
      phone: '555-0103',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      state: '',
      postalCode: '',
    },
    jobId: null,
    clonedFromProfileId: null,
    createdAt: '2026-03-02T10:00:00.000Z',
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  return data
}

describe('ProfilesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetRouteTestState()
  })

  it('renders base profiles from the profiles query', async () => {
    setupRouteTestEnvironment({ initialData: createBaseProfilesSeedData() })

    renderRoute({
      element: <ProfilesPage />,
      path: '/profiles',
      route: '/profiles',
    })

    expect(await screen.findByText('Base Profile')).toBeInTheDocument()
    expect(screen.queryByText('Tailored Profile')).not.toBeInTheDocument()
  })

  it('creates a base profile through the page mutation flow', async () => {
    const user = userEvent.setup()

    setupRouteTestEnvironment({ initialData: createEmptyAppDataState() })

    renderRoute({
      element: <ProfilesPage />,
      path: '/profiles',
      route: '/profiles',
    })

    expect(await screen.findByText('No profiles yet.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Profile name'), 'Platform Resume')
    await user.click(screen.getByRole('button', { name: 'Add profile' }))

    expect(await screen.findByText('Platform Resume')).toBeInTheDocument()
  })

  it('duplicates a base profile through the page actions', async () => {
    const user = userEvent.setup()

    setupRouteTestEnvironment({ initialData: createBaseProfilesSeedData() })

    renderRoute({
      element: <ProfilesPage />,
      path: '/profiles',
      route: '/profiles',
    })

    expect(await screen.findByText('Base Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Duplicate profile Base Profile' }))

    expect(await screen.findByText('Base Profile Copy')).toBeInTheDocument()
  })

  it('deletes a base profile after confirmation', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    setupRouteTestEnvironment({ initialData: createBaseProfilesSeedData() })

    renderRoute({
      element: <ProfilesPage />,
      path: '/profiles',
      route: '/profiles',
    })

    expect(await screen.findByText('Base Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete profile Base Profile' }))

    await waitFor(() => {
      expect(screen.queryByText('Base Profile')).not.toBeInTheDocument()
    })
    expect(await screen.findByText('No profiles yet.')).toBeInTheDocument()
  })

  it('shows the empty state when no base profiles exist', async () => {
    setupRouteTestEnvironment({ initialData: createEmptyAppDataState() })

    renderRoute({
      element: <ProfilesPage />,
      path: '/profiles',
      route: '/profiles',
    })

    expect(await screen.findByText('No profiles yet.')).toBeInTheDocument()
  })

  it('shows an error banner when the profiles query fails without cached data', async () => {
    const apiClient = createAppApiClient({ initialData: createBaseProfilesSeedData() })

    setupRouteTestEnvironment({ initialData: createBaseProfilesSeedData() })
    setAppApiClient({
      ...apiClient,
      getProfilesList: vi.fn(async () => {
        throw new Error('profiles failed')
      }),
    })

    renderRoute({
      element: <ProfilesPage />,
      path: '/profiles',
      route: '/profiles',
    })

    expect(await screen.findByText('Unable to refresh profiles right now. Showing the most recently cached result if available.')).toBeInTheDocument()
  })
})
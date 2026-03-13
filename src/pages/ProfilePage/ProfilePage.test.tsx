// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../../api'
import { ProfilePage } from './ProfilePage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../../test/route-test-helpers'

describe('ProfilePage', () => {
  beforeEach(() => {
    setupRouteTestEnvironment()
  })

  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the profile detail route from query-backed detail data', async () => {
    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()
    expect(screen.getByText('Job profile for Senior Engineer at Example Co')).toBeInTheDocument()
  })

  it('updates the profile detail route through page-level mutations', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Profile details/i }))
    await user.clear(screen.getByLabelText('Profile name'))
    await user.type(screen.getByLabelText('Profile name'), 'Portfolio Profile')
    await user.tab()

    expect(await screen.findByText('Portfolio Profile')).toBeInTheDocument()
  })

  it('updates profile child editor links through mutation hooks', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Links/i }))
    await user.clear(screen.getByDisplayValue('https://example.com'))
    await user.type(screen.getByLabelText('URL'), 'https://portfolio.example.dev')
    await user.tab()

    expect(await screen.findByDisplayValue('https://portfolio.example.dev')).toBeInTheDocument()
  })

  it('renders the profile not-found state when the requested profile does not exist', async () => {
    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/missing-profile',
    })

    expect(await screen.findByText('Profile not found')).toBeInTheDocument()
    expect(screen.getByText('The selected profile could not be found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to profiles' })).toHaveAttribute('href', '/profiles')
  })

  it('renders the profile refresh-error state when the detail query fails without cached data', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setAppApiClient({
      ...apiClient,
      getProfileDetail: vi.fn(async () => {
        throw new Error('profile detail failed')
      }),
    })

    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Unable to load profile')).toBeInTheDocument()
    expect(screen.getByText('The profile details could not be refreshed right now.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to profiles' })).toHaveAttribute('href', '/profiles')
  })
})
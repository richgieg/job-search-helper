// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../../api'
import type { ProfileDetailDto } from '../../api/read-models'
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

  it('populates the profile form immediately once a delayed detail response resolves', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })
    const profileDetail = await apiClient.getProfileDetail('profile_1')
    let resolveProfileDetail: ((value: ProfileDetailDto | null) => void) | undefined

    setAppApiClient({
      ...apiClient,
      getProfileDetail: vi.fn(
        () =>
          new Promise<ProfileDetailDto | null>((resolve) => {
            resolveProfileDetail = resolve
          }),
      ),
    })

    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
    expect(screen.queryByText('Profile not found')).not.toBeInTheDocument()

    resolveProfileDetail?.(profileDetail)

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /Profile details/i }))
    expect(screen.getByLabelText('Profile name')).toHaveValue('Tailored Profile')
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

  it('auto-expands newly added skill categories', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Skills\b/i }))
    await user.click(screen.getByRole('button', { name: 'Add skill category' }))

    expect(await screen.findByLabelText('Category name')).toBeInTheDocument()
    expect(screen.getByText('No skills yet.')).toBeInTheDocument()

    await waitFor(async () => {
      await Promise.resolve()
      expect(screen.getByLabelText('Category name')).toBeInTheDocument()
    })
  })

  it('restores expanded panels after the profile route remounts', async () => {
    const user = userEvent.setup()

    const firstRender = renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()
    expect(screen.queryByLabelText('Category name')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Skills\b/i }))
    await user.click(screen.getByRole('button', { name: /^Languages\b/i }))

    expect(await screen.findByLabelText('Category name')).toBeInTheDocument()

    firstRender.unmount()

    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByLabelText('Category name')).toBeInTheDocument()
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
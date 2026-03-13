// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { ReferencesPage } from './ReferencesPage'
import { queryClient } from '../queries/query-client'
import { queryKeys } from '../queries/query-keys'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

const createReferencesSeedData = () => {
  const data = createSeedData()

  data.references.reference_1 = {
    id: 'reference_1',
    profileId: 'profile_1',
    type: 'professional',
    name: 'Grace Hopper',
    relationship: 'Former manager',
    company: 'Example Co',
    title: 'Director',
    email: 'grace@example.com',
    phone: '555-0102',
    notes: '',
    enabled: true,
    sortOrder: 1,
  }

  return data
}

describe('ReferencesPage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the references document and updates the document title', async () => {
    setupRouteTestEnvironment({ initialData: createReferencesSeedData() })

    renderRoute({
      element: <ReferencesPage />,
      path: '/profiles/:profileId/references',
      route: '/profiles/profile_1/references',
    })

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Ada_Example_References')
    })
  })

  it('shows cached references data when the document refresh fails', async () => {
    const seedData = createReferencesSeedData()
    const apiClient = createAppApiClient({ initialData: seedData })

    setupRouteTestEnvironment({ initialData: seedData })
    queryClient.setQueryData(queryKeys.profilesDocument('profile_1'), await apiClient.getProfileDocument('profile_1'))
    setAppApiClient({
      ...apiClient,
      getProfileDocument: vi.fn(async () => {
        throw new Error('references refresh failed')
      }),
    })

    renderRoute({
      element: <ReferencesPage />,
      path: '/profiles/:profileId/references',
      route: '/profiles/profile_1/references',
    })

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
    expect(await screen.findByText('Unable to refresh this document right now. Showing the most recently cached result if available.')).toBeInTheDocument()
  })
})
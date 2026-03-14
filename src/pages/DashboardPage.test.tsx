// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import type { DashboardSummaryDto } from '../api/read-models'
import { DashboardPage } from './DashboardPage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('DashboardPage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders dashboard metrics from the summary query', async () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <DashboardPage />,
      path: '/dashboard',
      route: '/dashboard',
    })

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Profiles').parentElement).toHaveTextContent('1')
      expect(screen.getByText('Jobs').parentElement).toHaveTextContent('1')
      expect(screen.getByText('Contacts').parentElement).toHaveTextContent('2')
      expect(screen.getByText('Interviews').parentElement).toHaveTextContent('1')
    })
  })

  it('shows a loading message while the summary query is pending', () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    setAppApiClient({
      ...apiClient,
      getDashboardSummary: vi.fn(() => new Promise<DashboardSummaryDto>(() => {})),
    })

    renderRoute({
      element: <DashboardPage />,
      path: '/dashboard',
      route: '/dashboard',
    })

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('shows an error banner when the summary query fails without cached data', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    setAppApiClient({
      ...apiClient,
      getDashboardSummary: vi.fn(async () => {
        throw new Error('dashboard failed')
      }),
    })

    renderRoute({
      element: <DashboardPage />,
      path: '/dashboard',
      route: '/dashboard',
    })

    expect(await screen.findByText('Unable to refresh dashboard metrics right now. Showing the most recently cached result if available.')).toBeInTheDocument()
  })
})
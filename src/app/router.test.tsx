// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AppRoutes } from './router'
import { queryClient } from '../queries/query-client'
import { createSeedData, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

const renderAppRoutes = (route: string) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  )

describe('AppRoutes', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the landing page at the index route', async () => {
    setupRouteTestEnvironment()

    renderAppRoutes('/')

    expect(await screen.findByRole('heading', { name: 'Everything for your search in one place.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Job Search Helper' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
  })

  it('renders the jobs route inside the app layout', async () => {
    setupRouteTestEnvironment()

    renderAppRoutes('/jobs')

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Import / Export' })).toBeInTheDocument()
  })

  it('renders document routes outside the app layout shell navigation', async () => {
    setupRouteTestEnvironment({ initialData: createSeedData() })

    renderAppRoutes('/profiles/profile_1/references')

    expect(await screen.findByText('References')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
  })
})
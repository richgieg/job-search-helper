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

    expect(await screen.findByRole('heading', { name: 'Take control of your job search.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Job Search Helper' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('renders the jobs route inside the app layout', async () => {
    setupRouteTestEnvironment()

    renderAppRoutes('/jobs')

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Import / Export' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('renders the about route inside the app layout and keeps about after import export in nav order', async () => {
    setupRouteTestEnvironment()

    renderAppRoutes('/about')

    expect(await screen.findByRole('heading', { name: 'Why this app exists' })).toBeInTheDocument()

    const navLinks = screen
      .getAllByRole('link')
      .map((link) => link.textContent)
      .filter((label): label is string => Boolean(label))

    expect(navLinks.indexOf('Import / Export')).toBeGreaterThan(-1)
    expect(navLinks.indexOf('About')).toBe(navLinks.indexOf('Import / Export') + 1)
  })

  it('renders document routes outside the app layout shell navigation', async () => {
    setupRouteTestEnvironment({ initialData: createSeedData() })

    renderAppRoutes('/profiles/profile_1/references')

    expect(await screen.findByText('References')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
  })
})
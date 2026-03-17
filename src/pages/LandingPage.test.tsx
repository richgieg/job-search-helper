// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getAppApiClient } from '../api'
import { AppRoutes } from '../app/router'
import { createEmptyAppDataState } from '../domain/app-data-state'
import { queryClient } from '../queries/query-client'
import type { AppDataState } from '../types/state'
import { LandingPage } from './LandingPage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

const replaceCurrentData = async (data: AppDataState) => {
  const { version: _version, exportedAt: _exportedAt, ...payload } = data

  await getAppApiClient().importAppData({
    version: 1,
    exportedAt: '2026-03-12T12:00:00.000Z',
    data: payload,
  })
}

const renderAppRoutes = (route: string) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  )

describe('LandingPage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the redesigned marketing sections with only the sample-data CTA', () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <LandingPage />,
      path: '/',
      route: '/',
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Take control of your job search.' })).toBeInTheDocument()
    expect(screen.getByText('Turn scattered tabs and saved links into one reliable system.')).toBeInTheDocument()
    expect(screen.getByText('See the top of funnel, applications, interviews, and offers without inventing busywork.')).toBeInTheDocument()
    expect(screen.getByText('Build tailored application materials without losing track of which version belongs to which role.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open the dashboard' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Try with Sample Data' })).toHaveLength(2)
    expect(screen.queryByRole('link', { name: 'Load fresh sample data' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Browse jobs' })).not.toBeInTheDocument()
  })

  it('loads sample data and navigates to the dashboard when the database is empty', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    setupRouteTestEnvironment({ initialData: createEmptyAppDataState() })
    await replaceCurrentData(createEmptyAppDataState())

    renderAppRoutes('/')

    const sampleDataButtons = await screen.findAllByRole('button', { name: 'Try with Sample Data' })
    expect(sampleDataButtons).toHaveLength(2)

    await user.click(sampleDataButtons[0]!)

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(await screen.findByText('See how your job search is progressing and what needs attention next.')).toBeInTheDocument()

    const importedExport = await getAppApiClient().exportAppData()

    expect(Object.keys(importedExport.data.profiles)).toHaveLength(3)
    expect(Object.keys(importedExport.data.jobs)).toHaveLength(17)
  })

  it('shows the replacement warning and stays on the landing page when loading sample data is cancelled', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    setupRouteTestEnvironment()
    await replaceCurrentData(createSeedData())

    renderAppRoutes('/')

    const sampleDataButtons = await screen.findAllByRole('button', { name: 'Try with Sample Data' })
    expect(sampleDataButtons).toHaveLength(2)

    await user.click(sampleDataButtons[0]!)

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'Replace current local data with sample data? This cannot be undone unless you have an exported backup.',
      )
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Take control of your job search.' })).toBeInTheDocument()
    expect(screen.queryByText('See how your job search is progressing and what needs attention next.')).not.toBeInTheDocument()
  })
})
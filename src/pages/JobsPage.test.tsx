// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { JobsPage } from './JobsPage'
import { renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('JobsPage', () => {
  beforeEach(() => {
    setupRouteTestEnvironment()
  })

  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the jobs list from the jobs query', async () => {
    renderRoute({
      element: <JobsPage />,
      path: '/jobs',
      route: '/jobs',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('Example Co')).toBeInTheDocument()
    expect(screen.getByText('Interview')).toBeInTheDocument()
  })

  it('refreshes the jobs list after creating a job through a page mutation', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <JobsPage />,
      path: '/jobs',
      route: '/jobs',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Job title'), 'Staff Platform Engineer')
    await user.type(screen.getByLabelText('Company name'), 'Northwind Labs')
    await user.click(screen.getByRole('button', { name: 'Add job' }))

    expect(await screen.findByText('Staff Platform Engineer')).toBeInTheDocument()
    expect(screen.getByText('Northwind Labs')).toBeInTheDocument()
  })
})
// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../../api'
import type { JobDetailDto } from '../../api/read-models'
import { JobPage } from './JobPage'
import {
  createSeedData,
  renderRoute,
  resetRouteTestState,
  setupRouteTestEnvironment,
} from '../../test/route-test-helpers'

describe('JobPage', () => {
  beforeEach(() => {
    setupRouteTestEnvironment()
  })

  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the job detail route from query-backed detail data', async () => {
    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
  })

  it('does not fall through to the not-found state while a delayed detail response is settling', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })
    const jobDetail = await apiClient.getJobDetail('job_1')
    let resolveJobDetail: ((value: JobDetailDto | null) => void) | undefined

    setAppApiClient({
      ...apiClient,
      getJobDetail: vi.fn(
        () =>
          new Promise<JobDetailDto | null>((resolve) => {
            resolveJobDetail = resolve
          }),
      ),
    })

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(screen.getByText('Loading job...')).toBeInTheDocument()
    expect(screen.queryByText('Job not found')).not.toBeInTheDocument()

    resolveJobDetail?.(jobDetail)

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Job not found')).not.toBeInTheDocument()
  })

  it('updates the job detail route through page-level mutations', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Job details/i }))
    await user.clear(screen.getByLabelText('Job title'))
    await user.type(screen.getByLabelText('Job title'), 'Principal Engineer')
    await user.tab()

    expect(await screen.findByText('Principal Engineer')).toBeInTheDocument()
  })

  it('updates job child editor links through mutation hooks', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Links/i }))
    await user.clear(screen.getByDisplayValue('https://jobs.example.com/1'))
    await user.type(screen.getByRole('textbox'), 'https://jobs.example.com/principal-role')
    await user.tab()

    expect(await screen.findByDisplayValue('https://jobs.example.com/principal-role')).toBeInTheDocument()
  })

  it('auto-expands newly added application questions, contacts, and interviews', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Application questions\b/i }))
    await user.click(screen.getByRole('button', { name: 'Add application question' }))

    expect(await screen.findByLabelText('Question')).toBeInTheDocument()
    expect(screen.getByLabelText('Answer')).toBeInTheDocument()

    await waitFor(async () => {
      await Promise.resolve()
      expect(screen.getByLabelText('Question')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Contacts\b/i }))
    await user.click(screen.getByRole('button', { name: 'Add contact' }))

    expect(await screen.findByLabelText('Relationship type')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn URL')).toBeInTheDocument()

    await waitFor(async () => {
      await Promise.resolve()
      expect(screen.getByLabelText('Relationship type')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Interviews\b/i }))
    await user.click(screen.getByRole('button', { name: 'Add interview' }))

    expect(await screen.findByLabelText('Start at')).toBeInTheDocument()
    expect(screen.getByText('No contacts associated with this interview yet.')).toBeInTheDocument()

    await waitFor(async () => {
      await Promise.resolve()
      expect(screen.getByLabelText('Start at')).toBeInTheDocument()
    })
  })

  it('restores expanded panels after the job route remounts', async () => {
    const user = userEvent.setup()

    const firstRender = renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.queryByLabelText('Relationship type')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Contacts\b/i }))
    await user.click(screen.getByRole('button', { name: /^Hiring Manager\b/i }))

    expect(await screen.findByLabelText('Relationship type')).toBeInTheDocument()

    firstRender.unmount()

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByLabelText('Relationship type')).toBeInTheDocument()
  })

  it('duplicates attached profiles through job child editor actions', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Profiles/i }))
    expect(screen.getByRole('link', { name: 'Tailored Profile' })).toHaveAttribute('href', '/profiles/profile_1')
    await user.click(screen.getByRole('button', { name: 'Duplicate profile Tailored Profile' }))

    expect(await screen.findByText('Tailored Profile Copy')).toBeInTheDocument()
  })

  it('renders the job not-found state when the requested job does not exist', async () => {
    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/missing-job',
    })

    expect(await screen.findByText('Job not found')).toBeInTheDocument()
    expect(screen.getByText('The selected job could not be found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to jobs' })).toHaveAttribute('href', '/jobs')
  })

  it('renders the job refresh-error state when the detail query fails without cached data', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setAppApiClient({
      ...apiClient,
      getJobDetail: vi.fn(async () => {
        throw new Error('job detail failed')
      }),
    })

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Unable to load job')).toBeInTheDocument()
    expect(screen.getByText('The job details could not be refreshed right now.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to jobs' })).toHaveAttribute('href', '/jobs')
  })

  it('refetches the active job detail query after a job mutation while the route is mounted', async () => {
    const user = userEvent.setup()
    const apiClient = createAppApiClient({ initialData: createSeedData() })
    const getJobDetail = vi.spyOn(apiClient, 'getJobDetail')

    setAppApiClient(apiClient)

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await waitFor(() => {
      expect(getJobDetail).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: /Job details/i }))
    await user.clear(screen.getByLabelText('Job title'))
    await user.type(screen.getByLabelText('Job title'), 'Principal Engineer')
    await user.tab()

    await waitFor(() => {
      expect(getJobDetail.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    expect(await screen.findByText('Principal Engineer')).toBeInTheDocument()
  })
})
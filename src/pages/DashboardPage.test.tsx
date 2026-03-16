// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import type { DashboardActivityDto, DashboardActivityPeriodDays, DashboardSummaryDto } from '../api/read-models'
import { DashboardPage } from './DashboardPage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

const createDashboardActivity = (periodDays: DashboardActivityPeriodDays): DashboardActivityDto => ({
  periodDays,
  points: Array.from({ length: periodDays }, (_, index) => ({
    date: `2026-03-${String(index + 1).padStart(2, '0')}`,
    jobsAddedCount: index === periodDays - 1 ? 2 : 0,
    applicationsSubmittedCount: index === periodDays - 1 ? 1 : 0,
    interviewsBookedCount: index === periodDays - 2 ? 1 : 0,
    offersReceivedCount: index === periodDays - 1 ? 1 : 0,
  })),
})

describe('DashboardPage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders dashboard metrics from the summary query', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })
    const getDashboardActivity = vi.fn(async (periodDays: DashboardActivityPeriodDays) => createDashboardActivity(periodDays))

    setupRouteTestEnvironment()
    setAppApiClient({
      ...apiClient,
      getDashboardActivity,
      getDashboardSummary: vi.fn(async () => ({
        profileCount: 1,
        baseProfileCount: 0,
        jobProfileCount: 1,
        jobCount: 1,
        activeInterviewCount: 1,
        contactCount: 2,
        addedTodayCount: 1,
        addedLast7DaysCount: 3,
        notAppliedCount: 4,
        appliedTodayCount: 2,
        appliedLast7DaysCount: 5,
        interviewsBookedTodayCount: 1,
        interviewsBookedLast7DaysCount: 2,
        offersReceivedTodayCount: 1,
        offersReceivedLast7DaysCount: 2,
        upcomingInterviewCount: 1,
        upcomingInterviews: [
          {
            interviewId: 'interview_1',
            jobId: 'job_1',
            jobTitle: 'Senior Engineer',
            companyName: 'Example Co',
            staffingAgencyName: '',
            startAt: '2026-03-17T15:00:00.000Z',
          },
        ],
        updatedAt: '2026-03-16T12:00:00.000Z',
      })),
    })

    renderRoute({
      element: <DashboardPage />,
      path: '/dashboard',
      route: '/dashboard',
    })

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Jobs')).toBeInTheDocument()
    expect(screen.getByText('Applications')).toBeInTheDocument()
    expect(screen.getByText('Interviews')).toBeInTheDocument()
    expect(screen.getByText('Offers')).toBeInTheDocument()
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true')

    await waitFor(() => {
      expect(screen.getByText('Upcoming interviews')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Dashboard activity over the last 7 days' })).toBeInTheDocument()
      expect(screen.getByText('Added today').parentElement).toHaveTextContent('1')
      expect(screen.getByText('Added last 7 days').parentElement).toHaveTextContent('3')
      expect(screen.getByText('Not applied').parentElement).toHaveTextContent('4')
      expect(screen.getByText('Applied today').parentElement).toHaveTextContent('2')
      expect(screen.getByText('Applied last 7 days').parentElement).toHaveTextContent('5')
      expect(screen.getByText('Interviews booked today').parentElement).toHaveTextContent('1')
      expect(screen.getByText('Interviews booked last 7 days').parentElement).toHaveTextContent('2')
      expect(screen.getByText('Offers received today').parentElement).toHaveTextContent('1')
      expect(screen.getByText('Offers received last 7 days').parentElement).toHaveTextContent('2')
    })

    expect(screen.getByText('1 scheduled')).toBeInTheDocument()
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('Example Co')).toBeInTheDocument()
    expect(getDashboardActivity).toHaveBeenCalledWith(7)
  })

  it('switches the activity chart between 7-day and 30-day periods', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })
    const getDashboardActivity = vi.fn(async (periodDays: DashboardActivityPeriodDays) => createDashboardActivity(periodDays))
    const user = userEvent.setup()

    setupRouteTestEnvironment()
    setAppApiClient({
      ...apiClient,
      getDashboardActivity,
      getDashboardSummary: vi.fn(async () => ({
        profileCount: 1,
        baseProfileCount: 0,
        jobProfileCount: 1,
        jobCount: 1,
        activeInterviewCount: 0,
        contactCount: 0,
        addedTodayCount: 0,
        addedLast7DaysCount: 0,
        notAppliedCount: 0,
        appliedTodayCount: 0,
        appliedLast7DaysCount: 0,
        interviewsBookedTodayCount: 0,
        interviewsBookedLast7DaysCount: 0,
        offersReceivedTodayCount: 0,
        offersReceivedLast7DaysCount: 0,
        upcomingInterviewCount: 0,
        upcomingInterviews: [],
        updatedAt: '2026-03-16T12:00:00.000Z',
      })),
    })

    renderRoute({
      element: <DashboardPage />,
      path: '/dashboard',
      route: '/dashboard',
    })

    expect(await screen.findByRole('img', { name: 'Dashboard activity over the last 7 days' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '30 days' }))

    await waitFor(() => {
      expect(getDashboardActivity).toHaveBeenCalledWith(30)
      expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('img', { name: 'Dashboard activity over the last 30 days' })).toBeInTheDocument()
    })
  })

  it('shows a loading message while the summary query is pending', () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    setAppApiClient({
      ...apiClient,
      getDashboardActivity: vi.fn(() => new Promise<DashboardActivityDto>(() => {})),
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
      getDashboardActivity: vi.fn(async () => createDashboardActivity(7)),
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

  it('shows an empty state when there are no upcoming interviews', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    setAppApiClient({
      ...apiClient,
      getDashboardActivity: vi.fn(async () => createDashboardActivity(7)),
      getDashboardSummary: vi.fn(async () => ({
        profileCount: 1,
        baseProfileCount: 0,
        jobProfileCount: 1,
        jobCount: 1,
        activeInterviewCount: 1,
        contactCount: 2,
        addedTodayCount: 0,
        addedLast7DaysCount: 0,
        notAppliedCount: 0,
        appliedTodayCount: 0,
        appliedLast7DaysCount: 0,
        interviewsBookedTodayCount: 0,
        interviewsBookedLast7DaysCount: 0,
        offersReceivedTodayCount: 0,
        offersReceivedLast7DaysCount: 0,
        upcomingInterviewCount: 0,
        upcomingInterviews: [],
        updatedAt: '2026-03-16T12:00:00.000Z',
      })),
    })

    renderRoute({
      element: <DashboardPage />,
      path: '/dashboard',
      route: '/dashboard',
    })

    await screen.findByText('Dashboard')

    expect(screen.queryByText('Upcoming interviews')).not.toBeInTheDocument()
  })
})
// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { CoverLetterPage } from './CoverLetterPage'
import { queryClient } from '../queries/query-client'
import { queryKeys } from '../queries/query-keys'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('CoverLetterPage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('renders the cover letter document and updates the document title', async () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Hiring Manager,')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Ada_Example_Cover_Letter')
    })
  })

  it('shows cached cover letter data when the document refresh fails', async () => {
    const apiClient = createAppApiClient({ initialData: createSeedData() })

    setupRouteTestEnvironment()
    queryClient.setQueryData(queryKeys.profilesDocument('profile_1'), await apiClient.getProfileDocument('profile_1'))
    setAppApiClient({
      ...apiClient,
      getProfileDocument: vi.fn(async () => {
        throw new Error('cover letter refresh failed')
      }),
    })

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Hiring Manager,')).toBeInTheDocument()
    expect(await screen.findByText('Unable to refresh this document right now. Showing the most recently cached result if available.')).toBeInTheDocument()
  })

  it('uses the selected cover letter recipient when the profile specifies one', async () => {
    const initialData = createSeedData()
    initialData.profiles.profile_1!.coverLetterContactId = 'job_contact_2'

    setupRouteTestEnvironment({ initialData })

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Taylor Recruiter,')).toBeInTheDocument()
  })

  it('uses the staffing default recipient and replaces JOB.COMPANY with the real company name when available', async () => {
    const initialData = createSeedData()
    initialData.jobs.job_1!.companyName = 'Example Co'
    initialData.jobs.job_1!.staffingAgencyName = 'North Ridge Talent'
    initialData.profiles.profile_1!.coverLetterContactId = 'staffingAgencyRecruitingTeam'
    initialData.profiles.profile_1!.coverLetter = 'I am excited about the opportunity to support {{JOB.COMPANY}}.'

    setupRouteTestEnvironment({ initialData })

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Recruiting Team,')).toBeInTheDocument()
    expect(screen.getByText('North Ridge Talent')).toBeInTheDocument()
    expect(screen.getByText('I am excited about the opportunity to support Example Co.')).toBeInTheDocument()
  })

  it('uses the staffing default recipient and replaces JOB.COMPANY with a client reference when company name is unavailable', async () => {
    const initialData = createSeedData()
    initialData.jobs.job_1!.companyName = ''
    initialData.jobs.job_1!.staffingAgencyName = 'North Ridge Talent'
    initialData.profiles.profile_1!.coverLetterContactId = 'staffingAgencyRecruitingTeam'
    initialData.profiles.profile_1!.coverLetter = 'I am excited about the opportunity to support {{JOB.COMPANY}}.'

    setupRouteTestEnvironment({ initialData })

    renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Recruiting Team,')).toBeInTheDocument()
    expect(screen.getByText('North Ridge Talent')).toBeInTheDocument()
    expect(screen.getByText("I am excited about the opportunity to support your client's organization.")).toBeInTheDocument()
  })

  it('does not show the company line for the staffing virtual recipient when staffingAgencyName is blank', async () => {
    const initialData = createSeedData()
    initialData.jobs.job_1!.companyName = 'Example Co'
    initialData.jobs.job_1!.staffingAgencyName = ''
    initialData.profiles.profile_1!.coverLetterContactId = 'staffingAgencyRecruitingTeam'

    setupRouteTestEnvironment({ initialData })

    const { container } = renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Recruiting Team,')).toBeInTheDocument()
    expect(container.querySelector('.cover-letter-inside-address .mt-6')).not.toBeInTheDocument()
  })

  it('does not show the company line for the company virtual recipient when companyName is blank', async () => {
    const initialData = createSeedData()
    initialData.jobs.job_1!.companyName = ''
    initialData.jobs.job_1!.staffingAgencyName = 'North Ridge Talent'
    initialData.profiles.profile_1!.coverLetterContactId = 'companyHiringManager'

    setupRouteTestEnvironment({ initialData })

    const { container } = renderRoute({
      element: <CoverLetterPage />,
      path: '/profiles/:profileId/cover-letter',
      route: '/profiles/profile_1/cover-letter',
    })

    expect(await screen.findByText('Dear Hiring Manager,')).toBeInTheDocument()
    expect(container.querySelector('.cover-letter-inside-address .mt-6')).not.toBeInTheDocument()
  })
})
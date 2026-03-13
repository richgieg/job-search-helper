// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, resetAppApiClient, setAppApiClient } from '../api'
import { ImportExportPage } from './ImportExportPage'
import { JobPage } from './JobPage'
import { JobsPage } from './JobsPage'
import { ProfilePage } from './ProfilePage'
import { queryKeys } from '../queries/query-keys'
import { queryClient } from '../queries/query-client'
import { ResumePage } from './ResumePage'
import { createDefaultResumeSettings, createDefaultUiState, createEmptyDataState } from '../store/create-initial-state'
import { useAppUiZustandStore } from '../store/app-ui-zustand-store'
import { renderRoute } from '../test/render-route'

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = [0]

  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn<() => IntersectionObserverEntry[]>(() => [])
  unobserve = vi.fn()
}

const resetStore = () => {
  queryClient.clear()
  resetAppApiClient()
  useAppUiZustandStore.setState((state) => ({
    ...state,
    ui: createDefaultUiState('system'),
  }))
}

const createSeedData = () => {
  const data = createEmptyDataState()

  data.jobs.job_1 = {
    id: 'job_1',
    companyName: 'Example Co',
    jobTitle: 'Senior Engineer',
    description: 'Build systems',
    location: 'Remote',
    postedCompensation: '',
    desiredCompensation: '',
    compensationNotes: '',
    workArrangement: 'remote',
    employmentType: 'full_time',
    datePosted: '2026-03-01',
    appliedAt: '2026-03-05T12:00:00.000Z',
    finalOutcome: null,
    notes: 'Important role',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  data.profiles.profile_1 = {
    id: 'profile_1',
    name: 'Tailored Profile',
    summary: 'Summary',
    coverLetter: 'Cover letter',
    resumeSettings: createDefaultResumeSettings(),
    personalDetails: {
      fullName: 'Ada Example',
      email: 'ada@example.com',
      phone: '555-0100',
      addressLine1: '1 Main St',
      addressLine2: '',
      addressLine3: '',
      city: 'Exampletown',
      state: 'CA',
      postalCode: '90210',
    },
    jobId: 'job_1',
    clonedFromProfileId: null,
    createdAt: '2026-03-02T12:00:00.000Z',
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  data.profileLinks.profile_link_1 = {
    id: 'profile_link_1',
    profileId: 'profile_1',
    name: 'Portfolio',
    url: 'https://example.com',
    enabled: true,
    sortOrder: 1,
  }

  data.skillCategories.skill_category_1 = {
    id: 'skill_category_1',
    profileId: 'profile_1',
    name: 'Languages',
    enabled: true,
    sortOrder: 1,
  }

  data.skills.skill_1 = {
    id: 'skill_1',
    skillCategoryId: 'skill_category_1',
    name: 'TypeScript',
    enabled: true,
    sortOrder: 1,
  }

  data.experienceEntries.experience_1 = {
    id: 'experience_1',
    profileId: 'profile_1',
    company: 'Example Co',
    title: 'Engineer',
    location: 'Remote',
    workArrangement: 'remote',
    employmentType: 'full_time',
    startDate: '2024-01-01',
    endDate: null,
    isCurrent: true,
    reasonForLeavingShort: '',
    reasonForLeavingDetails: '',
    supervisor: {
      name: '',
      title: '',
      phone: '',
      email: '',
    },
    enabled: true,
    sortOrder: 1,
  }

  data.experienceBullets.experience_bullet_1 = {
    id: 'experience_bullet_1',
    experienceEntryId: 'experience_1',
    content: 'Built feature flags',
    level: 1,
    enabled: true,
    sortOrder: 1,
  }

  data.jobLinks.job_link_1 = {
    id: 'job_link_1',
    jobId: 'job_1',
    url: 'https://jobs.example.com/1',
    sortOrder: 1,
    createdAt: '2026-03-01T12:00:00.000Z',
  }

  data.jobContacts.job_contact_1 = {
    id: 'job_contact_1',
    jobId: 'job_1',
    name: 'Hiring Manager',
    title: 'Director',
    company: 'Example Co',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    email: 'manager@example.com',
    phone: '555-0101',
    linkedinUrl: '',
    relationshipType: 'hiring_manager',
    notes: '',
    sortOrder: 1,
  }

  data.interviews.interview_1 = {
    id: 'interview_1',
    jobId: 'job_1',
    startAt: '2026-03-10T15:00:00.000Z',
    notes: 'Panel interview',
  }

  data.interviewContacts.interview_contact_1 = {
    id: 'interview_contact_1',
    interviewId: 'interview_1',
    jobContactId: 'job_contact_1',
    sortOrder: 1,
  }

  data.applicationQuestions.application_question_1 = {
    id: 'application_question_1',
    jobId: 'job_1',
    question: 'Why this role?',
    answer: 'Great fit',
    sortOrder: 1,
  }

  return data
}

describe('query-backed routes', () => {
  beforeEach(() => {
    resetStore()
    queryClient.setDefaultOptions({
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
    })
    globalThis.IntersectionObserver = MockIntersectionObserver as typeof IntersectionObserver
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
    setAppApiClient(createAppApiClient({ initialData: createSeedData() }))
  })

  afterEach(() => {
    cleanup()
    resetStore()
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

  it('refreshes the jobs list after creating a job through a store mutation', async () => {
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

  it('renders the job detail route from query-backed detail data', async () => {
    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
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

  it('duplicates attached profiles through job child editor actions', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Profiles/i }))
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

  it('renders the profile detail route from query-backed detail data', async () => {
    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()
    expect(screen.getByText('Job profile for Senior Engineer at Example Co')).toBeInTheDocument()
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

  it('renders the resume route from the profile document query and updates the document title', async () => {
    renderRoute({
      element: <ResumePage />,
      path: '/profiles/:profileId/resume',
      route: '/profiles/profile_1/resume',
    })

    expect(await screen.findByText('Ada Example')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Ada_Example_Resume')
    })

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('shows cached resume data when document refresh fails', async () => {
    const seededData = createSeedData()
    const apiClient = createAppApiClient({ initialData: seededData })

    queryClient.setQueryData(queryKeys.profilesDocument('profile_1'), await apiClient.getProfileDocument('profile_1'))

    setAppApiClient({
      ...apiClient,
      getProfileDocument: vi.fn(async () => {
        throw new Error('refresh failed')
      }),
    })

    renderRoute({
      element: <ResumePage />,
      path: '/profiles/:profileId/resume',
      route: '/profiles/profile_1/resume',
    })

    expect(await screen.findByText('Ada Example')).toBeInTheDocument()
    expect(await screen.findByText(/Unable to refresh this document right now/i)).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('refreshes import page counts after importing json', async () => {
    const user = userEvent.setup()

    setAppApiClient(createAppApiClient({ initialData: createEmptyDataState() }))

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('0 profiles · 0 jobs')).toBeInTheDocument()

    const imported = {
      version: 1 as const,
      exportedAt: '2026-03-12T12:00:00.000Z',
      data: createSeedData(),
    }

    const file = new File([JSON.stringify(imported)], 'import.json', { type: 'application/json' })

    await user.upload(screen.getByLabelText('Import JSON'), file)

    expect(await screen.findByText('1 profiles · 1 jobs')).toBeInTheDocument()
  })
})
// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, resetAppApiClient, setAppApiClient } from '../api'
import { JobPage } from './JobPage'
import { JobsPage } from './JobsPage'
import { ProfilePage } from './ProfilePage'
import { queryClient } from '../queries/query-client'
import { ResumePage } from './ResumePage'
import { createDefaultResumeSettings, createDefaultUiState, createEmptyDataState } from '../store/create-initial-state'
import { useAppStore } from '../store/app-store'
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
  useAppStore.setState((state) => ({
    ...state,
    data: createEmptyDataState(),
    ui: createDefaultUiState('system'),
    status: {
      saving: 'idle',
      errorMessage: null,
    },
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

  it('renders the job detail route and bridges child editor data into the store', async () => {
    renderRoute({
      element: <JobPage />,
      path: '/jobs/:jobId',
      route: '/jobs/job_1',
    })

    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()

    await waitFor(() => {
      expect(useAppStore.getState().data.profiles.profile_1?.name).toBe('Tailored Profile')
    })

    expect(screen.getByText('Applied')).toBeInTheDocument()
  })

  it('renders the profile detail route and bridges profile editor data into the store', async () => {
    renderRoute({
      element: <ProfilePage />,
      path: '/profiles/:profileId',
      route: '/profiles/profile_1',
    })

    expect(await screen.findByText('Tailored Profile')).toBeInTheDocument()
    expect(screen.getByText('Job profile for Senior Engineer at Example Co')).toBeInTheDocument()

    await waitFor(() => {
      expect(useAppStore.getState().data.experienceEntries.experience_1?.company).toBe('Example Co')
    })
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

    useAppStore.setState((state) => ({
      ...state,
      data: seededData,
    }))

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
})
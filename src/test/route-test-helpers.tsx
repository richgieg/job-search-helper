import { QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

import { createAppApiClient, resetAppApiClient, setAppApiClient } from '../api'
import { createEmptyAppDataState } from '../domain/app-data-state'
import { createDefaultResumeSettings } from '../domain/profile-defaults'
import { queryClient } from '../queries/query-client'
import { createDefaultUiState, useAppUiStore } from '../store/app-ui-store'
import type { AppDataState } from '../types/state'

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = [0]

  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn<() => IntersectionObserverEntry[]>(() => [])
  unobserve = vi.fn()
}

const defaultQueryOptions = {
  queries: {
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  },
}

export const renderRoute = ({
  element,
  path,
  route,
}: {
  element: ReactElement
  path: string
  route: string
}): RenderResult => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={element} path={path} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

export const resetRouteTestState = () => {
  cleanup()
  queryClient.clear()
  resetAppApiClient()
  useAppUiStore.setState((state) => ({
    ...state,
    ui: createDefaultUiState('system'),
  }))
}

export const setupRouteTestEnvironment = ({
  initialData = createSeedData(),
}: {
  initialData?: AppDataState
} = {}) => {
  resetRouteTestState()
  queryClient.setDefaultOptions(defaultQueryOptions)
  globalThis.IntersectionObserver = MockIntersectionObserver as typeof IntersectionObserver
  window.scrollTo = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  setAppApiClient(createAppApiClient({ initialData }))
}

export const createSeedData = (): AppDataState => {
  const data = createEmptyAppDataState()

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
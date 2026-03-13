// @vitest-environment jsdom

import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createEmptyAppDataState } from '../domain/app-data-state'
import { createDefaultResumeSettings } from '../domain/profile-defaults'
import type { AppExportFile } from '../types/state'
import type { PersistedAppData } from './indexeddb'
import { deleteAppDatabase } from './indexeddb'
import { IndexedDbAppBackend } from './indexeddb-app-backend'
import { MockAppBackend } from './mock-app-backend'

const databaseName = 'job-search-helper-indexeddb-backend-test'

const toPersistedAppData = (data: ReturnType<typeof createSeedData>): PersistedAppData => {
  const { version: _version, exportedAt: _exportedAt, ...persistedData } = data
  return persistedData
}

const createSeedData = () => {
  const data = createEmptyAppDataState()

  data.profiles.profile_1 = {
    id: 'profile_1',
    name: 'Base Profile',
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
    jobId: null,
    clonedFromProfileId: null,
    createdAt: '2026-03-02T12:00:00.000Z',
    updatedAt: '2026-03-02T12:00:00.000Z',
  }

  data.profiles.profile_2 = {
    id: 'profile_2',
    name: 'Job Profile',
    summary: 'Tailored summary',
    coverLetter: 'Tailored cover letter',
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
    jobId: 'job_2',
    clonedFromProfileId: 'profile_1',
    createdAt: '2026-03-03T12:00:00.000Z',
    updatedAt: '2026-03-05T12:00:00.000Z',
  }

  data.profiles.profile_3 = {
    id: 'profile_3',
    name: 'Job 1 Profile',
    summary: 'Role-specific summary',
    coverLetter: 'Role-specific cover letter',
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
    clonedFromProfileId: 'profile_1',
    createdAt: '2026-03-02T18:00:00.000Z',
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  data.jobs.job_1 = {
    id: 'job_1',
    companyName: 'Example Co',
    jobTitle: 'Senior Engineer',
    description: '',
    location: 'Remote',
    postedCompensation: '',
    desiredCompensation: '',
    compensationNotes: '',
    workArrangement: 'remote',
    employmentType: 'full_time',
    datePosted: '2026-03-01',
    appliedAt: null,
    finalOutcome: null,
    notes: '',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  }

  data.jobLinks.job_link_1 = {
    id: 'job_link_1',
    jobId: 'job_1',
    url: 'https://example.com/job-1',
    sortOrder: 2,
    createdAt: '2026-03-01T12:00:00.000Z',
  }

  data.jobLinks.job_link_2 = {
    id: 'job_link_2',
    jobId: 'job_1',
    url: 'https://example.com/job-1-primary',
    sortOrder: 1,
    createdAt: '2026-03-01T12:00:00.000Z',
  }

  data.interviews.interview_1 = {
    id: 'interview_1',
    jobId: 'job_1',
    startAt: '2026-03-05T12:00:00.000Z',
    notes: '',
  }

  data.interviews.interview_2 = {
    id: 'interview_2',
    jobId: 'job_1',
    startAt: null,
    notes: 'Scheduling in progress',
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

  data.jobContacts.job_contact_2 = {
    id: 'job_contact_2',
    jobId: 'job_1',
    name: 'Recruiter',
    title: 'Recruiter',
    company: 'Example Co',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    email: 'recruiter@example.com',
    phone: '555-0102',
    linkedinUrl: '',
    relationshipType: 'recruiter',
    notes: '',
    sortOrder: 2,
  }

  data.interviewContacts.interview_contact_1 = {
    id: 'interview_contact_1',
    interviewId: 'interview_1',
    jobContactId: 'job_contact_2',
    sortOrder: 2,
  }

  data.interviewContacts.interview_contact_2 = {
    id: 'interview_contact_2',
    interviewId: 'interview_1',
    jobContactId: 'job_contact_1',
    sortOrder: 1,
  }

  data.applicationQuestions.application_question_1 = {
    id: 'application_question_1',
    jobId: 'job_1',
    question: 'Why this role?',
    answer: 'Great fit',
    sortOrder: 2,
  }

  data.applicationQuestions.application_question_2 = {
    id: 'application_question_2',
    jobId: 'job_1',
    question: 'Why this company?',
    answer: 'Strong mission alignment',
    sortOrder: 1,
  }

  data.jobs.job_2 = {
    id: 'job_2',
    companyName: 'Another Co',
    jobTitle: 'Staff Engineer',
    description: '',
    location: 'Hybrid',
    postedCompensation: '',
    desiredCompensation: '',
    compensationNotes: '',
    workArrangement: 'hybrid',
    employmentType: 'full_time',
    datePosted: '2026-03-02',
    appliedAt: '2026-03-03T12:00:00.000Z',
    finalOutcome: null,
    notes: '',
    createdAt: '2026-03-02T12:00:00.000Z',
    updatedAt: '2026-03-04T12:00:00.000Z',
  }

  data.profileLinks.profile_link_1 = {
    id: 'profile_link_1',
    profileId: 'profile_3',
    name: 'Portfolio',
    url: 'https://example.com/portfolio',
    enabled: true,
    sortOrder: 2,
  }

  data.profileLinks.profile_link_2 = {
    id: 'profile_link_2',
    profileId: 'profile_3',
    name: 'GitHub',
    url: 'https://github.com/example',
    enabled: true,
    sortOrder: 1,
  }

  data.skillCategories.skill_category_1 = {
    id: 'skill_category_1',
    profileId: 'profile_3',
    name: 'Languages',
    enabled: true,
    sortOrder: 2,
  }

  data.skillCategories.skill_category_2 = {
    id: 'skill_category_2',
    profileId: 'profile_3',
    name: 'Frameworks',
    enabled: true,
    sortOrder: 1,
  }

  data.skills.skill_1 = {
    id: 'skill_1',
    skillCategoryId: 'skill_category_1',
    name: 'TypeScript',
    enabled: true,
    sortOrder: 2,
  }

  data.skills.skill_2 = {
    id: 'skill_2',
    skillCategoryId: 'skill_category_1',
    name: 'Python',
    enabled: true,
    sortOrder: 1,
  }

  data.skills.skill_3 = {
    id: 'skill_3',
    skillCategoryId: 'skill_category_2',
    name: 'React',
    enabled: true,
    sortOrder: 1,
  }

  data.achievements.achievement_1 = {
    id: 'achievement_1',
    profileId: 'profile_3',
    name: 'Improved throughput',
    description: 'Reduced processing times by 30%',
    enabled: true,
    sortOrder: 1,
  }

  data.experienceEntries.experience_entry_1 = {
    id: 'experience_entry_1',
    profileId: 'profile_3',
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
    experienceEntryId: 'experience_entry_1',
    content: 'Built feature flags',
    level: 1,
    enabled: true,
    sortOrder: 2,
  }

  data.experienceBullets.experience_bullet_2 = {
    id: 'experience_bullet_2',
    experienceEntryId: 'experience_entry_1',
    content: 'Improved deployment safety',
    level: 1,
    enabled: true,
    sortOrder: 1,
  }

  data.educationEntries.education_entry_1 = {
    id: 'education_entry_1',
    profileId: 'profile_3',
    school: 'State University',
    degree: 'BS Computer Science',
    startDate: '2018-09-01',
    endDate: '2022-05-15',
    status: 'graduated',
    enabled: true,
    sortOrder: 1,
  }

  data.educationBullets.education_bullet_1 = {
    id: 'education_bullet_1',
    educationEntryId: 'education_entry_1',
    content: 'Dean\'s list',
    level: 1,
    enabled: true,
    sortOrder: 1,
  }

  data.projects.project_1 = {
    id: 'project_1',
    profileId: 'profile_3',
    name: 'Internal Tooling',
    organization: 'Example Co',
    startDate: '2025-01-01',
    endDate: null,
    enabled: true,
    sortOrder: 1,
  }

  data.projectBullets.project_bullet_1 = {
    id: 'project_bullet_1',
    projectId: 'project_1',
    content: 'Built a release automation dashboard',
    level: 1,
    enabled: true,
    sortOrder: 1,
  }

  data.additionalExperienceEntries.additional_experience_entry_1 = {
    id: 'additional_experience_entry_1',
    profileId: 'profile_3',
    title: 'Volunteer Mentor',
    organization: 'Code Club',
    location: 'Remote',
    startDate: '2023-01-01',
    endDate: null,
    enabled: true,
    sortOrder: 1,
  }

  data.additionalExperienceBullets.additional_experience_bullet_1 = {
    id: 'additional_experience_bullet_1',
    additionalExperienceEntryId: 'additional_experience_entry_1',
    content: 'Mentored junior developers',
    level: 1,
    enabled: true,
    sortOrder: 1,
  }

  data.certifications.certification_1 = {
    id: 'certification_1',
    profileId: 'profile_3',
    name: 'AWS Developer Associate',
    issuer: 'Amazon',
    issueDate: '2025-06-01',
    expiryDate: null,
    credentialId: 'aws-123',
    credentialUrl: 'https://example.com/aws-cert',
    enabled: true,
    sortOrder: 1,
  }

  data.references.reference_1 = {
    id: 'reference_1',
    profileId: 'profile_3',
    type: 'professional',
    name: 'Manager Example',
    relationship: 'Manager',
    company: 'Example Co',
    title: 'Director',
    email: 'manager@example.com',
    phone: '555-0101',
    notes: '',
    enabled: true,
    sortOrder: 1,
  }

  return data
}

afterEach(async () => {
  await deleteAppDatabase({ databaseName })
})

describe('IndexedDbAppBackend', () => {
  it('imports and exports through the IndexedDB snapshot repository', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T15:00:00.000Z',
    })
    const seedData = createSeedData()
    const persistedSeedData = toPersistedAppData(seedData)
    const file: AppExportFile = {
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: persistedSeedData,
    }

    await expect(backend.importAppData(file)).resolves.toEqual({
      version: 1,
      ...persistedSeedData,
    })

    await expect(backend.getAppData()).resolves.toEqual({
      version: 1,
      ...persistedSeedData,
    })

    await expect(backend.exportAppData()).resolves.toEqual({
      version: 1,
      exportedAt: '2026-03-13T15:00:00.000Z',
      data: persistedSeedData,
    })
  })

  it('persists compatibility-path mutations across backend instances', async () => {
    const firstBackend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:00:00.000Z',
    })

    const creationResult = await firstBackend.createJob({
      companyName: 'Persisted Co',
      jobTitle: 'Platform Engineer',
      location: 'Remote',
    })

    expect(creationResult.createdId).toBeTruthy()

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const jobsList = await secondBackend.getJobsList()

    expect(jobsList.items).toHaveLength(1)
    expect(jobsList.items[0]).toMatchObject({
      companyName: 'Persisted Co',
      jobTitle: 'Platform Engineer',
    })

    const persistedData = await secondBackend.getAppData()

    expect(Object.keys(persistedData.jobs)).toHaveLength(1)
  })

  it('builds the jobs list directly from IndexedDB without delegating to MockAppBackend', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()
    const getJobsListSpy = vi.spyOn(MockAppBackend.prototype, 'getJobsList').mockRejectedValue(new Error('should not be used'))

    try {
      await backend.importAppData({
        version: 1,
        exportedAt: '2026-03-12T10:00:00.000Z',
        data: toPersistedAppData(seedData),
      })

      await expect(backend.getJobsList()).resolves.toEqual({
        items: [
          {
            id: 'job_2',
            companyName: 'Another Co',
            jobTitle: 'Staff Engineer',
            computedStatus: 'applied',
            interviewCount: 0,
            jobLinks: [],
            createdAt: '2026-03-02T12:00:00.000Z',
            updatedAt: '2026-03-04T12:00:00.000Z',
          },
          {
            id: 'job_1',
            companyName: 'Example Co',
            jobTitle: 'Senior Engineer',
            computedStatus: 'interview',
            interviewCount: 2,
            jobLinks: [
              {
                id: 'job_link_2',
                url: 'https://example.com/job-1-primary',
              },
              {
                id: 'job_link_1',
                url: 'https://example.com/job-1',
              },
            ],
            createdAt: '2026-03-01T12:00:00.000Z',
            updatedAt: '2026-03-01T12:00:00.000Z',
          },
        ],
        updatedAt: '2026-03-04T12:00:00.000Z',
      })

      expect(getJobsListSpy).not.toHaveBeenCalled()
    } finally {
      getJobsListSpy.mockRestore()
    }
  })

  it('builds the dashboard summary directly from IndexedDB without delegating to MockAppBackend', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()
    const getDashboardSummarySpy = vi
      .spyOn(MockAppBackend.prototype, 'getDashboardSummary')
      .mockRejectedValue(new Error('should not be used'))

    try {
      await backend.importAppData({
        version: 1,
        exportedAt: '2026-03-12T10:00:00.000Z',
        data: toPersistedAppData(seedData),
      })

      await expect(backend.getDashboardSummary()).resolves.toEqual({
        profileCount: 3,
        baseProfileCount: 1,
        jobProfileCount: 2,
        jobCount: 2,
        activeInterviewCount: 2,
        contactCount: 2,
        updatedAt: '2026-03-06T12:00:00.000Z',
      })

      expect(getDashboardSummarySpy).not.toHaveBeenCalled()
    } finally {
      getDashboardSummarySpy.mockRestore()
    }
  })

  it('builds the profiles list directly from IndexedDB without delegating to MockAppBackend', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()
    const getProfilesListSpy = vi.spyOn(MockAppBackend.prototype, 'getProfilesList').mockRejectedValue(new Error('should not be used'))

    try {
      await backend.importAppData({
        version: 1,
        exportedAt: '2026-03-12T10:00:00.000Z',
        data: toPersistedAppData(seedData),
      })

      await expect(backend.getProfilesList()).resolves.toEqual({
        items: [
          {
            id: 'profile_2',
            name: 'Job Profile',
            kind: 'job',
            jobId: 'job_2',
            jobSummary: {
              id: 'job_2',
              companyName: 'Another Co',
              jobTitle: 'Staff Engineer',
            },
            createdAt: '2026-03-03T12:00:00.000Z',
            updatedAt: '2026-03-05T12:00:00.000Z',
          },
          {
            id: 'profile_3',
            name: 'Job 1 Profile',
            kind: 'job',
            jobId: 'job_1',
            jobSummary: {
              id: 'job_1',
              companyName: 'Example Co',
              jobTitle: 'Senior Engineer',
            },
            createdAt: '2026-03-02T18:00:00.000Z',
            updatedAt: '2026-03-06T12:00:00.000Z',
          },
          {
            id: 'profile_1',
            name: 'Base Profile',
            kind: 'base',
            jobId: null,
            jobSummary: null,
            createdAt: '2026-03-02T12:00:00.000Z',
            updatedAt: '2026-03-02T12:00:00.000Z',
          },
        ],
        updatedAt: '2026-03-05T12:00:00.000Z',
      })

      await expect(backend.getProfilesList('base')).resolves.toEqual({
        items: [
          {
            id: 'profile_1',
            name: 'Base Profile',
            kind: 'base',
            jobId: null,
            jobSummary: null,
            createdAt: '2026-03-02T12:00:00.000Z',
            updatedAt: '2026-03-02T12:00:00.000Z',
          },
        ],
        updatedAt: '2026-03-02T12:00:00.000Z',
      })

      await expect(backend.getProfilesList('job')).resolves.toEqual({
        items: [
          {
            id: 'profile_2',
            name: 'Job Profile',
            kind: 'job',
            jobId: 'job_2',
            jobSummary: {
              id: 'job_2',
              companyName: 'Another Co',
              jobTitle: 'Staff Engineer',
            },
            createdAt: '2026-03-03T12:00:00.000Z',
            updatedAt: '2026-03-05T12:00:00.000Z',
          },
          {
            id: 'profile_3',
            name: 'Job 1 Profile',
            kind: 'job',
            jobId: 'job_1',
            jobSummary: {
              id: 'job_1',
              companyName: 'Example Co',
              jobTitle: 'Senior Engineer',
            },
            createdAt: '2026-03-02T18:00:00.000Z',
            updatedAt: '2026-03-06T12:00:00.000Z',
          },
        ],
        updatedAt: '2026-03-05T12:00:00.000Z',
      })

      expect(getProfilesListSpy).not.toHaveBeenCalled()
    } finally {
      getProfilesListSpy.mockRestore()
    }
  })

  it('builds the job detail directly from IndexedDB without delegating to MockAppBackend', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()
    const getJobDetailSpy = vi.spyOn(MockAppBackend.prototype, 'getJobDetail').mockRejectedValue(new Error('should not be used'))

    try {
      await backend.importAppData({
        version: 1,
        exportedAt: '2026-03-12T10:00:00.000Z',
        data: toPersistedAppData(seedData),
      })

      await expect(backend.getJobDetail('job_1')).resolves.toEqual({
        job: seedData.jobs.job_1,
        computedStatus: 'interview',
        relatedProfiles: [seedData.profiles.profile_3],
        jobLinks: [seedData.jobLinks.job_link_2, seedData.jobLinks.job_link_1],
        jobContacts: [seedData.jobContacts.job_contact_1, seedData.jobContacts.job_contact_2],
        interviews: [
          {
            interview: seedData.interviews.interview_1,
            contacts: [
              {
                interviewContact: seedData.interviewContacts.interview_contact_2,
                jobContact: seedData.jobContacts.job_contact_1,
              },
              {
                interviewContact: seedData.interviewContacts.interview_contact_1,
                jobContact: seedData.jobContacts.job_contact_2,
              },
            ],
          },
          {
            interview: seedData.interviews.interview_2,
            contacts: [],
          },
        ],
        applicationQuestions: [seedData.applicationQuestions.application_question_2, seedData.applicationQuestions.application_question_1],
      })

      await expect(backend.getJobDetail('missing-job')).resolves.toBeNull()
      expect(getJobDetailSpy).not.toHaveBeenCalled()
    } finally {
      getJobDetailSpy.mockRestore()
    }
  })

  it('builds the profile detail directly from IndexedDB without delegating to MockAppBackend', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()
    const getProfileDetailSpy = vi.spyOn(MockAppBackend.prototype, 'getProfileDetail').mockRejectedValue(new Error('should not be used'))

    try {
      await backend.importAppData({
        version: 1,
        exportedAt: '2026-03-12T10:00:00.000Z',
        data: toPersistedAppData(seedData),
      })

      await expect(backend.getProfileDetail('profile_3')).resolves.toEqual({
        profile: seedData.profiles.profile_3,
        attachedJob: seedData.jobs.job_1,
        profileLinks: [seedData.profileLinks.profile_link_2, seedData.profileLinks.profile_link_1],
        skillCategories: [
          {
            category: seedData.skillCategories.skill_category_2,
            skills: [seedData.skills.skill_3],
          },
          {
            category: seedData.skillCategories.skill_category_1,
            skills: [seedData.skills.skill_2, seedData.skills.skill_1],
          },
        ],
        achievements: [seedData.achievements.achievement_1],
        experienceEntries: [
          {
            entry: seedData.experienceEntries.experience_entry_1,
            bullets: [seedData.experienceBullets.experience_bullet_2, seedData.experienceBullets.experience_bullet_1],
          },
        ],
        educationEntries: [
          {
            entry: seedData.educationEntries.education_entry_1,
            bullets: [seedData.educationBullets.education_bullet_1],
          },
        ],
        projectEntries: [
          {
            entry: seedData.projects.project_1,
            bullets: [seedData.projectBullets.project_bullet_1],
          },
        ],
        additionalExperienceEntries: [
          {
            entry: seedData.additionalExperienceEntries.additional_experience_entry_1,
            bullets: [seedData.additionalExperienceBullets.additional_experience_bullet_1],
          },
        ],
        certifications: [seedData.certifications.certification_1],
        references: [seedData.references.reference_1],
      })

      await expect(backend.getProfileDetail('missing-profile')).resolves.toBeNull()
      expect(getProfileDetailSpy).not.toHaveBeenCalled()
    } finally {
      getProfileDetailSpy.mockRestore()
    }
  })

  it('builds the profile document directly from IndexedDB without delegating to MockAppBackend', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()
    const getProfileDocumentSpy = vi.spyOn(MockAppBackend.prototype, 'getProfileDocument').mockRejectedValue(new Error('should not be used'))

    try {
      await backend.importAppData({
        version: 1,
        exportedAt: '2026-03-12T10:00:00.000Z',
        data: toPersistedAppData(seedData),
      })

      await expect(backend.getProfileDocument('profile_3')).resolves.toEqual({
        profile: seedData.profiles.profile_3,
        profileLinks: [seedData.profileLinks.profile_link_2, seedData.profileLinks.profile_link_1],
        job: seedData.jobs.job_1,
        primaryContact: seedData.jobContacts.job_contact_1,
        contacts: [seedData.jobContacts.job_contact_1, seedData.jobContacts.job_contact_2],
        jobLinks: [seedData.jobLinks.job_link_2, seedData.jobLinks.job_link_1],
        skillCategories: [
          {
            category: seedData.skillCategories.skill_category_2,
            skills: [seedData.skills.skill_3],
          },
          {
            category: seedData.skillCategories.skill_category_1,
            skills: [seedData.skills.skill_2, seedData.skills.skill_1],
          },
        ],
        achievements: [seedData.achievements.achievement_1],
        experienceEntries: [
          {
            entry: seedData.experienceEntries.experience_entry_1,
            bullets: [seedData.experienceBullets.experience_bullet_2, seedData.experienceBullets.experience_bullet_1],
          },
        ],
        educationEntries: [
          {
            entry: seedData.educationEntries.education_entry_1,
            bullets: [seedData.educationBullets.education_bullet_1],
          },
        ],
        projectEntries: [
          {
            entry: seedData.projects.project_1,
            bullets: [seedData.projectBullets.project_bullet_1],
          },
        ],
        additionalExperienceEntries: [
          {
            entry: seedData.additionalExperienceEntries.additional_experience_entry_1,
            bullets: [seedData.additionalExperienceBullets.additional_experience_bullet_1],
          },
        ],
        certifications: [seedData.certifications.certification_1],
        references: [seedData.references.reference_1],
        computedStatus: 'interview',
      })

      await expect(backend.getProfileDocument('profile_1')).resolves.toEqual({
        profile: seedData.profiles.profile_1,
        profileLinks: [],
        job: {
          id: 'document-job-profile_1',
          companyName: 'Example Company',
          jobTitle: 'Example Role',
          description: '',
          location: '',
          postedCompensation: '',
          desiredCompensation: '',
          compensationNotes: '',
          workArrangement: 'unknown',
          employmentType: 'other',
          datePosted: null,
          appliedAt: null,
          finalOutcome: null,
          notes: '',
          createdAt: '2026-03-02T12:00:00.000Z',
          updatedAt: '2026-03-02T12:00:00.000Z',
        },
        primaryContact: {
          id: 'document-contact-document-job-profile_1',
          jobId: 'document-job-profile_1',
          name: 'Hiring Manager',
          title: '',
          company: 'Example Company',
          addressLine1: '123 Example Street',
          addressLine2: '',
          addressLine3: '',
          addressLine4: 'Example City, EX 12345',
          email: '',
          phone: '',
          linkedinUrl: '',
          relationshipType: 'hiring_manager',
          notes: '',
          sortOrder: 0,
        },
        contacts: [],
        jobLinks: [],
        skillCategories: [],
        achievements: [],
        experienceEntries: [],
        educationEntries: [],
        projectEntries: [],
        additionalExperienceEntries: [],
        certifications: [],
        references: [],
        computedStatus: 'interested',
      })

      await expect(backend.getProfileDocument('missing-profile')).resolves.toBeNull()
      expect(getProfileDocumentSpy).not.toHaveBeenCalled()
    } finally {
      getProfileDocumentSpy.mockRestore()
    }
  })
})
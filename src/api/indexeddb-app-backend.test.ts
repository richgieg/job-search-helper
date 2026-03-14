// @vitest-environment jsdom

import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it } from 'vitest'

import { createEmptyAppDataState } from '../domain/app-data-state'
import { createDefaultResumeSettings } from '../domain/profile-defaults'
import type { AppExportFile } from '../types/state'
import type { PersistedAppData } from './indexeddb'
import { deleteAppDatabase } from './indexeddb'
import { IndexedDbAppBackend } from './indexeddb-app-backend'

const databaseName = 'job-search-helper-indexeddb-backend-test'

const toPersistedAppData = (data: ReturnType<typeof createSeedData>): PersistedAppData => {
  const { version: _version, exportedAt: _exportedAt, ...persistedData } = data
  return persistedData
}

const toExpectedDocumentContact = (
  contact: ReturnType<typeof createSeedData>['jobContacts'][string],
  isVirtual = false,
) => ({
  id: contact.id,
  name: contact.name,
  title: contact.title,
  company: contact.company,
  organizationKind: contact.organizationKind,
  addressLine1: contact.addressLine1,
  addressLine2: contact.addressLine2,
  addressLine3: contact.addressLine3,
  addressLine4: contact.addressLine4,
  email: contact.email,
  phone: contact.phone,
  linkedinUrl: contact.linkedinUrl,
  notes: contact.notes,
  sortOrder: contact.sortOrder,
  isVirtual,
})

const createSeedData = () => {
  const data = createEmptyAppDataState()

  data.profiles.profile_1 = {
    id: 'profile_1',
    name: 'Base Profile',
    summary: 'Summary',
    coverLetter: 'Cover letter',
    coverLetterContactId: null,
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
    coverLetterContactId: null,
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
    coverLetterContactId: 'job_contact_2',
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
    staffingAgencyName: '',
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
    createdAt: '2026-03-02T09:00:00.000Z',
    startAt: '2026-03-05T12:00:00.000Z',
    notes: '',
  }

  data.interviews.interview_2 = {
    id: 'interview_2',
    jobId: 'job_1',
    createdAt: '2026-03-04T09:00:00.000Z',
    startAt: null,
    notes: 'Scheduling in progress',
  }

  data.jobContacts.job_contact_1 = {
    id: 'job_contact_1',
    jobId: 'job_1',
    name: 'Hiring Manager',
    title: 'Director',
    company: 'Example Co',
    organizationKind: 'company',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    email: 'manager@example.com',
    phone: '555-0101',
    linkedinUrl: '',
    notes: '',
    sortOrder: 1,
  }

  data.jobContacts.job_contact_2 = {
    id: 'job_contact_2',
    jobId: 'job_1',
    name: 'Recruiter',
    title: 'Recruiter',
    company: 'Example Co',
    organizationKind: 'staffing_agency',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    email: 'recruiter@example.com',
    phone: '555-0102',
    linkedinUrl: '',
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
    staffingAgencyName: '',
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

  it('persists mutations across backend instances', async () => {
    const firstBackend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:00:00.000Z',
    })

    const creationResult = await firstBackend.createJob({
      companyName: 'Persisted Co',
      staffingAgencyName: '',
      jobTitle: 'Platform Engineer',
      location: 'Remote',
    })

    expect(creationResult.createdId).toBeTruthy()

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const jobsList = await secondBackend.getJobsList()

    expect(jobsList.items).toHaveLength(1)
    expect(jobsList.items[0]).toMatchObject({
      companyName: 'Persisted Co',
      staffingAgencyName: '',
      jobTitle: 'Platform Engineer',
    })

    const persistedData = await secondBackend.getAppData()

    expect(Object.keys(persistedData.jobs)).toHaveLength(1)
  })

  it('deletes the database and recreates it seamlessly on the next operation', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T09:00:00.000Z',
      data: toPersistedAppData(createSeedData()),
    })

    await backend.resetLocalData()

    await expect(backend.getDashboardSummary()).resolves.toMatchObject({
      jobCount: 0,
      profileCount: 0,
    })

    await backend.createBaseProfile('Fresh Profile')

    await expect(backend.getDashboardSummary()).resolves.toMatchObject({
      jobCount: 0,
      profileCount: 1,
    })
  })

  it('creates base profiles with a direct IndexedDB write', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:05:00.000Z',
    })

    const result = await backend.createBaseProfile('Direct Profile')
    expect(result.createdId).toBeTruthy()

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const createdProfile = result.createdId ? (await secondBackend.getAppData()).profiles[result.createdId] : null

    expect(createdProfile).toMatchObject({
      name: 'Direct Profile',
      jobId: null,
    })
  })

  it('updates profiles with a direct IndexedDB write', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    await backend.updateProfile({
      profileId: 'profile_3',
      changes: {
        name: 'Updated Job 1 Profile',
        summary: 'Updated summary',
      },
      personalDetails: {
        city: 'Updated City',
      },
    })

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const updatedProfile = (await secondBackend.getAppData()).profiles.profile_3

    expect(updatedProfile).toMatchObject({
      name: 'Updated Job 1 Profile',
      summary: 'Updated summary',
    })
    expect(updatedProfile?.personalDetails.city).toBe('Updated City')
  })

  it('updates jobs with a direct IndexedDB write', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    await backend.updateJob({
      jobId: 'job_1',
      changes: {
        location: 'Updated Remote',
        notes: 'Updated notes',
      },
    })

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const updatedJob = (await secondBackend.getAppData()).jobs.job_1

    expect(updatedJob).toMatchObject({
      location: 'Updated Remote',
      notes: 'Updated notes',
    })
  })

  it('updates profile resume settings with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:10:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    await backend.setDocumentHeaderTemplate({
      profileId: 'profile_3',
      headerTemplate: 'stacked',
    })
    await backend.setResumeSectionEnabled({
      profileId: 'profile_3',
      section: 'projects',
      enabled: false,
    })
    await backend.setResumeSectionLabel({
      profileId: 'profile_3',
      section: 'additional_experience',
      label: 'Volunteer Work',
    })
    await backend.reorderResumeSections({
      profileId: 'profile_3',
      orderedSections: ['projects', 'summary', 'skills', 'achievements', 'experience', 'education', 'additional_experience', 'certifications', 'references'],
    })

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const updatedProfile = (await secondBackend.getAppData()).profiles.profile_3

    expect(updatedProfile?.resumeSettings.headerTemplate).toBe('stacked')
    expect(updatedProfile?.resumeSettings.sections.projects.enabled).toBe(false)
    expect(updatedProfile?.resumeSettings.sections.additional_experience.label).toBe('Volunteer Work')
    expect(updatedProfile?.resumeSettings.sections.projects.sortOrder).toBe(1)
    expect(updatedProfile?.resumeSettings.sections.summary.sortOrder).toBe(2)
  })

  it('updates job progress fields with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:15:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    await backend.setJobAppliedAt({
      jobId: 'job_1',
      appliedAt: '2026-03-13T09:00:00.000Z',
    })
    await backend.setJobFinalOutcome({
      jobId: 'job_1',
      status: 'offer_received',
      setAt: '2026-03-13T11:00:00.000Z',
    })

    let secondBackend = new IndexedDbAppBackend({ databaseName })
    let updatedJob = (await secondBackend.getAppData()).jobs.job_1

    expect(updatedJob?.appliedAt).toBe('2026-03-13T09:00:00.000Z')
    expect(updatedJob?.finalOutcome).toEqual({ status: 'offer_received', setAt: '2026-03-13T11:00:00.000Z' })

    await backend.clearJobFinalOutcome('job_1')
    await backend.clearJobAppliedAt('job_1')

    secondBackend = new IndexedDbAppBackend({ databaseName })
    updatedJob = (await secondBackend.getAppData()).jobs.job_1

    expect(updatedJob?.appliedAt).toBeNull()
    expect(updatedJob?.finalOutcome).toBeNull()
  })

  it('updates profile links with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:20:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const creationResult = await backend.createProfileLink('profile_3')
    expect(creationResult.createdId).toBeTruthy()

    await backend.updateProfileLink({
      profileLinkId: 'profile_link_2',
      changes: {
        name: 'GitHub Updated',
        url: 'https://github.com/example-updated',
        enabled: false,
      },
    })

    await backend.reorderProfileLinks({
      profileId: 'profile_3',
      orderedIds: [creationResult.createdId!, 'profile_link_2', 'profile_link_1'],
    })

    await backend.deleteProfileLink('profile_link_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const profileLinks = Object.values(persistedData.profileLinks).filter((profileLink) => profileLink.profileId === 'profile_3')

    expect(profileLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: creationResult.createdId,
          profileId: 'profile_3',
          sortOrder: 1,
          name: '',
          url: '',
          enabled: true,
        }),
        expect.objectContaining({
          id: 'profile_link_2',
          profileId: 'profile_3',
          sortOrder: 2,
          name: 'GitHub Updated',
          url: 'https://github.com/example-updated',
          enabled: false,
        }),
      ]),
    )
    expect(profileLinks.find((profileLink) => profileLink.id === 'profile_link_1')).toBeUndefined()
    expect(persistedData.profiles.profile_3?.updatedAt).toBe('2026-03-13T16:20:00.000Z')
  })

  it('updates job links with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:25:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const creationResult = await backend.createJobLink('job_1')
    expect(creationResult.createdId).toBeTruthy()

    await backend.updateJobLink({
      jobLinkId: 'job_link_2',
      changes: {
        url: 'https://example.com/job-1-updated',
      },
    })

    await backend.reorderJobLinks({
      jobId: 'job_1',
      orderedIds: [creationResult.createdId!, 'job_link_2', 'job_link_1'],
    })

    await backend.deleteJobLink('job_link_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const jobLinks = Object.values(persistedData.jobLinks).filter((jobLink) => jobLink.jobId === 'job_1')

    expect(jobLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: creationResult.createdId,
          jobId: 'job_1',
          sortOrder: 1,
          url: '',
          createdAt: '2026-03-13T16:25:00.000Z',
        }),
        expect.objectContaining({
          id: 'job_link_2',
          jobId: 'job_1',
          sortOrder: 2,
          url: 'https://example.com/job-1-updated',
        }),
      ]),
    )
    expect(jobLinks.find((jobLink) => jobLink.id === 'job_link_1')).toBeUndefined()
    expect(persistedData.jobs.job_1?.updatedAt).toBe('2026-03-13T16:25:00.000Z')
  })

  it('updates job contacts with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:30:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const creationResult = await backend.createJobContact('job_1')
    expect(creationResult.createdId).toBeTruthy()

    await backend.updateJobContact({
      jobContactId: 'job_contact_1',
      changes: {
        name: 'Hiring Manager Updated',
        email: 'updated-manager@example.com',
      },
    })

    await backend.reorderJobContacts({
      jobId: 'job_1',
      orderedIds: [creationResult.createdId!, 'job_contact_1', 'job_contact_2'],
    })

    await backend.deleteJobContact('job_contact_2')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const jobContacts = Object.values(persistedData.jobContacts).filter((jobContact) => jobContact.jobId === 'job_1')

    expect(jobContacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: creationResult.createdId,
          jobId: 'job_1',
          sortOrder: 1,
          company: 'Example Co',
          name: '',
          email: '',
          organizationKind: 'company',
        }),
        expect.objectContaining({
          id: 'job_contact_1',
          jobId: 'job_1',
          sortOrder: 2,
          name: 'Hiring Manager Updated',
          email: 'updated-manager@example.com',
        }),
      ]),
    )
    expect(jobContacts.find((jobContact) => jobContact.id === 'job_contact_2')).toBeUndefined()
    expect(jobContacts.find((jobContact) => jobContact.id === creationResult.createdId)).toMatchObject({
      company: 'Example Co',
      organizationKind: 'company',
    })
    expect(persistedData.interviewContacts.interview_contact_1).toBeUndefined()
    expect(persistedData.interviewContacts.interview_contact_2).toMatchObject({
      id: 'interview_contact_2',
      jobContactId: 'job_contact_1',
    })
    expect(persistedData.jobs.job_1?.updatedAt).toBe('2026-03-13T16:30:00.000Z')
  })

  it('updates application questions with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:35:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const creationResult = await backend.createApplicationQuestion('job_1')
    expect(creationResult.createdId).toBeTruthy()

    await backend.updateApplicationQuestion({
      applicationQuestionId: 'application_question_2',
      changes: {
        question: 'Why this company updated?',
        answer: 'Even stronger mission alignment',
      },
    })

    await backend.reorderApplicationQuestions({
      jobId: 'job_1',
      orderedIds: [creationResult.createdId!, 'application_question_2', 'application_question_1'],
    })

    await backend.deleteApplicationQuestion('application_question_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const applicationQuestions = Object.values(persistedData.applicationQuestions).filter(
      (applicationQuestion) => applicationQuestion.jobId === 'job_1',
    )

    expect(applicationQuestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: creationResult.createdId,
          jobId: 'job_1',
          sortOrder: 1,
          question: '',
          answer: '',
        }),
        expect.objectContaining({
          id: 'application_question_2',
          jobId: 'job_1',
          sortOrder: 2,
          question: 'Why this company updated?',
          answer: 'Even stronger mission alignment',
        }),
      ]),
    )
    expect(applicationQuestions.find((applicationQuestion) => applicationQuestion.id === 'application_question_1')).toBeUndefined()
    expect(persistedData.jobs.job_1?.updatedAt).toBe('2026-03-13T16:35:00.000Z')
  })

  it('updates simple profile child collections with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:40:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const createdAchievement = await backend.createAchievement('profile_3')
    const createdCertification = await backend.createCertification('profile_3')
    const createdReference = await backend.createReference('profile_3')

    expect(createdAchievement.createdId).toBeTruthy()
    expect(createdCertification.createdId).toBeTruthy()
    expect(createdReference.createdId).toBeTruthy()

    await backend.updateAchievement({
      achievementId: createdAchievement.createdId!,
      changes: {
        name: 'New Achievement',
        description: 'Created directly in IndexedDB',
        enabled: false,
      },
    })
    await backend.reorderAchievements({
      profileId: 'profile_3',
      orderedIds: [createdAchievement.createdId!, 'achievement_1'],
    })
    await backend.deleteAchievement('achievement_1')

    await backend.updateCertification({
      certificationId: createdCertification.createdId!,
      changes: {
        name: 'IndexedDB Cert',
        issuer: 'Testing Board',
        credentialId: 'idx-001',
      },
    })
    await backend.reorderCertifications({
      profileId: 'profile_3',
      orderedIds: [createdCertification.createdId!, 'certification_1'],
    })
    await backend.deleteCertification('certification_1')

    await backend.updateReference({
      referenceId: createdReference.createdId!,
      changes: {
        name: 'Direct Reference',
        relationship: 'Colleague',
        email: 'reference@example.com',
      },
    })
    await backend.reorderReferences({
      profileId: 'profile_3',
      orderedIds: [createdReference.createdId!, 'reference_1'],
    })
    await backend.deleteReference('reference_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()

    expect(Object.values(persistedData.achievements).filter((item) => item.profileId === 'profile_3')).toEqual([
      expect.objectContaining({
        id: createdAchievement.createdId,
        profileId: 'profile_3',
        sortOrder: 1,
        name: 'New Achievement',
        description: 'Created directly in IndexedDB',
        enabled: false,
      }),
    ])

    expect(Object.values(persistedData.certifications).filter((item) => item.profileId === 'profile_3')).toEqual([
      expect.objectContaining({
        id: createdCertification.createdId,
        profileId: 'profile_3',
        sortOrder: 1,
        name: 'IndexedDB Cert',
        issuer: 'Testing Board',
        credentialId: 'idx-001',
      }),
    ])

    expect(Object.values(persistedData.references).filter((item) => item.profileId === 'profile_3')).toEqual([
      expect.objectContaining({
        id: createdReference.createdId,
        profileId: 'profile_3',
        sortOrder: 1,
        name: 'Direct Reference',
        relationship: 'Colleague',
        email: 'reference@example.com',
      }),
    ])

    expect(persistedData.profiles.profile_3?.updatedAt).toBe('2026-03-13T16:40:00.000Z')
  })

  it('updates skill categories and skills with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:45:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const createdCategory = await backend.createSkillCategory('profile_3')
    expect(createdCategory.createdId).toBeTruthy()

    await backend.updateSkillCategory({
      skillCategoryId: 'skill_category_2',
      changes: {
        name: 'Frameworks Updated',
        enabled: false,
      },
    })

    await backend.reorderSkillCategories({
      profileId: 'profile_3',
      orderedIds: [createdCategory.createdId!, 'skill_category_2', 'skill_category_1'],
    })

    const createdSkill = await backend.createSkill(createdCategory.createdId!)
    expect(createdSkill.createdId).toBeTruthy()

    await backend.updateSkill({
      skillId: 'skill_1',
      changes: {
        name: 'TypeScript Updated',
        enabled: false,
      },
    })

    await backend.reorderSkills('skill_category_1', ['skill_1', 'skill_2'])
    await backend.deleteSkill('skill_2')
    await backend.deleteSkillCategory('skill_category_2')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const skillCategories = Object.values(persistedData.skillCategories).filter((item) => item.profileId === 'profile_3')
    const skills = Object.values(persistedData.skills)

    expect(skillCategories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdCategory.createdId,
          profileId: 'profile_3',
          sortOrder: 1,
          name: '',
          enabled: true,
        }),
        expect.objectContaining({
          id: 'skill_category_1',
          profileId: 'profile_3',
          sortOrder: 3,
          name: 'Languages',
          enabled: true,
        }),
      ]),
    )
    expect(skillCategories.find((item) => item.id === 'skill_category_2')).toBeUndefined()

    expect(skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdSkill.createdId,
          skillCategoryId: createdCategory.createdId,
          sortOrder: 1,
          name: '',
          enabled: true,
        }),
        expect.objectContaining({
          id: 'skill_1',
          skillCategoryId: 'skill_category_1',
          sortOrder: 1,
          name: 'TypeScript Updated',
          enabled: false,
        }),
      ]),
    )
    expect(skills.find((item) => item.id === 'skill_2')).toBeUndefined()
    expect(skills.find((item) => item.id === 'skill_3')).toBeUndefined()
    expect(persistedData.profiles.profile_3?.updatedAt).toBe('2026-03-13T16:45:00.000Z')
  })

  it('updates experience entries and bullets with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:50:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const createdEntry = await backend.createExperienceEntry('profile_3')
    expect(createdEntry.createdId).toBeTruthy()

    await backend.updateExperienceEntry({
      experienceEntryId: 'experience_entry_1',
      changes: {
        company: 'Example Co Updated',
        title: 'Senior Engineer',
        isCurrent: true,
        endDate: '2025-01-01',
      },
    })

    await backend.reorderExperienceEntries({
      profileId: 'profile_3',
      orderedIds: [createdEntry.createdId!, 'experience_entry_1'],
    })

    const createdBullet = await backend.createExperienceBullet(createdEntry.createdId!)
    expect(createdBullet.createdId).toBeTruthy()

    await backend.updateExperienceBullet({
      experienceBulletId: 'experience_bullet_1',
      changes: {
        content: 'Built feature flags updated',
        level: 2,
        enabled: false,
      },
    })

    await backend.reorderExperienceBullets({
      experienceEntryId: 'experience_entry_1',
      orderedIds: ['experience_bullet_1', 'experience_bullet_2'],
    })

    await backend.deleteExperienceBullet('experience_bullet_2')
    await backend.deleteExperienceEntry('experience_entry_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const experienceEntries = Object.values(persistedData.experienceEntries).filter((item) => item.profileId === 'profile_3')
    const experienceBullets = Object.values(persistedData.experienceBullets)

    expect(experienceEntries).toEqual([
      expect.objectContaining({
        id: createdEntry.createdId,
        profileId: 'profile_3',
        sortOrder: 1,
        company: '',
        title: '',
        isCurrent: false,
      }),
    ])

    expect(experienceBullets).toEqual([
      expect.objectContaining({
        id: createdBullet.createdId,
        experienceEntryId: createdEntry.createdId,
        sortOrder: 1,
        content: '',
        level: 1,
        enabled: true,
      }),
    ])

    expect(persistedData.experienceEntries.experience_entry_1).toBeUndefined()
    expect(persistedData.experienceBullets.experience_bullet_1).toBeUndefined()
    expect(persistedData.experienceBullets.experience_bullet_2).toBeUndefined()
    expect(persistedData.profiles.profile_3?.updatedAt).toBe('2026-03-13T16:50:00.000Z')
  })

  it('updates education entries and bullets with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T16:55:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const createdEntry = await backend.createEducationEntry('profile_3')
    expect(createdEntry.createdId).toBeTruthy()

    await backend.updateEducationEntry({
      educationEntryId: 'education_entry_1',
      changes: {
        school: 'State University Updated',
        degree: 'MS Computer Science',
        status: 'in_progress',
      },
    })

    await backend.reorderEducationEntries({
      profileId: 'profile_3',
      orderedIds: [createdEntry.createdId!, 'education_entry_1'],
    })

    const createdBullet = await backend.createEducationBullet(createdEntry.createdId!)
    expect(createdBullet.createdId).toBeTruthy()

    await backend.updateEducationBullet({
      educationBulletId: 'education_bullet_1',
      changes: {
        content: 'Dean\'s list updated',
        level: 2,
        enabled: false,
      },
    })

    await backend.reorderEducationBullets({
      educationEntryId: 'education_entry_1',
      orderedIds: ['education_bullet_1'],
    })

    await backend.deleteEducationBullet('education_bullet_1')
    await backend.deleteEducationEntry('education_entry_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const educationEntries = Object.values(persistedData.educationEntries).filter((item) => item.profileId === 'profile_3')
    const educationBullets = Object.values(persistedData.educationBullets)

    expect(educationEntries).toEqual([
      expect.objectContaining({
        id: createdEntry.createdId,
        profileId: 'profile_3',
        sortOrder: 1,
        school: '',
        degree: '',
        status: 'graduated',
      }),
    ])

    expect(educationBullets).toEqual([
      expect.objectContaining({
        id: createdBullet.createdId,
        educationEntryId: createdEntry.createdId,
        sortOrder: 1,
        content: '',
        level: 1,
        enabled: true,
      }),
    ])

    expect(persistedData.educationEntries.education_entry_1).toBeUndefined()
    expect(persistedData.educationBullets.education_bullet_1).toBeUndefined()
    expect(persistedData.profiles.profile_3?.updatedAt).toBe('2026-03-13T16:55:00.000Z')
  })

  it('updates project entries and bullets with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T17:00:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const createdProject = await backend.createProject('profile_3')
    expect(createdProject.createdId).toBeTruthy()

    await backend.updateProject({
      projectId: 'project_1',
      changes: {
        name: 'Internal Tooling Updated',
        organization: 'Example Co Updated',
      },
    })

    await backend.reorderProjects({
      profileId: 'profile_3',
      orderedIds: [createdProject.createdId!, 'project_1'],
    })

    const createdBullet = await backend.createProjectBullet(createdProject.createdId!)
    expect(createdBullet.createdId).toBeTruthy()

    await backend.updateProjectBullet({
      projectBulletId: 'project_bullet_1',
      changes: {
        content: 'Built a release automation dashboard updated',
        level: 2,
        enabled: false,
      },
    })

    await backend.reorderProjectBullets({
      projectId: 'project_1',
      orderedIds: ['project_bullet_1'],
    })

    await backend.deleteProjectBullet('project_bullet_1')
    await backend.deleteProject('project_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const projects = Object.values(persistedData.projects).filter((item) => item.profileId === 'profile_3')
    const projectBullets = Object.values(persistedData.projectBullets)

    expect(projects).toEqual([
      expect.objectContaining({
        id: createdProject.createdId,
        profileId: 'profile_3',
        sortOrder: 1,
        name: '',
        organization: '',
      }),
    ])

    expect(projectBullets).toEqual([
      expect.objectContaining({
        id: createdBullet.createdId,
        projectId: createdProject.createdId,
        sortOrder: 1,
        content: '',
        level: 1,
        enabled: true,
      }),
    ])

    expect(persistedData.projects.project_1).toBeUndefined()
    expect(persistedData.projectBullets.project_bullet_1).toBeUndefined()
    expect(persistedData.profiles.profile_3?.updatedAt).toBe('2026-03-13T17:00:00.000Z')
  })

  it('updates additional experience entries and bullets with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T17:05:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const createdEntry = await backend.createAdditionalExperienceEntry('profile_3')
    expect(createdEntry.createdId).toBeTruthy()

    await backend.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: 'additional_experience_entry_1',
      changes: {
        title: 'Volunteer Mentor Updated',
        organization: 'Code Club Updated',
      },
    })

    await backend.reorderAdditionalExperienceEntries({
      profileId: 'profile_3',
      orderedIds: [createdEntry.createdId!, 'additional_experience_entry_1'],
    })

    const createdBullet = await backend.createAdditionalExperienceBullet(createdEntry.createdId!)
    expect(createdBullet.createdId).toBeTruthy()

    await backend.updateAdditionalExperienceBullet({
      additionalExperienceBulletId: 'additional_experience_bullet_1',
      changes: {
        content: 'Mentored junior developers updated',
        level: 2,
        enabled: false,
      },
    })

    await backend.reorderAdditionalExperienceBullets({
      additionalExperienceEntryId: 'additional_experience_entry_1',
      orderedIds: ['additional_experience_bullet_1'],
    })

    await backend.deleteAdditionalExperienceBullet('additional_experience_bullet_1')
    await backend.deleteAdditionalExperienceEntry('additional_experience_entry_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const additionalExperienceEntries = Object.values(persistedData.additionalExperienceEntries).filter((item) => item.profileId === 'profile_3')
    const additionalExperienceBullets = Object.values(persistedData.additionalExperienceBullets)

    expect(additionalExperienceEntries).toEqual([
      expect.objectContaining({
        id: createdEntry.createdId,
        profileId: 'profile_3',
        sortOrder: 1,
        title: '',
        organization: '',
      }),
    ])

    expect(additionalExperienceBullets).toEqual([
      expect.objectContaining({
        id: createdBullet.createdId,
        additionalExperienceEntryId: createdEntry.createdId,
        sortOrder: 1,
        content: '',
        level: 1,
        enabled: true,
      }),
    ])

    expect(persistedData.additionalExperienceEntries.additional_experience_entry_1).toBeUndefined()
    expect(persistedData.additionalExperienceBullets.additional_experience_bullet_1).toBeUndefined()
    expect(persistedData.profiles.profile_3?.updatedAt).toBe('2026-03-13T17:05:00.000Z')
  })

  it('updates interviews and interview contacts with direct IndexedDB writes', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T17:10:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const createdInterview = await backend.createInterview('job_1')
    expect(createdInterview.createdId).toBeTruthy()

    await backend.updateInterview({
      interviewId: 'interview_2',
      changes: {
        startAt: '2026-03-10T12:00:00.000Z',
        notes: 'Scheduled',
      },
    })

    const addContactResult = await backend.addInterviewContact({
      interviewId: 'interview_2',
      jobContactId: 'job_contact_1',
    })
    expect(addContactResult.data).toBeTruthy()

    await backend.reorderInterviewContacts({
      interviewId: 'interview_1',
      orderedIds: ['interview_contact_1', 'interview_contact_2'],
    })

    await backend.removeInterviewContact('interview_contact_2')
    await backend.deleteInterview('interview_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const interviews = Object.values(persistedData.interviews).filter((item) => item.jobId === 'job_1')
    const interviewContacts = Object.values(persistedData.interviewContacts)

    expect(interviews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdInterview.createdId,
          jobId: 'job_1',
          createdAt: '2026-03-13T17:10:00.000Z',
          startAt: null,
          notes: '',
        }),
        expect.objectContaining({
          id: 'interview_2',
          jobId: 'job_1',
          startAt: '2026-03-10T12:00:00.000Z',
          notes: 'Scheduled',
        }),
      ]),
    )
    expect(interviews.find((item) => item.id === 'interview_1')).toBeUndefined()

    expect(interviewContacts).toEqual([
      expect.objectContaining({
        interviewId: 'interview_2',
        jobContactId: 'job_contact_1',
        sortOrder: 1,
      }),
    ])
    expect(persistedData.interviewContacts.interview_contact_1).toBeUndefined()
    expect(persistedData.interviewContacts.interview_contact_2).toBeUndefined()
    expect(persistedData.jobs.job_1?.updatedAt).toBe('2026-03-13T17:10:00.000Z')
  })

  it('deletes jobs with a direct IndexedDB cascade', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    await backend.deleteJob('job_1')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()

    expect(persistedData.jobs.job_1).toBeUndefined()
    expect(persistedData.profiles.profile_3).toBeUndefined()
    expect(persistedData.jobLinks.job_link_1).toBeUndefined()
    expect(persistedData.jobLinks.job_link_2).toBeUndefined()
    expect(persistedData.jobContacts.job_contact_1).toBeUndefined()
    expect(persistedData.jobContacts.job_contact_2).toBeUndefined()
    expect(persistedData.interviews.interview_1).toBeUndefined()
    expect(persistedData.interviews.interview_2).toBeUndefined()
    expect(persistedData.interviewContacts.interview_contact_1).toBeUndefined()
    expect(persistedData.interviewContacts.interview_contact_2).toBeUndefined()
    expect(persistedData.applicationQuestions.application_question_1).toBeUndefined()
    expect(persistedData.applicationQuestions.application_question_2).toBeUndefined()
    expect(persistedData.profileLinks.profile_link_1).toBeUndefined()
    expect(persistedData.profileLinks.profile_link_2).toBeUndefined()
    expect(persistedData.skillCategories.skill_category_1).toBeUndefined()
    expect(persistedData.skillCategories.skill_category_2).toBeUndefined()
    expect(persistedData.skills.skill_1).toBeUndefined()
    expect(persistedData.skills.skill_2).toBeUndefined()
    expect(persistedData.skills.skill_3).toBeUndefined()
    expect(persistedData.achievements.achievement_1).toBeUndefined()
    expect(persistedData.experienceEntries.experience_entry_1).toBeUndefined()
    expect(persistedData.experienceBullets.experience_bullet_1).toBeUndefined()
    expect(persistedData.experienceBullets.experience_bullet_2).toBeUndefined()
    expect(persistedData.educationEntries.education_entry_1).toBeUndefined()
    expect(persistedData.educationBullets.education_bullet_1).toBeUndefined()
    expect(persistedData.projects.project_1).toBeUndefined()
    expect(persistedData.projectBullets.project_bullet_1).toBeUndefined()
    expect(persistedData.additionalExperienceEntries.additional_experience_entry_1).toBeUndefined()
    expect(persistedData.additionalExperienceBullets.additional_experience_bullet_1).toBeUndefined()
    expect(persistedData.certifications.certification_1).toBeUndefined()
    expect(persistedData.references.reference_1).toBeUndefined()

    expect(persistedData.jobs.job_2).toMatchObject({ id: 'job_2' })
    expect(persistedData.profiles.profile_1).toMatchObject({ id: 'profile_1' })
    expect(persistedData.profiles.profile_2).toMatchObject({ id: 'profile_2' })
  })

  it('deletes profiles with a direct IndexedDB cascade', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    await backend.deleteProfile('profile_3')

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()

    expect(persistedData.profiles.profile_3).toBeUndefined()
    expect(persistedData.profileLinks.profile_link_1).toBeUndefined()
    expect(persistedData.profileLinks.profile_link_2).toBeUndefined()
    expect(persistedData.skillCategories.skill_category_1).toBeUndefined()
    expect(persistedData.skillCategories.skill_category_2).toBeUndefined()
    expect(persistedData.skills.skill_1).toBeUndefined()
    expect(persistedData.skills.skill_2).toBeUndefined()
    expect(persistedData.skills.skill_3).toBeUndefined()
    expect(persistedData.achievements.achievement_1).toBeUndefined()
    expect(persistedData.experienceEntries.experience_entry_1).toBeUndefined()
    expect(persistedData.experienceBullets.experience_bullet_1).toBeUndefined()
    expect(persistedData.experienceBullets.experience_bullet_2).toBeUndefined()
    expect(persistedData.educationEntries.education_entry_1).toBeUndefined()
    expect(persistedData.educationBullets.education_bullet_1).toBeUndefined()
    expect(persistedData.projects.project_1).toBeUndefined()
    expect(persistedData.projectBullets.project_bullet_1).toBeUndefined()
    expect(persistedData.additionalExperienceEntries.additional_experience_entry_1).toBeUndefined()
    expect(persistedData.additionalExperienceBullets.additional_experience_bullet_1).toBeUndefined()
    expect(persistedData.certifications.certification_1).toBeUndefined()
    expect(persistedData.references.reference_1).toBeUndefined()

    expect(persistedData.jobs.job_1).toMatchObject({ id: 'job_1' })
    expect(persistedData.profiles.profile_1).toMatchObject({ id: 'profile_1' })
    expect(persistedData.profiles.profile_2).toMatchObject({ id: 'profile_2' })
  })

  it('duplicates profiles with a direct IndexedDB clone', async () => {
    const backend = new IndexedDbAppBackend({
      databaseName,
      now: () => '2026-03-13T17:15:00.000Z',
    })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const result = await backend.duplicateProfile({
      sourceProfileId: 'profile_3',
      name: 'Profile 3 Copy',
    })

    expect(result.createdId).toBeTruthy()

    const secondBackend = new IndexedDbAppBackend({ databaseName })
    const persistedData = await secondBackend.getAppData()
    const duplicatedProfile = result.createdId ? persistedData.profiles[result.createdId] : undefined

    expect(duplicatedProfile).toMatchObject({
      name: 'Profile 3 Copy',
      jobId: 'job_1',
      coverLetterContactId: 'job_contact_2',
      clonedFromProfileId: 'profile_3',
      createdAt: '2026-03-13T17:15:00.000Z',
      updatedAt: '2026-03-13T17:15:00.000Z',
    })

    const duplicatedProfileId = result.createdId!
    expect(Object.values(persistedData.profileLinks).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(2)
    expect(Object.values(persistedData.skillCategories).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(2)
    expect(
      Object.values(persistedData.skills).filter((item) => {
        const category = persistedData.skillCategories[item.skillCategoryId]
        return category?.profileId === duplicatedProfileId
      }),
    ).toHaveLength(3)
    expect(Object.values(persistedData.achievements).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)
    expect(Object.values(persistedData.experienceEntries).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)
    expect(
      Object.values(persistedData.experienceBullets).filter((item) => {
        const entry = persistedData.experienceEntries[item.experienceEntryId]
        return entry?.profileId === duplicatedProfileId
      }),
    ).toHaveLength(2)
    expect(Object.values(persistedData.educationEntries).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)
    expect(Object.values(persistedData.projects).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)
    expect(Object.values(persistedData.additionalExperienceEntries).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)
    expect(Object.values(persistedData.certifications).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)
    expect(Object.values(persistedData.references).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)
  })

  it('builds the jobs list directly from IndexedDB', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

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
          staffingAgencyName: '',
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
          staffingAgencyName: '',
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
  })

  it('builds the dashboard summary directly from IndexedDB', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

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
  })

  it('builds the profiles list directly from IndexedDB', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

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
            staffingAgencyName: '',
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
            staffingAgencyName: '',
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
            staffingAgencyName: '',
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
            staffingAgencyName: '',
            jobTitle: 'Senior Engineer',
          },
          createdAt: '2026-03-02T18:00:00.000Z',
          updatedAt: '2026-03-06T12:00:00.000Z',
        },
      ],
      updatedAt: '2026-03-05T12:00:00.000Z',
    })
  })

  it('builds the job detail directly from IndexedDB', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

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
  })

  it('builds the profile detail directly from IndexedDB', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

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
  })

  it('builds the profile document directly from IndexedDB', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    await expect(backend.getProfileDocument('profile_3')).resolves.toEqual({
      profile: seedData.profiles.profile_3,
      profileLinks: [seedData.profileLinks.profile_link_2, seedData.profileLinks.profile_link_1],
      job: seedData.jobs.job_1,
      primaryContact: toExpectedDocumentContact(seedData.jobContacts.job_contact_2!),
      contacts: [
        toExpectedDocumentContact(seedData.jobContacts.job_contact_1!),
        toExpectedDocumentContact(seedData.jobContacts.job_contact_2!),
        {
          id: 'companyHiringManager',
          name: 'Hiring Manager',
          title: '',
          company: 'Example Co',
          organizationKind: 'company',
          addressLine1: '',
          addressLine2: '',
          addressLine3: '',
          addressLine4: '',
          email: '',
          phone: '',
          linkedinUrl: '',
          notes: '',
          sortOrder: 0,
          isVirtual: true,
        },
        {
          id: 'staffingAgencyRecruitingTeam',
          name: 'Recruiting Team',
          title: '',
          company: '',
          organizationKind: 'staffing_agency',
          addressLine1: '',
          addressLine2: '',
          addressLine3: '',
          addressLine4: '',
          email: '',
          phone: '',
          linkedinUrl: '',
          notes: '',
          sortOrder: 0,
          isVirtual: true,
        },
      ],
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
        staffingAgencyName: 'Example Staffing Agency',
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
        id: 'companyHiringManager',
        name: 'Hiring Manager',
        title: '',
        company: 'Example Company',
        organizationKind: 'company',
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        addressLine4: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        notes: '',
        sortOrder: 0,
        isVirtual: true,
      },
      contacts: [
        {
          id: 'companyHiringManager',
          name: 'Hiring Manager',
          title: '',
          company: 'Example Company',
          organizationKind: 'company',
          addressLine1: '',
          addressLine2: '',
          addressLine3: '',
          addressLine4: '',
          email: '',
          phone: '',
          linkedinUrl: '',
          notes: '',
          sortOrder: 0,
          isVirtual: true,
        },
        {
          id: 'staffingAgencyRecruitingTeam',
          name: 'Recruiting Team',
          title: '',
          company: 'Example Staffing Agency',
          organizationKind: 'staffing_agency',
          addressLine1: '',
          addressLine2: '',
          addressLine3: '',
          addressLine4: '',
          email: '',
          phone: '',
          linkedinUrl: '',
          notes: '',
          sortOrder: 0,
          isVirtual: true,
        },
      ],
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
  })

  it('falls back to the company recipient when the selected recipient is missing', async () => {
    const backend = new IndexedDbAppBackend({ databaseName })
    const seedData = createSeedData()
    seedData.profiles.profile_3!.coverLetterContactId = 'missing-contact'

    await backend.importAppData({
      version: 1,
      exportedAt: '2026-03-12T10:00:00.000Z',
      data: toPersistedAppData(seedData),
    })

    const document = await backend.getProfileDocument('profile_3')

    expect(document?.primaryContact).toEqual({
      id: 'companyHiringManager',
      name: 'Hiring Manager',
      title: '',
      company: 'Example Co',
      organizationKind: 'company',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      addressLine4: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      notes: '',
      sortOrder: 0,
      isVirtual: true,
    })
  })
})
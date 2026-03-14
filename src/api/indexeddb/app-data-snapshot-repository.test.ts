// @vitest-environment jsdom

import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it } from 'vitest'

import { createEmptyAppDataState } from '../../domain/app-data-state'
import { createDefaultResumeSettings } from '../../domain/profile-defaults'
import { createIndexedDbAppDataSnapshotRepository } from './app-data-snapshot-repository'
import { deleteAppDatabase } from './database'

const databaseName = 'job-search-helper-indexeddb-repository-test'

const toPersistedAppData = <T extends { version: 1 }>(data: T) => {
  const { version: _version, ...persistedData } = data
  return persistedData
}

const createSeedData = () => {
  const data = createEmptyAppDataState()

  data.jobs.job_1 = {
    id: 'job_1',
    companyName: 'Example Co',
    staffingAgencyName: '',
    jobTitle: 'Senior Engineer',
    description: 'Build systems',
    location: 'Remote',
    postedCompensation: '',
    desiredCompensation: '',
    compensationNotes: '',
    workArrangement: 'remote',
    employmentType: 'full_time',
    datePosted: '2026-03-01',
    appliedAt: null,
    finalOutcome: null,
    notes: 'Important role',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  data.jobLinks.job_link_1 = {
    id: 'job_link_1',
    jobId: 'job_1',
    url: 'https://jobs.example.com/1',
    sortOrder: 1,
    createdAt: '2026-03-01T12:00:00.000Z',
  }

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
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  return data
}

afterEach(async () => {
  await deleteAppDatabase({ databaseName })
})

describe('IndexedDB app data snapshot repository', () => {
  it('round-trips a full normalized app snapshot', async () => {
    const repository = createIndexedDbAppDataSnapshotRepository({
      databaseName,
      now: () => '2026-03-13T10:00:00.000Z',
    })
    const seedData = createSeedData()
    const persistedSeedData = toPersistedAppData(seedData)

    await repository.replaceAppData(persistedSeedData)

    await expect(repository.readAppData()).resolves.toEqual({
      ...seedData,
    })

    await expect(repository.exportAppData()).resolves.toEqual({
      version: 1,
      exportedAt: '2026-03-13T10:00:00.000Z',
      data: persistedSeedData,
    })
  })

  it('clears removed records during replace to support import-style rebuilds', async () => {
    const repository = createIndexedDbAppDataSnapshotRepository({ databaseName })
    const firstSeed = createSeedData()
    const replacement = createEmptyAppDataState()
    const firstPersistedSeed = toPersistedAppData(firstSeed)

    replacement.jobs.job_2 = {
      id: 'job_2',
      companyName: 'Replacement Co',
      staffingAgencyName: '',
      jobTitle: 'Platform Engineer',
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
      createdAt: '2026-03-03T12:00:00.000Z',
      updatedAt: '2026-03-03T12:00:00.000Z',
    }

    await repository.replaceAppData(firstPersistedSeed)
    await repository.replaceAppData(toPersistedAppData(replacement))

    await expect(repository.readAppData()).resolves.toEqual({
      ...replacement,
    })
  })
})
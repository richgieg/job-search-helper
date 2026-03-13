import type { AppDataState } from '../../types/state'

export const appDatabaseName = 'job-search-helper'
export const appDatabaseVersion = 1

export const metadataStoreName = 'metadata'

export const appStoreNames = [
  'profiles',
  'profileLinks',
  'skillCategories',
  'skills',
  'achievements',
  'experienceEntries',
  'experienceBullets',
  'educationEntries',
  'educationBullets',
  'projects',
  'projectBullets',
  'additionalExperienceEntries',
  'additionalExperienceBullets',
  'certifications',
  'references',
  'jobs',
  'jobLinks',
  'jobContacts',
  'interviews',
  'interviewContacts',
  'applicationQuestions',
] as const satisfies readonly (keyof Omit<AppDataState, 'version' | 'exportedAt'>)[]

export type AppStoreName = (typeof appStoreNames)[number]
export type DatabaseStoreName = AppStoreName | typeof metadataStoreName

export interface StoreIndexDefinition {
  name: string
  keyPath: string | string[]
  options?: IDBIndexParameters
}

export interface StoreDefinition {
  name: DatabaseStoreName
  keyPath: string
  indexes?: readonly StoreIndexDefinition[]
}

const sortableForeignKeyIndex = (foreignKey: string) => ({
  name: `${foreignKey}_sortOrder`,
  keyPath: [foreignKey, 'sortOrder'],
})

export const appStoreDefinitions: readonly StoreDefinition[] = [
  {
    name: metadataStoreName,
    keyPath: 'key',
  },
  {
    name: 'profiles',
    keyPath: 'id',
    indexes: [
      { name: 'jobId', keyPath: 'jobId' },
      { name: 'clonedFromProfileId', keyPath: 'clonedFromProfileId' },
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'name', keyPath: 'name' },
    ],
  },
  {
    name: 'profileLinks',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'skillCategories',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'skills',
    keyPath: 'id',
    indexes: [{ name: 'skillCategoryId', keyPath: 'skillCategoryId' }, sortableForeignKeyIndex('skillCategoryId')],
  },
  {
    name: 'achievements',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'experienceEntries',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'experienceBullets',
    keyPath: 'id',
    indexes: [{ name: 'experienceEntryId', keyPath: 'experienceEntryId' }, sortableForeignKeyIndex('experienceEntryId')],
  },
  {
    name: 'educationEntries',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'educationBullets',
    keyPath: 'id',
    indexes: [{ name: 'educationEntryId', keyPath: 'educationEntryId' }, sortableForeignKeyIndex('educationEntryId')],
  },
  {
    name: 'projects',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'projectBullets',
    keyPath: 'id',
    indexes: [{ name: 'projectId', keyPath: 'projectId' }, sortableForeignKeyIndex('projectId')],
  },
  {
    name: 'additionalExperienceEntries',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'additionalExperienceBullets',
    keyPath: 'id',
    indexes: [
      { name: 'additionalExperienceEntryId', keyPath: 'additionalExperienceEntryId' },
      sortableForeignKeyIndex('additionalExperienceEntryId'),
    ],
  },
  {
    name: 'certifications',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'references',
    keyPath: 'id',
    indexes: [{ name: 'profileId', keyPath: 'profileId' }, sortableForeignKeyIndex('profileId')],
  },
  {
    name: 'jobs',
    keyPath: 'id',
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'companyName', keyPath: 'companyName' },
      { name: 'jobTitle', keyPath: 'jobTitle' },
    ],
  },
  {
    name: 'jobLinks',
    keyPath: 'id',
    indexes: [{ name: 'jobId', keyPath: 'jobId' }, sortableForeignKeyIndex('jobId')],
  },
  {
    name: 'jobContacts',
    keyPath: 'id',
    indexes: [{ name: 'jobId', keyPath: 'jobId' }, sortableForeignKeyIndex('jobId')],
  },
  {
    name: 'interviews',
    keyPath: 'id',
    indexes: [{ name: 'jobId', keyPath: 'jobId' }, { name: 'jobId_startAt', keyPath: ['jobId', 'startAt'] }],
  },
  {
    name: 'interviewContacts',
    keyPath: 'id',
    indexes: [{ name: 'interviewId', keyPath: 'interviewId' }, sortableForeignKeyIndex('interviewId'), { name: 'jobContactId', keyPath: 'jobContactId' }],
  },
  {
    name: 'applicationQuestions',
    keyPath: 'id',
    indexes: [{ name: 'jobId', keyPath: 'jobId' }, sortableForeignKeyIndex('jobId')],
  },
] as const

import { createEmptyAppDataState } from '../../domain/app-data-state'
import type { AppDataState, AppExportFile, IsoTimestamp } from '../../types/state'
import { appStoreNames, type AppStoreName } from './schema'
import { openAppDatabase, type AppDatabaseOptions } from './database'

export type PersistedAppData = Omit<AppDataState, 'version' | 'exportedAt'>

interface IndexedDbAppDataSnapshotRepositoryOptions extends AppDatabaseOptions {
  now?: () => IsoTimestamp
}

const cloneValue = <T>(value: T): T => structuredClone(value)

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'))
    }
  })

const transactionToPromise = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
    }

    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'))
    }
  })

const createPersistedAppData = (): PersistedAppData => {
  const emptyData = createEmptyAppDataState()
  return {
    profiles: emptyData.profiles,
    profileLinks: emptyData.profileLinks,
    skillCategories: emptyData.skillCategories,
    skills: emptyData.skills,
    achievements: emptyData.achievements,
    experienceEntries: emptyData.experienceEntries,
    experienceBullets: emptyData.experienceBullets,
    educationEntries: emptyData.educationEntries,
    educationBullets: emptyData.educationBullets,
    projects: emptyData.projects,
    projectBullets: emptyData.projectBullets,
    additionalExperienceEntries: emptyData.additionalExperienceEntries,
    additionalExperienceBullets: emptyData.additionalExperienceBullets,
    certifications: emptyData.certifications,
    references: emptyData.references,
    jobs: emptyData.jobs,
    jobLinks: emptyData.jobLinks,
    jobContacts: emptyData.jobContacts,
    interviews: emptyData.interviews,
    interviewContacts: emptyData.interviewContacts,
    applicationQuestions: emptyData.applicationQuestions,
  }
}

const recordArrayToMap = <T extends { id: string }>(records: T[]): Record<string, T> =>
  records.reduce<Record<string, T>>((nextRecords, record) => {
    nextRecords[record.id] = cloneValue(record)
    return nextRecords
  }, {})

const snapshotToPersistedData = (data: PersistedAppData): PersistedAppData => cloneValue(data)

const assignStoreRecords = <TStoreName extends AppStoreName>(
  persistedData: PersistedAppData,
  storeName: TStoreName,
  records: Array<PersistedAppData[TStoreName][string]>,
) => {
  persistedData[storeName] = recordArrayToMap(records) as PersistedAppData[TStoreName]
}

export interface IndexedDbAppDataSnapshotRepository {
  isAppDataEmpty(): Promise<boolean>
  readAppData(): Promise<AppDataState>
  replaceAppData(data: PersistedAppData): Promise<AppDataState>
  exportAppData(): Promise<AppExportFile>
}

export const createIndexedDbAppDataSnapshotRepository = (
  options: IndexedDbAppDataSnapshotRepositoryOptions = {},
): IndexedDbAppDataSnapshotRepository => {
  const now = options.now ?? (() => new Date().toISOString())

  const withDatabase = async <T>(operation: (database: IDBDatabase) => Promise<T>): Promise<T> => {
    const database = await openAppDatabase(options)

    try {
      return await operation(database)
    } finally {
      database.close()
    }
  }

  const readPersistedAppData = async (): Promise<PersistedAppData> =>
    withDatabase(async (database) => {
      const transaction = database.transaction(appStoreNames, 'readonly')
      const recordsByStore = await Promise.all(
        appStoreNames.map(async (storeName) => {
          const records = await requestToPromise(transaction.objectStore(storeName).getAll())
          return [storeName, records] as const
        }),
      )

      await transactionToPromise(transaction)

      const persistedData = createPersistedAppData()

      recordsByStore.forEach(([storeName, records]) => {
        assignStoreRecords(
          persistedData,
          storeName,
          records as Array<PersistedAppData[typeof storeName][string]>,
        )
      })

      return persistedData
    })

  const replacePersistedAppData = async (data: PersistedAppData): Promise<PersistedAppData> =>
    withDatabase(async (database) => {
      const transaction = database.transaction(appStoreNames, 'readwrite')
      const nextData = snapshotToPersistedData(data)

      await Promise.all(
        appStoreNames.map(async (storeName) => {
          const objectStore = transaction.objectStore(storeName)
          await requestToPromise(objectStore.clear())

          const records = Object.values(nextData[storeName])

          await Promise.all(records.map((record) => requestToPromise(objectStore.put(record))))
        }),
      )

      await transactionToPromise(transaction)

      return nextData
    })

  return {
    async isAppDataEmpty(): Promise<boolean> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(appStoreNames, 'readonly')
        const counts = await Promise.all(
          appStoreNames.map((storeName) => requestToPromise(transaction.objectStore(storeName).count())),
        )

        await transactionToPromise(transaction)

        return counts.every((count) => count === 0)
      })
    },

    async readAppData(): Promise<AppDataState> {
      return {
        version: 1,
        ...await readPersistedAppData(),
      }
    },

    async replaceAppData(data: PersistedAppData): Promise<AppDataState> {
      const persistedData = await replacePersistedAppData(data)

      return {
        version: 1,
        ...persistedData,
      }
    },

    async exportAppData(): Promise<AppExportFile> {
      const data = await readPersistedAppData()

      return {
        version: 1,
        exportedAt: now(),
        data,
      }
    },
  }
}
import { appDatabaseName, appDatabaseVersion, appStoreDefinitions, type DatabaseStoreName, type StoreDefinition } from './schema'

export interface AppDatabaseOptions {
  databaseName?: string
  databaseVersion?: number
}

const createObjectStore = (database: IDBDatabase, definition: StoreDefinition) => {
  const objectStore = database.createObjectStore(definition.name, { keyPath: definition.keyPath })

  definition.indexes?.forEach((index) => {
    objectStore.createIndex(index.name, index.keyPath, index.options)
  })
}

const syncObjectStoreIndexes = (objectStore: IDBObjectStore, definition: StoreDefinition) => {
  const expectedIndexes = new Set(definition.indexes?.map((index) => index.name) ?? [])

  Array.from(objectStore.indexNames).forEach((indexName) => {
    if (!expectedIndexes.has(indexName)) {
      objectStore.deleteIndex(indexName)
    }
  })

  definition.indexes?.forEach((index) => {
    if (!objectStore.indexNames.contains(index.name)) {
      objectStore.createIndex(index.name, index.keyPath, index.options)
    }
  })
}

export const openAppDatabase = async (options: AppDatabaseOptions = {}): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(options.databaseName ?? appDatabaseName, options.databaseVersion ?? appDatabaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      const upgradeTransaction = request.transaction

      if (!upgradeTransaction) {
        throw new Error('IndexedDB upgrade transaction was not available.')
      }

      const expectedStores = new Set(appStoreDefinitions.map((definition) => definition.name))

      Array.from(database.objectStoreNames).forEach((storeName) => {
        if (!expectedStores.has(storeName as DatabaseStoreName)) {
          database.deleteObjectStore(storeName)
        }
      })

      appStoreDefinitions.forEach((definition) => {
        if (!database.objectStoreNames.contains(definition.name)) {
          createObjectStore(database, definition)
          return
        }

        const objectStore = upgradeTransaction.objectStore(definition.name)
        syncObjectStoreIndexes(objectStore, definition)
      })
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB database.'))
    }

    request.onblocked = () => {
      reject(new Error('Opening the IndexedDB database was blocked by another connection.'))
    }
  })

export const deleteAppDatabase = async (options: AppDatabaseOptions = {}): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(options.databaseName ?? appDatabaseName)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to delete IndexedDB database.'))
    }

    request.onblocked = () => {
      reject(new Error('Deleting the IndexedDB database was blocked by another connection.'))
    }
  })

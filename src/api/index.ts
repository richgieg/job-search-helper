import type { AppDataState } from '../types/state'
import type { AppApiClient } from './app-api-client'
import { LocalAppApiClient } from './app-api-client'
import type { AppDataService } from './app-data-service'
import { createDelayedAppDataService } from './delayed-app-data-service'
import { IndexedDbAppBackend } from './indexeddb-app-backend'
import { MockAppBackend } from './mock-app-backend'

interface CreateAppApiClientOptions {
  initialData?: AppDataState
}

const defaultDelayRange = {
  minDelayMs: 150,
  maxDelayMs: 900,
}

const parseDelayMs = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return Math.round(parsed)
}

const getBackendMode = (): 'memory' | 'indexeddb' =>
  import.meta.env.VITE_APP_DATA_BACKEND === 'memory' ? 'memory' : 'indexeddb'

const createAppDataService = (options: CreateAppApiClientOptions): AppDataService => {
  const backend: AppDataService =
    getBackendMode() === 'indexeddb'
      ? new IndexedDbAppBackend(options.initialData ? { initialData: options.initialData } : {})
      : new MockAppBackend(options.initialData ? { initialData: options.initialData } : {})
  const shouldSimulateDelay = import.meta.env.MODE === 'development' && import.meta.env.VITE_SIMULATE_API_DELAY === 'true'

  if (!shouldSimulateDelay) {
    return backend
  }

  return createDelayedAppDataService(backend, {
    minDelayMs: parseDelayMs(import.meta.env.VITE_SIMULATE_API_DELAY_MIN_MS, defaultDelayRange.minDelayMs),
    maxDelayMs: parseDelayMs(import.meta.env.VITE_SIMULATE_API_DELAY_MAX_MS, defaultDelayRange.maxDelayMs),
  })
}

export const createAppApiClient = (options: CreateAppApiClientOptions = {}): AppApiClient =>
  new LocalAppApiClient(createAppDataService(options))

let currentAppApiClient = createAppApiClient()

export const getAppApiClient = (): AppApiClient => currentAppApiClient

export const setAppApiClient = (client: AppApiClient) => {
  currentAppApiClient = client
}

export const resetAppApiClient = (options: CreateAppApiClientOptions = {}) => {
  currentAppApiClient = createAppApiClient(options)
  return currentAppApiClient
}

import type { AppDataState } from '../types/state'
import type { AppApiClient } from './app-api-client'
import { LocalAppApiClient } from './app-api-client'
import { MockAppBackend } from './mock-app-backend'

interface CreateAppApiClientOptions {
  initialData?: AppDataState
}

export const createAppApiClient = (options: CreateAppApiClientOptions = {}): AppApiClient =>
  new LocalAppApiClient(
    new MockAppBackend(options.initialData ? { initialData: options.initialData } : {}),
  )

let currentAppApiClient = createAppApiClient()

export const getAppApiClient = (): AppApiClient => currentAppApiClient

export const setAppApiClient = (client: AppApiClient) => {
  currentAppApiClient = client
}

export const resetAppApiClient = (options: CreateAppApiClientOptions = {}) => {
  currentAppApiClient = createAppApiClient(options)
  return currentAppApiClient
}

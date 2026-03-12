import { createEmptyDataState } from '../store/create-initial-state'
import type { AppDataState, AppExportFile, IsoTimestamp } from '../types/state'
import type { AppDataService } from './app-data-service'

interface MockAppBackendOptions {
  initialData?: AppDataState
  now?: () => IsoTimestamp
}

const cloneAppData = (data: AppDataState): AppDataState => structuredClone(data)
const cloneExportData = (data: AppExportFile['data']): AppExportFile['data'] => structuredClone(data)

export class MockAppBackend implements AppDataService {
  private data: AppDataState
  private readonly now: () => IsoTimestamp

  constructor(options: MockAppBackendOptions = {}) {
    this.data = cloneAppData(options.initialData ?? createEmptyDataState())
    this.now = options.now ?? (() => new Date().toISOString())
  }

  async getAppData(): Promise<AppDataState> {
    return cloneAppData(this.data)
  }

  async replaceAppData(data: AppDataState): Promise<AppDataState> {
    this.data = cloneAppData(data)
    return cloneAppData(this.data)
  }

  async importAppData(file: AppExportFile): Promise<AppDataState> {
    this.data = {
      version: 1,
      exportedAt: file.exportedAt,
      ...cloneExportData(file.data),
    }

    return cloneAppData(this.data)
  }

  async exportAppData(data: AppDataState): Promise<AppExportFile> {
    this.data = cloneAppData(data)

    return {
      version: 1,
      exportedAt: this.now(),
      data: cloneAppData(this.data),
    }
  }
}

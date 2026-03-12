import type { AppDataState, AppExportFile } from '../types/state'
import type { AppDataService } from './app-data-service'

export interface AppApiClient {
  getAppData(): Promise<AppDataState>
  replaceAppData(data: AppDataState): Promise<AppDataState>
  importAppData(file: AppExportFile): Promise<AppDataState>
  exportAppData(data: AppDataState): Promise<AppExportFile>
}

export class LocalAppApiClient implements AppApiClient {
  constructor(private readonly service: AppDataService) {}

  getAppData(): Promise<AppDataState> {
    return this.service.getAppData()
  }

  replaceAppData(data: AppDataState): Promise<AppDataState> {
    return this.service.replaceAppData(data)
  }

  importAppData(file: AppExportFile): Promise<AppDataState> {
    return this.service.importAppData(file)
  }

  exportAppData(data: AppDataState): Promise<AppExportFile> {
    return this.service.exportAppData(data)
  }
}

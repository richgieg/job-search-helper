import type { AppDataState, AppExportFile } from '../types/state'

export interface AppDataService {
  getAppData(): Promise<AppDataState>
  replaceAppData(data: AppDataState): Promise<AppDataState>
  importAppData(file: AppExportFile): Promise<AppDataState>
  exportAppData(data: AppDataState): Promise<AppExportFile>
}

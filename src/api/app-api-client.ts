import type { AppDataState, AppExportFile } from '../types/state'
import type {
  AddInterviewContactInput,
  CreateJobInput,
  JobMutationResult,
  ReorderInterviewContactsInput,
  ReorderJobEntitiesInput,
  SetJobAppliedAtInput,
  SetJobFinalOutcomeInput,
  UpdateApplicationQuestionInput,
  UpdateInterviewInput,
  UpdateJobContactInput,
  UpdateJobInput,
  UpdateJobLinkInput,
} from '../domain/job-data'
import type { AppDataService } from './app-data-service'

export interface AppApiClient {
  getAppData(): Promise<AppDataState>
  replaceAppData(data: AppDataState): Promise<AppDataState>
  importAppData(file: AppExportFile): Promise<AppDataState>
  exportAppData(data: AppDataState): Promise<AppExportFile>
  createJob(data: AppDataState, input: CreateJobInput): Promise<JobMutationResult>
  updateJob(data: AppDataState, input: UpdateJobInput): Promise<JobMutationResult>
  deleteJob(data: AppDataState, jobId: string): Promise<JobMutationResult>
  createJobLink(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateJobLink(data: AppDataState, input: UpdateJobLinkInput): Promise<JobMutationResult>
  deleteJobLink(data: AppDataState, jobLinkId: string): Promise<JobMutationResult>
  reorderJobLinks(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createJobContact(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateJobContact(data: AppDataState, input: UpdateJobContactInput): Promise<JobMutationResult>
  deleteJobContact(data: AppDataState, jobContactId: string): Promise<JobMutationResult>
  reorderJobContacts(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createApplicationQuestion(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateApplicationQuestion(data: AppDataState, input: UpdateApplicationQuestionInput): Promise<JobMutationResult>
  deleteApplicationQuestion(data: AppDataState, applicationQuestionId: string): Promise<JobMutationResult>
  reorderApplicationQuestions(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  setJobAppliedAt(data: AppDataState, input: SetJobAppliedAtInput): Promise<JobMutationResult>
  clearJobAppliedAt(data: AppDataState, jobId: string): Promise<JobMutationResult>
  setJobFinalOutcome(data: AppDataState, input: SetJobFinalOutcomeInput): Promise<JobMutationResult>
  clearJobFinalOutcome(data: AppDataState, jobId: string): Promise<JobMutationResult>
  createInterview(data: AppDataState, jobId: string): Promise<JobMutationResult>
  updateInterview(data: AppDataState, input: UpdateInterviewInput): Promise<JobMutationResult>
  deleteInterview(data: AppDataState, interviewId: string): Promise<JobMutationResult>
  addInterviewContact(data: AppDataState, input: AddInterviewContactInput): Promise<JobMutationResult>
  removeInterviewContact(data: AppDataState, interviewContactId: string): Promise<JobMutationResult>
  reorderInterviewContacts(data: AppDataState, input: ReorderInterviewContactsInput): Promise<JobMutationResult>
}

export class LocalAppApiClient implements AppApiClient {
  constructor(private readonly service: AppDataService) {}

  private async sync(data: AppDataState) {
    await this.service.replaceAppData(data)
  }

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

  async createJob(data: AppDataState, input: CreateJobInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createJob(input)
  }

  async updateJob(data: AppDataState, input: UpdateJobInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateJob(input)
  }

  async deleteJob(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteJob(jobId)
  }

  async createJobLink(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createJobLink(jobId)
  }

  async updateJobLink(data: AppDataState, input: UpdateJobLinkInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateJobLink(input)
  }

  async deleteJobLink(data: AppDataState, jobLinkId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteJobLink(jobLinkId)
  }

  async reorderJobLinks(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderJobLinks(input)
  }

  async createJobContact(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createJobContact(jobId)
  }

  async updateJobContact(data: AppDataState, input: UpdateJobContactInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateJobContact(input)
  }

  async deleteJobContact(data: AppDataState, jobContactId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteJobContact(jobContactId)
  }

  async reorderJobContacts(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderJobContacts(input)
  }

  async createApplicationQuestion(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createApplicationQuestion(jobId)
  }

  async updateApplicationQuestion(data: AppDataState, input: UpdateApplicationQuestionInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateApplicationQuestion(input)
  }

  async deleteApplicationQuestion(data: AppDataState, applicationQuestionId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteApplicationQuestion(applicationQuestionId)
  }

  async reorderApplicationQuestions(data: AppDataState, input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderApplicationQuestions(input)
  }

  async setJobAppliedAt(data: AppDataState, input: SetJobAppliedAtInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.setJobAppliedAt(input)
  }

  async clearJobAppliedAt(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.clearJobAppliedAt(jobId)
  }

  async setJobFinalOutcome(data: AppDataState, input: SetJobFinalOutcomeInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.setJobFinalOutcome(input)
  }

  async clearJobFinalOutcome(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.clearJobFinalOutcome(jobId)
  }

  async createInterview(data: AppDataState, jobId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.createInterview(jobId)
  }

  async updateInterview(data: AppDataState, input: UpdateInterviewInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.updateInterview(input)
  }

  async deleteInterview(data: AppDataState, interviewId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.deleteInterview(interviewId)
  }

  async addInterviewContact(data: AppDataState, input: AddInterviewContactInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.addInterviewContact(input)
  }

  async removeInterviewContact(data: AppDataState, interviewContactId: string): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.removeInterviewContact(interviewContactId)
  }

  async reorderInterviewContacts(data: AppDataState, input: ReorderInterviewContactsInput): Promise<JobMutationResult> {
    await this.sync(data)
    return this.service.reorderInterviewContacts(input)
  }
}

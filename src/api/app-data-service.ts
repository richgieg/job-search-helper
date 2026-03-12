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

export interface AppDataService {
  getAppData(): Promise<AppDataState>
  replaceAppData(data: AppDataState): Promise<AppDataState>
  importAppData(file: AppExportFile): Promise<AppDataState>
  exportAppData(data: AppDataState): Promise<AppExportFile>
  createJob(input: CreateJobInput): Promise<JobMutationResult>
  updateJob(input: UpdateJobInput): Promise<JobMutationResult>
  deleteJob(jobId: string): Promise<JobMutationResult>
  createJobLink(jobId: string): Promise<JobMutationResult>
  updateJobLink(input: UpdateJobLinkInput): Promise<JobMutationResult>
  deleteJobLink(jobLinkId: string): Promise<JobMutationResult>
  reorderJobLinks(input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createJobContact(jobId: string): Promise<JobMutationResult>
  updateJobContact(input: UpdateJobContactInput): Promise<JobMutationResult>
  deleteJobContact(jobContactId: string): Promise<JobMutationResult>
  reorderJobContacts(input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  createApplicationQuestion(jobId: string): Promise<JobMutationResult>
  updateApplicationQuestion(input: UpdateApplicationQuestionInput): Promise<JobMutationResult>
  deleteApplicationQuestion(applicationQuestionId: string): Promise<JobMutationResult>
  reorderApplicationQuestions(input: ReorderJobEntitiesInput): Promise<JobMutationResult>
  setJobAppliedAt(input: SetJobAppliedAtInput): Promise<JobMutationResult>
  clearJobAppliedAt(jobId: string): Promise<JobMutationResult>
  setJobFinalOutcome(input: SetJobFinalOutcomeInput): Promise<JobMutationResult>
  clearJobFinalOutcome(jobId: string): Promise<JobMutationResult>
  createInterview(jobId: string): Promise<JobMutationResult>
  updateInterview(input: UpdateInterviewInput): Promise<JobMutationResult>
  deleteInterview(interviewId: string): Promise<JobMutationResult>
  addInterviewContact(input: AddInterviewContactInput): Promise<JobMutationResult>
  removeInterviewContact(interviewContactId: string): Promise<JobMutationResult>
  reorderInterviewContacts(input: ReorderInterviewContactsInput): Promise<JobMutationResult>
}

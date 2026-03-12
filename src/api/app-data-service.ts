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
import type {
  DuplicateProfileInput,
  ProfileMutationResult,
  ReorderResumeSectionsInput,
  SetDocumentHeaderTemplateInput,
  SetResumeSectionEnabledInput,
  SetResumeSectionLabelInput,
  UpdateProfileInput,
} from '../domain/profile-data'

export interface AppDataService {
  getAppData(): Promise<AppDataState>
  replaceAppData(data: AppDataState): Promise<AppDataState>
  importAppData(file: AppExportFile): Promise<AppDataState>
  exportAppData(data: AppDataState): Promise<AppExportFile>
  createBaseProfile(name: string): Promise<ProfileMutationResult>
  updateProfile(input: UpdateProfileInput): Promise<ProfileMutationResult>
  setDocumentHeaderTemplate(input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult>
  setResumeSectionEnabled(input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult>
  setResumeSectionLabel(input: SetResumeSectionLabelInput): Promise<ProfileMutationResult>
  reorderResumeSections(input: ReorderResumeSectionsInput): Promise<ProfileMutationResult>
  duplicateProfile(input: DuplicateProfileInput): Promise<ProfileMutationResult>
  deleteProfile(profileId: string): Promise<ProfileMutationResult>
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

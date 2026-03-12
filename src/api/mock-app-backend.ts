import { createEmptyDataState } from '../store/create-initial-state'
import type { AppDataState, AppExportFile, IsoTimestamp } from '../types/state'
import {
  addInterviewContactMutation,
  clearJobAppliedAtMutation,
  clearJobFinalOutcomeMutation,
  createApplicationQuestionMutation,
  createInterviewMutation,
  createJobContactMutation,
  createJobLinkMutation,
  createJobMutation,
  deleteApplicationQuestionMutation,
  deleteInterviewMutation,
  deleteJobContactMutation,
  deleteJobLinkMutation,
  deleteJobMutation,
  removeInterviewContactMutation,
  reorderApplicationQuestionsMutation,
  reorderInterviewContactsMutation,
  reorderJobContactsMutation,
  reorderJobLinksMutation,
  setJobAppliedAtMutation,
  setJobFinalOutcomeMutation,
  updateApplicationQuestionMutation,
  updateInterviewMutation,
  updateJobContactMutation,
  updateJobLinkMutation,
  updateJobMutation,
  type AddInterviewContactInput,
  type CreateJobInput,
  type JobMutationContext,
  type JobMutationResult,
  type ReorderInterviewContactsInput,
  type ReorderJobEntitiesInput,
  type SetJobAppliedAtInput,
  type SetJobFinalOutcomeInput,
  type UpdateApplicationQuestionInput,
  type UpdateInterviewInput,
  type UpdateJobContactInput,
  type UpdateJobInput,
  type UpdateJobLinkInput,
} from '../domain/job-data'
import {
  createBaseProfileMutation,
  deleteProfileMutation,
  duplicateProfileMutation,
  reorderResumeSectionsMutation,
  setDocumentHeaderTemplateMutation,
  setResumeSectionEnabledMutation,
  setResumeSectionLabelMutation,
  updateProfileMutation,
  type DuplicateProfileInput,
  type ProfileMutationContext,
  type ProfileMutationResult,
  type ReorderResumeSectionsInput,
  type SetDocumentHeaderTemplateInput,
  type SetResumeSectionEnabledInput,
  type SetResumeSectionLabelInput,
  type UpdateProfileInput,
} from '../domain/profile-data'
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

  private mutate(mutation: (data: AppDataState, context: JobMutationContext) => JobMutationResult): JobMutationResult {
    const result = mutation(this.data, { now: this.now, createId: () => crypto.randomUUID() })
    this.data = cloneAppData(result.data)
    return {
      ...result,
      data: cloneAppData(this.data),
    }
  }

  private mutateProfile(mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult): ProfileMutationResult {
    const result = mutation(this.data, { now: this.now, createId: () => crypto.randomUUID() })
    this.data = cloneAppData(result.data)
    return {
      ...result,
      data: cloneAppData(this.data),
    }
  }

  async createBaseProfile(name: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => createBaseProfileMutation(data, name, context))
  }

  async updateProfile(input: UpdateProfileInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => updateProfileMutation(data, input, context))
  }

  async setDocumentHeaderTemplate(input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => setDocumentHeaderTemplateMutation(data, input, context))
  }

  async setResumeSectionEnabled(input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => setResumeSectionEnabledMutation(data, input, context))
  }

  async setResumeSectionLabel(input: SetResumeSectionLabelInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => setResumeSectionLabelMutation(data, input, context))
  }

  async reorderResumeSections(input: ReorderResumeSectionsInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => reorderResumeSectionsMutation(data, input, context))
  }

  async duplicateProfile(input: DuplicateProfileInput): Promise<ProfileMutationResult> {
    return this.mutateProfile((data, context) => duplicateProfileMutation(data, input, context))
  }

  async deleteProfile(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateProfile((data) => deleteProfileMutation(data, profileId))
  }

  async createJob(input: CreateJobInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => createJobMutation(data, input, context))
  }

  async updateJob(input: UpdateJobInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateJobMutation(data, input, context))
  }

  async deleteJob(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data) => deleteJobMutation(data, jobId))
  }

  async createJobLink(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createJobLinkMutation(data, jobId, context))
  }

  async updateJobLink(input: UpdateJobLinkInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateJobLinkMutation(data, input, context))
  }

  async deleteJobLink(jobLinkId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteJobLinkMutation(data, jobLinkId, context))
  }

  async reorderJobLinks(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderJobLinksMutation(data, input, context))
  }

  async createJobContact(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createJobContactMutation(data, jobId, context))
  }

  async updateJobContact(input: UpdateJobContactInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateJobContactMutation(data, input, context))
  }

  async deleteJobContact(jobContactId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteJobContactMutation(data, jobContactId, context))
  }

  async reorderJobContacts(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderJobContactsMutation(data, input, context))
  }

  async createApplicationQuestion(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createApplicationQuestionMutation(data, jobId, context))
  }

  async updateApplicationQuestion(input: UpdateApplicationQuestionInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateApplicationQuestionMutation(data, input, context))
  }

  async deleteApplicationQuestion(applicationQuestionId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteApplicationQuestionMutation(data, applicationQuestionId, context))
  }

  async reorderApplicationQuestions(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderApplicationQuestionsMutation(data, input, context))
  }

  async setJobAppliedAt(input: SetJobAppliedAtInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => setJobAppliedAtMutation(data, input, context))
  }

  async clearJobAppliedAt(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => clearJobAppliedAtMutation(data, jobId, context))
  }

  async setJobFinalOutcome(input: SetJobFinalOutcomeInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => setJobFinalOutcomeMutation(data, input, context))
  }

  async clearJobFinalOutcome(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => clearJobFinalOutcomeMutation(data, jobId, context))
  }

  async createInterview(jobId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => createInterviewMutation(data, jobId, context))
  }

  async updateInterview(input: UpdateInterviewInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => updateInterviewMutation(data, input, context))
  }

  async deleteInterview(interviewId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => deleteInterviewMutation(data, interviewId, context))
  }

  async addInterviewContact(input: AddInterviewContactInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => addInterviewContactMutation(data, input, context))
  }

  async removeInterviewContact(interviewContactId: string): Promise<JobMutationResult> {
    return this.mutate((data, context) => removeInterviewContactMutation(data, interviewContactId, context))
  }

  async reorderInterviewContacts(input: ReorderInterviewContactsInput): Promise<JobMutationResult> {
    return this.mutate((data, context) => reorderInterviewContactsMutation(data, input, context))
  }
}

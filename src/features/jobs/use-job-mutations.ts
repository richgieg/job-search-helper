import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getAppApiClient } from '../../api'
import type {
  AddInterviewContactInput,
  CreateJobInput,
  ReorderInterviewContactsInput,
  ReorderJobEntitiesInput,
  SetJobAppliedAtInput,
  SetJobFinalOutcomeInput,
  UpdateApplicationQuestionInput,
  UpdateInterviewInput,
  UpdateJobContactInput,
  UpdateJobInput,
  UpdateJobLinkInput,
} from '../../domain/job-data'
import { queryKeys } from '../../queries/query-keys'
import { useSelectJob, useSelectProfile, useSelectedJobId, useSelectedProfileId } from '../../store/app-ui-store'
import type { Id } from '../../types/state'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown job mutation error.')

export const useJobMutations = () => {
  const queryClient = useQueryClient()
  const selectedJobId = useSelectedJobId()
  const selectedProfileId = useSelectedProfileId()
  const selectJob = useSelectJob()
  const selectProfile = useSelectProfile()

  const invalidateJobQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsList() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsDetailRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesListRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesDetailRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesDocumentRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() }),
    ])
  }

  const updateJobMutation = useMutation({
    mutationFn: (input: UpdateJobInput) => getAppApiClient().updateJob(input),
    onSuccess: invalidateJobQueries,
  })

  const createJobMutation = useMutation({
    mutationFn: (input: CreateJobInput) => getAppApiClient().createJob(input),
    onSuccess: invalidateJobQueries,
  })

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: Id) => getAppApiClient().deleteJob(jobId),
    onSuccess: invalidateJobQueries,
  })

  const setJobAppliedAtMutation = useMutation({
    mutationFn: (input: SetJobAppliedAtInput) => getAppApiClient().setJobAppliedAt(input),
    onSuccess: invalidateJobQueries,
  })

  const clearJobAppliedAtMutation = useMutation({
    mutationFn: (jobId: Id) => getAppApiClient().clearJobAppliedAt(jobId),
    onSuccess: invalidateJobQueries,
  })

  const setJobFinalOutcomeMutation = useMutation({
    mutationFn: (input: SetJobFinalOutcomeInput) => getAppApiClient().setJobFinalOutcome(input),
    onSuccess: invalidateJobQueries,
  })

  const clearJobFinalOutcomeMutation = useMutation({
    mutationFn: (jobId: Id) => getAppApiClient().clearJobFinalOutcome(jobId),
    onSuccess: invalidateJobQueries,
  })

  const createJobLinkMutation = useMutation({
    mutationFn: (jobId: Id) => getAppApiClient().createJobLink(jobId),
    onSuccess: invalidateJobQueries,
  })

  const updateJobLinkMutation = useMutation({
    mutationFn: (input: UpdateJobLinkInput) => getAppApiClient().updateJobLink(input),
    onSuccess: invalidateJobQueries,
  })

  const deleteJobLinkMutation = useMutation({
    mutationFn: (jobLinkId: Id) => getAppApiClient().deleteJobLink(jobLinkId),
    onSuccess: invalidateJobQueries,
  })

  const reorderJobLinksMutation = useMutation({
    mutationFn: (input: ReorderJobEntitiesInput) => getAppApiClient().reorderJobLinks(input),
    onSuccess: invalidateJobQueries,
  })

  const createJobContactMutation = useMutation({
    mutationFn: (jobId: Id) => getAppApiClient().createJobContact(jobId),
    onSuccess: invalidateJobQueries,
  })

  const updateJobContactMutation = useMutation({
    mutationFn: (input: UpdateJobContactInput) => getAppApiClient().updateJobContact(input),
    onSuccess: invalidateJobQueries,
  })

  const deleteJobContactMutation = useMutation({
    mutationFn: (jobContactId: Id) => getAppApiClient().deleteJobContact(jobContactId),
    onSuccess: invalidateJobQueries,
  })

  const reorderJobContactsMutation = useMutation({
    mutationFn: (input: ReorderJobEntitiesInput) => getAppApiClient().reorderJobContacts(input),
    onSuccess: invalidateJobQueries,
  })

  const createApplicationQuestionMutation = useMutation({
    mutationFn: (jobId: Id) => getAppApiClient().createApplicationQuestion(jobId),
    onSuccess: invalidateJobQueries,
  })

  const updateApplicationQuestionMutation = useMutation({
    mutationFn: (input: UpdateApplicationQuestionInput) => getAppApiClient().updateApplicationQuestion(input),
    onSuccess: invalidateJobQueries,
  })

  const deleteApplicationQuestionMutation = useMutation({
    mutationFn: (applicationQuestionId: Id) => getAppApiClient().deleteApplicationQuestion(applicationQuestionId),
    onSuccess: invalidateJobQueries,
  })

  const reorderApplicationQuestionsMutation = useMutation({
    mutationFn: (input: ReorderJobEntitiesInput) => getAppApiClient().reorderApplicationQuestions(input),
    onSuccess: invalidateJobQueries,
  })

  const createInterviewMutation = useMutation({
    mutationFn: (jobId: Id) => getAppApiClient().createInterview(jobId),
    onSuccess: invalidateJobQueries,
  })

  const updateInterviewMutation = useMutation({
    mutationFn: (input: UpdateInterviewInput) => getAppApiClient().updateInterview(input),
    onSuccess: invalidateJobQueries,
  })

  const deleteInterviewMutation = useMutation({
    mutationFn: (interviewId: Id) => getAppApiClient().deleteInterview(interviewId),
    onSuccess: invalidateJobQueries,
  })

  const addInterviewContactMutation = useMutation({
    mutationFn: (input: AddInterviewContactInput) => getAppApiClient().addInterviewContact(input),
    onSuccess: invalidateJobQueries,
  })

  const removeInterviewContactMutation = useMutation({
    mutationFn: (interviewContactId: Id) => getAppApiClient().removeInterviewContact(interviewContactId),
    onSuccess: invalidateJobQueries,
  })

  const reorderInterviewContactsMutation = useMutation({
    mutationFn: (input: ReorderInterviewContactsInput) => getAppApiClient().reorderInterviewContacts(input),
    onSuccess: invalidateJobQueries,
  })

  const mutations = [
    updateJobMutation,
    createJobMutation,
    deleteJobMutation,
    setJobAppliedAtMutation,
    clearJobAppliedAtMutation,
    setJobFinalOutcomeMutation,
    clearJobFinalOutcomeMutation,
    createJobLinkMutation,
    updateJobLinkMutation,
    deleteJobLinkMutation,
    reorderJobLinksMutation,
    createJobContactMutation,
    updateJobContactMutation,
    deleteJobContactMutation,
    reorderJobContactsMutation,
    createApplicationQuestionMutation,
    updateApplicationQuestionMutation,
    deleteApplicationQuestionMutation,
    reorderApplicationQuestionsMutation,
    createInterviewMutation,
    updateInterviewMutation,
    deleteInterviewMutation,
    addInterviewContactMutation,
    removeInterviewContactMutation,
    reorderInterviewContactsMutation,
  ] as const

  const errorMessage = mutations
    .map((mutation) => mutation.error)
    .filter(Boolean)
    .map(getErrorMessage)[0] ?? null

  return {
    errorMessage,
    isSaving: mutations.some((mutation) => mutation.isPending),
    createJob: async (input: CreateJobInput) => {
      const result = await createJobMutation.mutateAsync(input)
      const createdJobId = result.createdId ?? null

      if (createdJobId) {
        selectJob(createdJobId)
      }

      return createdJobId
    },
    updateJob: async (input: UpdateJobInput) => {
      await updateJobMutation.mutateAsync(input)
    },
    deleteJob: async (jobId: Id) => {
      const result = await deleteJobMutation.mutateAsync(jobId)

      if (selectedJobId === jobId) {
        selectJob(null)
      }

      if (selectedProfileId && result.data.profiles[selectedProfileId] === undefined) {
        selectProfile(null)
      }
    },
    setJobAppliedAt: async (input: SetJobAppliedAtInput) => {
      await setJobAppliedAtMutation.mutateAsync(input)
    },
    clearJobAppliedAt: async (jobId: Id) => {
      await clearJobAppliedAtMutation.mutateAsync(jobId)
    },
    setJobFinalOutcome: async (input: SetJobFinalOutcomeInput) => {
      await setJobFinalOutcomeMutation.mutateAsync(input)
    },
    clearJobFinalOutcome: async (jobId: Id) => {
      await clearJobFinalOutcomeMutation.mutateAsync(jobId)
    },
    createJobLink: async (jobId: Id) => {
      const result = await createJobLinkMutation.mutateAsync(jobId)
      return result.createdId ?? null
    },
    updateJobLink: async (input: UpdateJobLinkInput) => {
      await updateJobLinkMutation.mutateAsync(input)
    },
    deleteJobLink: async (jobLinkId: Id) => {
      await deleteJobLinkMutation.mutateAsync(jobLinkId)
    },
    reorderJobLinks: async (input: ReorderJobEntitiesInput) => {
      await reorderJobLinksMutation.mutateAsync(input)
    },
    createJobContact: async (jobId: Id) => {
      const result = await createJobContactMutation.mutateAsync(jobId)
      return result.createdId ?? null
    },
    updateJobContact: async (input: UpdateJobContactInput) => {
      await updateJobContactMutation.mutateAsync(input)
    },
    deleteJobContact: async (jobContactId: Id) => {
      await deleteJobContactMutation.mutateAsync(jobContactId)
    },
    reorderJobContacts: async (input: ReorderJobEntitiesInput) => {
      await reorderJobContactsMutation.mutateAsync(input)
    },
    createApplicationQuestion: async (jobId: Id) => {
      const result = await createApplicationQuestionMutation.mutateAsync(jobId)
      return result.createdId ?? null
    },
    updateApplicationQuestion: async (input: UpdateApplicationQuestionInput) => {
      await updateApplicationQuestionMutation.mutateAsync(input)
    },
    deleteApplicationQuestion: async (applicationQuestionId: Id) => {
      await deleteApplicationQuestionMutation.mutateAsync(applicationQuestionId)
    },
    reorderApplicationQuestions: async (input: ReorderJobEntitiesInput) => {
      await reorderApplicationQuestionsMutation.mutateAsync(input)
    },
    createInterview: async (jobId: Id) => {
      const result = await createInterviewMutation.mutateAsync(jobId)
      return result.createdId ?? null
    },
    updateInterview: async (input: UpdateInterviewInput) => {
      await updateInterviewMutation.mutateAsync(input)
    },
    deleteInterview: async (interviewId: Id) => {
      await deleteInterviewMutation.mutateAsync(interviewId)
    },
    addInterviewContact: async (input: AddInterviewContactInput) => {
      await addInterviewContactMutation.mutateAsync(input)
    },
    removeInterviewContact: async (interviewContactId: Id) => {
      await removeInterviewContactMutation.mutateAsync(interviewContactId)
    },
    reorderInterviewContacts: async (input: ReorderInterviewContactsInput) => {
      await reorderInterviewContactsMutation.mutateAsync(input)
    },
  }
}
import type {
  AppDataState,
  ApplicationQuestion,
  ContactOrganizationKind,
  FinalOutcome,
  FinalOutcomeStatus,
  Id,
  Interview,
  InterviewContact,
  IsoTimestamp,
  Job,
  JobContact,
  JobLink,
} from '../types/state'

export type CreateJobInput = Omit<Partial<Job>, 'id' | 'createdAt' | 'updatedAt' | 'appliedAt' | 'finalOutcome'> &
  Pick<Job, 'jobTitle'> & { initialLinkUrl?: string }

export interface UpdateJobInput {
  jobId: Id
  changes: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'appliedAt' | 'finalOutcome'>>
}

export interface UpdateJobLinkInput {
  jobLinkId: Id
  changes: Partial<Omit<JobLink, 'id' | 'jobId' | 'createdAt'>>
}

export interface UpdateJobContactInput {
  jobContactId: Id
  changes: Partial<Omit<JobContact, 'id' | 'jobId'>>
}

export interface UpdateApplicationQuestionInput {
  applicationQuestionId: Id
  changes: Partial<Omit<ApplicationQuestion, 'id' | 'jobId'>>
}

export interface UpdateInterviewInput {
  interviewId: Id
  changes: Partial<Omit<Interview, 'id' | 'jobId'>>
}

export interface SetJobAppliedAtInput {
  jobId: Id
  appliedAt: string
}

export interface SetJobFinalOutcomeInput {
  jobId: Id
  status: FinalOutcomeStatus
  setAt: string
}

export interface AddInterviewContactInput {
  interviewId: Id
  jobContactId: Id
}

export interface ReorderJobEntitiesInput {
  jobId: Id
  orderedIds: Id[]
}

export interface ReorderInterviewContactsInput {
  interviewId: Id
  orderedIds: Id[]
}

export interface JobMutationContext {
  now(): IsoTimestamp
  createId(): Id
}

export interface JobMutationResult {
  data: AppDataState
  createdId?: Id | null
}

const getNextSortOrder = (sortOrders: number[]) => {
  if (sortOrders.length === 0) {
    return 1
  }

  return Math.max(...sortOrders) + 1
}

const hasExactIds = (expectedIds: Id[], orderedIds: Id[]) => {
  if (expectedIds.length !== orderedIds.length) {
    return false
  }

  const expectedIdSet = new Set(expectedIds)
  const orderedIdSet = new Set(orderedIds)

  if (expectedIdSet.size !== orderedIdSet.size) {
    return false
  }

  return expectedIds.every((id) => orderedIdSet.has(id))
}

const reorderSortableEntities = <T extends { id: Id; sortOrder: number }>(entities: Record<Id, T>, orderedIds: Id[]) => {
  const nextEntities = { ...entities }

  orderedIds.forEach((id, index) => {
    const entity = nextEntities[id]

    if (!entity) {
      return
    }

    nextEntities[id] = {
      ...entity,
      sortOrder: index + 1,
    }
  })

  return nextEntities
}

const stampUpdatedJob = (data: AppDataState, jobId: Id, timestamp: string): AppDataState => {
  const job = data.jobs[jobId]

  if (!job) {
    return data
  }

  return {
    ...data,
    jobs: {
      ...data.jobs,
      [jobId]: {
        ...job,
        updatedAt: timestamp,
      },
    },
  }
}

const deleteProfileCascade = (data: AppDataState, profileId: Id): AppDataState => {
  const nextProfiles = { ...data.profiles }
  const nextProfileLinks = { ...data.profileLinks }
  const nextSkillCategories = { ...data.skillCategories }
  const nextSkills = { ...data.skills }
  const nextAchievements = { ...data.achievements }
  const nextExperienceEntries = { ...data.experienceEntries }
  const nextExperienceBullets = { ...data.experienceBullets }
  const nextEducationEntries = { ...data.educationEntries }
  const nextEducationBullets = { ...data.educationBullets }
  const nextProjects = { ...data.projects }
  const nextProjectBullets = { ...data.projectBullets }
  const nextAdditionalExperienceEntries = { ...data.additionalExperienceEntries }
  const nextAdditionalExperienceBullets = { ...data.additionalExperienceBullets }
  const nextCertifications = { ...data.certifications }
  const nextReferences = { ...data.references }

  delete nextProfiles[profileId]

  Object.values(data.profileLinks).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextProfileLinks[item.id]
    }
  })

  const skillCategoryIds = new Set<Id>()
  Object.values(data.skillCategories).forEach((item) => {
    if (item.profileId === profileId) {
      skillCategoryIds.add(item.id)
      delete nextSkillCategories[item.id]
    }
  })

  Object.values(data.skills).forEach((item) => {
    if (skillCategoryIds.has(item.skillCategoryId)) {
      delete nextSkills[item.id]
    }
  })

  Object.values(data.achievements).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextAchievements[item.id]
    }
  })

  const experienceEntryIds = new Set<Id>()
  Object.values(data.experienceEntries).forEach((item) => {
    if (item.profileId === profileId) {
      experienceEntryIds.add(item.id)
      delete nextExperienceEntries[item.id]
    }
  })

  Object.values(data.experienceBullets).forEach((item) => {
    if (experienceEntryIds.has(item.experienceEntryId)) {
      delete nextExperienceBullets[item.id]
    }
  })

  const educationEntryIds = new Set<Id>()
  Object.values(data.educationEntries).forEach((item) => {
    if (item.profileId === profileId) {
      educationEntryIds.add(item.id)
      delete nextEducationEntries[item.id]
    }
  })

  Object.values(data.educationBullets).forEach((item) => {
    if (educationEntryIds.has(item.educationEntryId)) {
      delete nextEducationBullets[item.id]
    }
  })

  const projectIds = new Set<Id>()
  Object.values(data.projects).forEach((item) => {
    if (item.profileId === profileId) {
      projectIds.add(item.id)
      delete nextProjects[item.id]
    }
  })

  Object.values(data.projectBullets).forEach((item) => {
    if (projectIds.has(item.projectId)) {
      delete nextProjectBullets[item.id]
    }
  })

  const additionalExperienceEntryIds = new Set<Id>()
  Object.values(data.additionalExperienceEntries).forEach((item) => {
    if (item.profileId === profileId) {
      additionalExperienceEntryIds.add(item.id)
      delete nextAdditionalExperienceEntries[item.id]
    }
  })

  Object.values(data.additionalExperienceBullets).forEach((item) => {
    if (additionalExperienceEntryIds.has(item.additionalExperienceEntryId)) {
      delete nextAdditionalExperienceBullets[item.id]
    }
  })

  Object.values(data.certifications).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextCertifications[item.id]
    }
  })

  Object.values(data.references).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextReferences[item.id]
    }
  })

  return {
    ...data,
    profiles: nextProfiles,
    profileLinks: nextProfileLinks,
    skillCategories: nextSkillCategories,
    skills: nextSkills,
    achievements: nextAchievements,
    experienceEntries: nextExperienceEntries,
    experienceBullets: nextExperienceBullets,
    educationEntries: nextEducationEntries,
    educationBullets: nextEducationBullets,
    projects: nextProjects,
    projectBullets: nextProjectBullets,
    additionalExperienceEntries: nextAdditionalExperienceEntries,
    additionalExperienceBullets: nextAdditionalExperienceBullets,
    certifications: nextCertifications,
    references: nextReferences,
  }
}

const deleteInterviewCascade = (data: AppDataState, interviewId: Id): AppDataState => {
  const nextInterviews = { ...data.interviews }
  const nextInterviewContacts = { ...data.interviewContacts }

  delete nextInterviews[interviewId]

  Object.values(data.interviewContacts).forEach((item) => {
    if (item.interviewId === interviewId) {
      delete nextInterviewContacts[item.id]
    }
  })

  return {
    ...data,
    interviews: nextInterviews,
    interviewContacts: nextInterviewContacts,
  }
}

const withResult = (data: AppDataState, createdId?: Id | null): JobMutationResult =>
  createdId === undefined ? { data } : { data, createdId }

export const createJobMutation = (data: AppDataState, input: CreateJobInput, context: JobMutationContext): JobMutationResult => {
  const timestamp = context.now()
  const initialLinkUrl = input.initialLinkUrl?.trim() ?? ''
  const job: Job = {
    id: context.createId(),
    companyName: input.companyName ?? '',
    staffingAgencyName: input.staffingAgencyName ?? '',
    jobTitle: input.jobTitle,
    description: input.description ?? '',
    location: input.location ?? '',
    postedCompensation: input.postedCompensation ?? '',
    desiredCompensation: input.desiredCompensation ?? '',
    compensationNotes: input.compensationNotes ?? '',
    workArrangement: input.workArrangement ?? 'unknown',
    employmentType: input.employmentType ?? 'other',
    datePosted: input.datePosted ?? null,
    appliedAt: null,
    finalOutcome: null,
    notes: input.notes ?? '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const initialJobLink: JobLink | null = initialLinkUrl
    ? {
        id: context.createId(),
        jobId: job.id,
        url: initialLinkUrl,
        sortOrder: 1,
        createdAt: timestamp,
      }
    : null

  return withResult(
    {
      ...data,
      jobs: {
        ...data.jobs,
        [job.id]: job,
      },
      jobLinks: initialJobLink
        ? {
            ...data.jobLinks,
            [initialJobLink.id]: initialJobLink,
          }
        : data.jobLinks,
    },
    job.id,
  )
}

export const updateJobMutation = (data: AppDataState, input: UpdateJobInput, context: JobMutationContext): JobMutationResult => {
  const existingJob = data.jobs[input.jobId]

  if (!existingJob) {
    return withResult(data)
  }

  return withResult({
    ...data,
    jobs: {
      ...data.jobs,
      [input.jobId]: {
        ...existingJob,
        ...input.changes,
        updatedAt: context.now(),
      },
    },
  })
}

export const deleteJobMutation = (data: AppDataState, jobId: Id): JobMutationResult => {
  let nextData = data

  Object.values(data.profiles)
    .filter((profile) => profile.jobId === jobId)
    .forEach((profile) => {
      nextData = deleteProfileCascade(nextData, profile.id)
    })

  const nextJobs = { ...nextData.jobs }
  const nextJobLinks = { ...nextData.jobLinks }
  const nextJobContacts = { ...nextData.jobContacts }
  const nextInterviews = { ...nextData.interviews }
  const nextInterviewContacts = { ...nextData.interviewContacts }
  const nextApplicationQuestions = { ...nextData.applicationQuestions }

  delete nextJobs[jobId]

  Object.values(nextData.jobLinks).forEach((item) => {
    if (item.jobId === jobId) {
      delete nextJobLinks[item.id]
    }
  })

  Object.values(nextData.jobContacts).forEach((item) => {
    if (item.jobId === jobId) {
      delete nextJobContacts[item.id]
    }
  })

  Object.values(nextData.interviews).forEach((item) => {
    if (item.jobId === jobId) {
      delete nextInterviews[item.id]
    }
  })

  Object.values(nextData.interviewContacts).forEach((item) => {
    const interview = nextData.interviews[item.interviewId]

    if (interview?.jobId === jobId) {
      delete nextInterviewContacts[item.id]
    }
  })

  Object.values(nextData.applicationQuestions).forEach((item) => {
    if (item.jobId === jobId) {
      delete nextApplicationQuestions[item.id]
    }
  })

  return withResult({
    ...nextData,
    jobs: nextJobs,
    jobLinks: nextJobLinks,
    jobContacts: nextJobContacts,
    interviews: nextInterviews,
    interviewContacts: nextInterviewContacts,
    applicationQuestions: nextApplicationQuestions,
  })
}

export const createJobLinkMutation = (data: AppDataState, jobId: Id, context: JobMutationContext): JobMutationResult => {
  if (!data.jobs[jobId]) {
    return withResult(data, null)
  }

  const jobLink: JobLink = {
    id: context.createId(),
    jobId,
    url: '',
    sortOrder: getNextSortOrder(
      Object.values(data.jobLinks)
        .filter((item) => item.jobId === jobId)
        .map((item) => item.sortOrder),
    ),
    createdAt: context.now(),
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobLinks: {
          ...data.jobLinks,
          [jobLink.id]: jobLink,
        },
      },
      jobId,
      context.now(),
    ),
    jobLink.id,
  )
}

export const updateJobLinkMutation = (data: AppDataState, input: UpdateJobLinkInput, context: JobMutationContext): JobMutationResult => {
  const existing = data.jobLinks[input.jobLinkId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobLinks: {
          ...data.jobLinks,
          [input.jobLinkId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.jobId,
      context.now(),
    ),
  )
}

export const deleteJobLinkMutation = (data: AppDataState, jobLinkId: Id, context: JobMutationContext): JobMutationResult => {
  const existing = data.jobLinks[jobLinkId]

  if (!existing) {
    return withResult(data)
  }

  const nextJobLinks = { ...data.jobLinks }
  delete nextJobLinks[jobLinkId]

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobLinks: nextJobLinks,
      },
      existing.jobId,
      context.now(),
    ),
  )
}

export const reorderJobLinksMutation = (data: AppDataState, input: ReorderJobEntitiesInput, context: JobMutationContext): JobMutationResult => {
  const existingIds = Object.values(data.jobLinks)
    .filter((item) => item.jobId === input.jobId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobLinks: reorderSortableEntities(data.jobLinks, input.orderedIds),
      },
      input.jobId,
      context.now(),
    ),
  )
}

export const createJobContactMutation = (data: AppDataState, jobId: Id, context: JobMutationContext): JobMutationResult => {
  const job = data.jobs[jobId]

  if (!job) {
    return withResult(data, null)
  }

  const organizationKind: ContactOrganizationKind = 'company'
  const company = job.companyName

  const jobContact: JobContact = {
    id: context.createId(),
    jobId,
    name: '',
    title: '',
    company,
    organizationKind,
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    notes: '',
    sortOrder: getNextSortOrder(
      Object.values(data.jobContacts)
        .filter((item) => item.jobId === jobId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobContacts: {
          ...data.jobContacts,
          [jobContact.id]: jobContact,
        },
      },
      jobId,
      context.now(),
    ),
    jobContact.id,
  )
}

export const updateJobContactMutation = (data: AppDataState, input: UpdateJobContactInput, context: JobMutationContext): JobMutationResult => {
  const existing = data.jobContacts[input.jobContactId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobContacts: {
          ...data.jobContacts,
          [input.jobContactId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.jobId,
      context.now(),
    ),
  )
}

export const deleteJobContactMutation = (data: AppDataState, jobContactId: Id, context: JobMutationContext): JobMutationResult => {
  const existing = data.jobContacts[jobContactId]

  if (!existing) {
    return withResult(data)
  }

  const nextJobContacts = { ...data.jobContacts }
  const nextInterviewContacts = { ...data.interviewContacts }
  delete nextJobContacts[jobContactId]

  Object.values(data.interviewContacts).forEach((item) => {
    if (item.jobContactId === jobContactId) {
      delete nextInterviewContacts[item.id]
    }
  })

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobContacts: nextJobContacts,
        interviewContacts: nextInterviewContacts,
      },
      existing.jobId,
      context.now(),
    ),
  )
}

export const reorderJobContactsMutation = (data: AppDataState, input: ReorderJobEntitiesInput, context: JobMutationContext): JobMutationResult => {
  const existingIds = Object.values(data.jobContacts)
    .filter((item) => item.jobId === input.jobId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        jobContacts: reorderSortableEntities(data.jobContacts, input.orderedIds),
      },
      input.jobId,
      context.now(),
    ),
  )
}

export const createApplicationQuestionMutation = (data: AppDataState, jobId: Id, context: JobMutationContext): JobMutationResult => {
  if (!data.jobs[jobId]) {
    return withResult(data, null)
  }

  const applicationQuestion: ApplicationQuestion = {
    id: context.createId(),
    jobId,
    question: '',
    answer: '',
    sortOrder: getNextSortOrder(
      Object.values(data.applicationQuestions)
        .filter((item) => item.jobId === jobId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        applicationQuestions: {
          ...data.applicationQuestions,
          [applicationQuestion.id]: applicationQuestion,
        },
      },
      jobId,
      context.now(),
    ),
    applicationQuestion.id,
  )
}

export const updateApplicationQuestionMutation = (data: AppDataState, input: UpdateApplicationQuestionInput, context: JobMutationContext): JobMutationResult => {
  const existing = data.applicationQuestions[input.applicationQuestionId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        applicationQuestions: {
          ...data.applicationQuestions,
          [input.applicationQuestionId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.jobId,
      context.now(),
    ),
  )
}

export const deleteApplicationQuestionMutation = (data: AppDataState, applicationQuestionId: Id, context: JobMutationContext): JobMutationResult => {
  const existing = data.applicationQuestions[applicationQuestionId]

  if (!existing) {
    return withResult(data)
  }

  const nextApplicationQuestions = { ...data.applicationQuestions }
  delete nextApplicationQuestions[applicationQuestionId]

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        applicationQuestions: nextApplicationQuestions,
      },
      existing.jobId,
      context.now(),
    ),
  )
}

export const reorderApplicationQuestionsMutation = (data: AppDataState, input: ReorderJobEntitiesInput, context: JobMutationContext): JobMutationResult => {
  const existingIds = Object.values(data.applicationQuestions)
    .filter((item) => item.jobId === input.jobId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        applicationQuestions: reorderSortableEntities(data.applicationQuestions, input.orderedIds),
      },
      input.jobId,
      context.now(),
    ),
  )
}

export const setJobAppliedAtMutation = (data: AppDataState, input: SetJobAppliedAtInput, context: JobMutationContext): JobMutationResult => {
  const existingJob = data.jobs[input.jobId]

  if (!existingJob) {
    return withResult(data)
  }

  return withResult({
    ...data,
    jobs: {
      ...data.jobs,
      [input.jobId]: {
        ...existingJob,
        appliedAt: input.appliedAt,
        updatedAt: context.now(),
      },
    },
  })
}

export const clearJobAppliedAtMutation = (data: AppDataState, jobId: Id, context: JobMutationContext): JobMutationResult => {
  const existingJob = data.jobs[jobId]

  if (!existingJob) {
    return withResult(data)
  }

  return withResult({
    ...data,
    jobs: {
      ...data.jobs,
      [jobId]: {
        ...existingJob,
        appliedAt: null,
        finalOutcome: null,
        updatedAt: context.now(),
      },
    },
  })
}

export const setJobFinalOutcomeMutation = (data: AppDataState, input: SetJobFinalOutcomeInput, context: JobMutationContext): JobMutationResult => {
  const existingJob = data.jobs[input.jobId]

  if (!existingJob || !existingJob.appliedAt) {
    return withResult(data)
  }

  const finalOutcome: FinalOutcome = { status: input.status, setAt: input.setAt }

  return withResult({
    ...data,
    jobs: {
      ...data.jobs,
      [input.jobId]: {
        ...existingJob,
        finalOutcome,
        updatedAt: context.now(),
      },
    },
  })
}

export const clearJobFinalOutcomeMutation = (data: AppDataState, jobId: Id, context: JobMutationContext): JobMutationResult => {
  const existingJob = data.jobs[jobId]

  if (!existingJob) {
    return withResult(data)
  }

  return withResult({
    ...data,
    jobs: {
      ...data.jobs,
      [jobId]: {
        ...existingJob,
        finalOutcome: null,
        updatedAt: context.now(),
      },
    },
  })
}

export const createInterviewMutation = (data: AppDataState, jobId: Id, context: JobMutationContext): JobMutationResult => {
  if (!data.jobs[jobId]) {
    return withResult(data, null)
  }

  const interview: Interview = {
    id: context.createId(),
    jobId,
    createdAt: context.now(),
    startAt: null,
    notes: '',
  }

  const timestamp = context.now()

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        interviews: {
          ...data.interviews,
          [interview.id]: interview,
        },
      },
      jobId,
      timestamp,
    ),
    interview.id,
  )
}

export const updateInterviewMutation = (data: AppDataState, input: UpdateInterviewInput, context: JobMutationContext): JobMutationResult => {
  const existing = data.interviews[input.interviewId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        interviews: {
          ...data.interviews,
          [input.interviewId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.jobId,
      context.now(),
    ),
  )
}

export const deleteInterviewMutation = (data: AppDataState, interviewId: Id, context: JobMutationContext): JobMutationResult => {
  const existing = data.interviews[interviewId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(stampUpdatedJob(deleteInterviewCascade(data, interviewId), existing.jobId, context.now()))
}

export const addInterviewContactMutation = (data: AppDataState, input: AddInterviewContactInput, context: JobMutationContext): JobMutationResult => {
  const interview = data.interviews[input.interviewId]
  const jobContact = data.jobContacts[input.jobContactId]

  if (!interview || !jobContact || interview.jobId !== jobContact.jobId) {
    return withResult(data)
  }

  const hasExistingAssociation = Object.values(data.interviewContacts).some(
    (item) => item.interviewId === input.interviewId && item.jobContactId === input.jobContactId,
  )

  if (hasExistingAssociation) {
    return withResult(data)
  }

  const interviewContact: InterviewContact = {
    id: context.createId(),
    interviewId: input.interviewId,
    jobContactId: input.jobContactId,
    sortOrder: getNextSortOrder(
      Object.values(data.interviewContacts)
        .filter((item) => item.interviewId === input.interviewId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        interviewContacts: {
          ...data.interviewContacts,
          [interviewContact.id]: interviewContact,
        },
      },
      interview.jobId,
      context.now(),
    ),
  )
}

export const removeInterviewContactMutation = (data: AppDataState, interviewContactId: Id, context: JobMutationContext): JobMutationResult => {
  const existing = data.interviewContacts[interviewContactId]

  if (!existing) {
    return withResult(data)
  }

  const interview = data.interviews[existing.interviewId]

  if (!interview) {
    return withResult(data)
  }

  const nextInterviewContacts = { ...data.interviewContacts }
  delete nextInterviewContacts[interviewContactId]

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        interviewContacts: nextInterviewContacts,
      },
      interview.jobId,
      context.now(),
    ),
  )
}

export const reorderInterviewContactsMutation = (data: AppDataState, input: ReorderInterviewContactsInput, context: JobMutationContext): JobMutationResult => {
  const interview = data.interviews[input.interviewId]

  if (!interview) {
    return withResult(data)
  }

  const existingIds = Object.values(data.interviewContacts)
    .filter((item) => item.interviewId === input.interviewId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedJob(
      {
        ...data,
        interviewContacts: reorderSortableEntities(data.interviewContacts, input.orderedIds),
      },
      interview.jobId,
      context.now(),
    ),
  )
}
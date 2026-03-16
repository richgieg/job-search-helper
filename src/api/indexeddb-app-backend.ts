import type {
  Achievement,
  AdditionalExperienceBullet,
  AdditionalExperienceEntry,
  AppDataState,
  AppExportFile,
  ApplicationQuestion,
  Certification,
  EducationBullet,
  EducationEntry,
  ExperienceBullet,
  ExperienceEntry,
  Interview,
  InterviewContact,
  IsoTimestamp,
  Job,
  JobContact,
  JobLink,
  Profile,
  ProfileLink,
  Project,
  ProjectBullet,
  Reference,
  Skill,
  SkillCategory,
} from '../types/state'
import { validateAppExportFile } from '../features/import-export/app-export-file'
import { getJobComputedStatus } from '../features/jobs/job-status'
import { createDocumentContacts, selectPrimaryContact } from '../features/documents/document-data'
import { compareInterviewsBySchedule } from '../utils/interview-sort'
import {
  AddInterviewContactInput,
  CreateJobInput,
  clearJobAppliedAtMutation,
  clearJobFinalOutcomeMutation,
  createApplicationQuestionMutation,
  createJobContactMutation,
  createJobLinkMutation,
  createJobMutation,
  createInterviewMutation,
  deleteApplicationQuestionMutation,
  deleteJobMutation,
  deleteJobContactMutation,
  deleteJobLinkMutation,
  deleteInterviewMutation,
  JobMutationResult,
  ReorderInterviewContactsInput,
  ReorderJobEntitiesInput,
  SetJobAppliedAtInput,
  SetJobFinalOutcomeInput,
  removeInterviewContactMutation,
  setJobAppliedAtMutation,
  setJobFinalOutcomeMutation,
  UpdateApplicationQuestionInput,
  UpdateInterviewInput,
  UpdateJobContactInput,
  UpdateJobInput,
  UpdateJobLinkInput,
  addInterviewContactMutation,
  reorderApplicationQuestionsMutation,
  reorderJobContactsMutation,
  reorderInterviewContactsMutation,
  updateApplicationQuestionMutation,
  updateInterviewMutation,
  updateJobContactMutation,
  reorderJobLinksMutation,
  updateJobLinkMutation,
  updateJobMutation,
} from '../domain/job-data'
import type { JobMutationContext } from '../domain/job-data'
import {
  createAchievementMutation,
  createBaseProfileMutation,
  createCertificationMutation,
  createProfileLinkMutation,
  createReferenceMutation,
  createSkillCategoryMutation,
  createSkillMutation,
  createExperienceBulletMutation,
  createExperienceEntryMutation,
  createEducationBulletMutation,
  createEducationEntryMutation,
  createProjectBulletMutation,
  createProjectMutation,
  createAdditionalExperienceBulletMutation,
  createAdditionalExperienceEntryMutation,
  deleteAchievementMutation,
  deleteCertificationMutation,
  deleteProfileMutation,
  deleteEducationBulletMutation,
  deleteEducationEntryMutation,
  deleteExperienceBulletMutation,
  deleteExperienceEntryMutation,
  deleteProjectBulletMutation,
  deleteProjectMutation,
  deleteAdditionalExperienceBulletMutation,
  deleteAdditionalExperienceEntryMutation,
  deleteProfileLinkMutation,
  deleteReferenceMutation,
  deleteSkillCategoryMutation,
  deleteSkillMutation,
  duplicateProfileMutation,
  DuplicateProfileInput,
  ProfileMutationResult,
  ReorderAdditionalExperienceBulletsInput,
  ReorderEducationBulletsInput,
  ReorderExperienceBulletsInput,
  ReorderProjectBulletsInput,
  ReorderProfileEntitiesInput,
  ReorderResumeSectionsInput,
  reorderAchievementsMutation,
  reorderCertificationsMutation,
  reorderEducationBulletsMutation,
  reorderEducationEntriesMutation,
  reorderExperienceBulletsMutation,
  reorderExperienceEntriesMutation,
  reorderProjectBulletsMutation,
  reorderProjectsMutation,
  reorderAdditionalExperienceBulletsMutation,
  reorderAdditionalExperienceEntriesMutation,
  reorderProfileLinksMutation,
  reorderReferencesMutation,
  reorderResumeSectionsMutation,
  reorderSkillCategoriesMutation,
  reorderSkillsMutation,
  setDocumentHeaderTemplateMutation,
  SetDocumentHeaderTemplateInput,
  setResumeSectionEnabledMutation,
  SetResumeSectionEnabledInput,
  setResumeSectionLabelMutation,
  SetResumeSectionLabelInput,
  UpdateAchievementInput,
  UpdateAdditionalExperienceBulletInput,
  UpdateAdditionalExperienceEntryInput,
  UpdateCertificationInput,
  UpdateReferenceInput,
  UpdateEducationBulletInput,
  UpdateEducationEntryInput,
  UpdateExperienceBulletInput,
  UpdateExperienceEntryInput,
  UpdateProfileInput,
  UpdateProfileLinkInput,
  UpdateProjectBulletInput,
  UpdateProjectInput,
  UpdateSkillCategoryInput,
  UpdateSkillInput,
  updateAchievementMutation,
  updateCertificationMutation,
  updateEducationBulletMutation,
  updateEducationEntryMutation,
  updateExperienceBulletMutation,
  updateExperienceEntryMutation,
  updateProjectBulletMutation,
  updateProjectMutation,
  updateAdditionalExperienceBulletMutation,
  updateAdditionalExperienceEntryMutation,
  updateProfileLinkMutation,
  updateProfileMutation,
  updateReferenceMutation,
  updateSkillCategoryMutation,
  updateSkillMutation,
} from '../domain/profile-data'
import type { ProfileMutationContext } from '../domain/profile-data'
import { createEmptyAppDataState } from '../domain/app-data-state'
import type { AppDataService } from './app-data-service'
import type {
  DashboardActivityDto,
  DashboardActivityPeriodDays,
  DashboardSummaryDto,
  JobDetailDto,
  JobsListDto,
  JobsListItemDto,
  ProfileDetailDto,
  ProfileDocumentDto,
  ProfilesListDto,
  ProfilesListItemDto,
} from './read-models'
import { createIndexedDbAppDataSnapshotRepository, deleteAppDatabase, openAppDatabase, type PersistedAppData } from './indexeddb'
import type { AppDatabaseOptions } from './indexeddb'

export interface IndexedDbAppBackendOptions extends AppDatabaseOptions {
  initialData?: AppDataState
  now?: () => IsoTimestamp
}

const toPersistedAppData = (data: AppDataState): PersistedAppData => {
  const { version: _version, exportedAt: _exportedAt, ...persistedData } = data
  return persistedData
}

const cloneAppData = (data: AppDataState): AppDataState => structuredClone(data)
const emptyCollectionUpdatedAt = '1970-01-01T00:00:00.000Z'
const compareSortOrder = <T extends { sortOrder: number }>(left: T, right: T) => left.sortOrder - right.sortOrder
const dayInMilliseconds = 24 * 60 * 60 * 1000
const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000

const getStartOfLocalDay = (value: Date) => {
  const nextValue = new Date(value)
  nextValue.setHours(0, 0, 0, 0)
  return nextValue
}

const isWithinLocalToday = (timestamp: string, now: Date) => {
  const value = new Date(timestamp).getTime()
  const start = getStartOfLocalDay(now).getTime()
  const end = start + dayInMilliseconds
  return value >= start && value < end
}

const isWithinLast7Days = (timestamp: string, now: Date) => {
  const value = new Date(timestamp).getTime()
  const nowTime = now.getTime()
  return value <= nowTime && value >= nowTime - sevenDaysInMilliseconds
}

const offerStatusesCountedAsReceived = new Set(['offer_received', 'offer_accepted'])

const formatLocalDateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isWithinDayRange = (timestamp: string, start: Date, end: Date, now: Date) => {
  const value = new Date(timestamp).getTime()
  const startTime = start.getTime()
  const endTime = Math.min(end.getTime(), now.getTime() + 1)
  return value >= startTime && value < endTime
}

const buildFallbackJob = (profile: Profile): Job => ({
  id: `document-job-${profile.id}`,
  companyName: 'Example Company',
  staffingAgencyName: 'Example Staffing Agency',
  jobTitle: 'Example Job',
  description: '',
  location: '',
  postedCompensation: '',
  desiredCompensation: '',
  compensationNotes: '',
  workArrangement: 'unknown',
  employmentType: 'unknown',
  datePosted: null,
  appliedAt: null,
  finalOutcome: null,
  notes: '',
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
})

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'))
    }
  })

const transactionToPromise = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
    }

    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'))
    }
  })

type SimpleProfileChildStoreName = 'achievements' | 'certifications' | 'references'

export class IndexedDbAppBackend implements AppDataService {
  private readonly now: () => IsoTimestamp
  private readonly databaseOptions: AppDatabaseOptions
  private readonly snapshotRepository
  private readonly initialData: PersistedAppData | null
  private initialDataApplied = false

  constructor(options: IndexedDbAppBackendOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString())
    this.databaseOptions = {
      ...(options.databaseName !== undefined ? { databaseName: options.databaseName } : {}),
      ...(options.databaseVersion !== undefined ? { databaseVersion: options.databaseVersion } : {}),
    }
    this.snapshotRepository = createIndexedDbAppDataSnapshotRepository({
      ...this.databaseOptions,
      now: this.now,
    })
    this.initialData = options.initialData ? toPersistedAppData(cloneAppData(options.initialData)) : null
  }

  private async ensureInitialized() {
    if (!this.initialData || this.initialDataApplied) {
      return
    }

    await this.snapshotRepository.replaceAppData(this.initialData)
    this.initialDataApplied = true
  }

  private async withDatabase<T>(operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
    const database = await openAppDatabase(this.databaseOptions)

    try {
      return await operation(database)
    } finally {
      database.close()
    }
  }

  private createJobMutationContext(): JobMutationContext {
    return {
      now: this.now,
      createId: () => crypto.randomUUID(),
    }
  }

  private createProfileMutationContext(): ProfileMutationContext {
    return {
      now: this.now,
      createId: () => crypto.randomUUID(),
    }
  }

  private async readRecordById<T>(storeName: string, id: string): Promise<T | undefined> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction([storeName], 'readonly')
      const record = await requestToPromise(transaction.objectStore(storeName).get(id)) as T | undefined
      await transactionToPromise(transaction)
      return record
    })
  }

  private async readRecordsByIndex<T>(storeName: string, indexName: string, value: IDBValidKey | IDBKeyRange): Promise<T[]> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction([storeName], 'readonly')
      const records = await requestToPromise(transaction.objectStore(storeName).index(indexName).getAll(value)) as T[]
      await transactionToPromise(transaction)
      return records
    })
  }

  private async writeRecords(storeName: string, records: Array<{ id: string }>): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction([storeName], 'readwrite')
      const objectStore = transaction.objectStore(storeName)

      await Promise.all(records.map((record) => requestToPromise(objectStore.put(record))))
      await transactionToPromise(transaction)
    })
  }

  private async writeProfileWithLinks(profile: Profile, profileLinks: ProfileLink[], deletedProfileLinkIds: string[] = []): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'profileLinks'], 'readwrite')
      const profilesStore = transaction.objectStore('profiles')
      const profileLinksStore = transaction.objectStore('profileLinks')

      await requestToPromise(profilesStore.put(profile))
      await Promise.all(deletedProfileLinkIds.map((profileLinkId) => requestToPromise(profileLinksStore.delete(profileLinkId))))
      await Promise.all(profileLinks.map((profileLink) => requestToPromise(profileLinksStore.put(profileLink))))
      await transactionToPromise(transaction)
    })
  }

  private async writeProfileWithRecords<T extends { id: string }>(
    storeName: SimpleProfileChildStoreName,
    profile: Profile,
    records: T[],
    deletedIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', storeName], 'readwrite')
      const profilesStore = transaction.objectStore('profiles')
      const recordsStore = transaction.objectStore(storeName)

      await requestToPromise(profilesStore.put(profile))
      await Promise.all(deletedIds.map((id) => requestToPromise(recordsStore.delete(id))))
      await Promise.all(records.map((record) => requestToPromise(recordsStore.put(record))))
      await transactionToPromise(transaction)
    })
  }

  private async writeProfileWithSkillGraph(
    profile: Profile,
    skillCategories: SkillCategory[],
    skills: Skill[],
    deletedSkillCategoryIds: string[] = [],
    deletedSkillIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'skillCategories', 'skills'], 'readwrite')
      const profilesStore = transaction.objectStore('profiles')
      const skillCategoriesStore = transaction.objectStore('skillCategories')
      const skillsStore = transaction.objectStore('skills')

      await requestToPromise(profilesStore.put(profile))
      await Promise.all(deletedSkillIds.map((skillId) => requestToPromise(skillsStore.delete(skillId))))
      await Promise.all(deletedSkillCategoryIds.map((skillCategoryId) => requestToPromise(skillCategoriesStore.delete(skillCategoryId))))
      await Promise.all(skillCategories.map((skillCategory) => requestToPromise(skillCategoriesStore.put(skillCategory))))
      await Promise.all(skills.map((skill) => requestToPromise(skillsStore.put(skill))))
      await transactionToPromise(transaction)
    })
  }

  private async writeProfileWithExperienceGraph(
    profile: Profile,
    experienceEntries: ExperienceEntry[],
    experienceBullets: ExperienceBullet[],
    deletedExperienceEntryIds: string[] = [],
    deletedExperienceBulletIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'experienceEntries', 'experienceBullets'], 'readwrite')
      const profilesStore = transaction.objectStore('profiles')
      const experienceEntriesStore = transaction.objectStore('experienceEntries')
      const experienceBulletsStore = transaction.objectStore('experienceBullets')

      await requestToPromise(profilesStore.put(profile))
      await Promise.all(deletedExperienceBulletIds.map((id) => requestToPromise(experienceBulletsStore.delete(id))))
      await Promise.all(deletedExperienceEntryIds.map((id) => requestToPromise(experienceEntriesStore.delete(id))))
      await Promise.all(experienceEntries.map((entry) => requestToPromise(experienceEntriesStore.put(entry))))
      await Promise.all(experienceBullets.map((bullet) => requestToPromise(experienceBulletsStore.put(bullet))))
      await transactionToPromise(transaction)
    })
  }

  private async writeProfileWithEducationGraph(
    profile: Profile,
    educationEntries: EducationEntry[],
    educationBullets: EducationBullet[],
    deletedEducationEntryIds: string[] = [],
    deletedEducationBulletIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'educationEntries', 'educationBullets'], 'readwrite')
      const profilesStore = transaction.objectStore('profiles')
      const educationEntriesStore = transaction.objectStore('educationEntries')
      const educationBulletsStore = transaction.objectStore('educationBullets')

      await requestToPromise(profilesStore.put(profile))
      await Promise.all(deletedEducationBulletIds.map((id) => requestToPromise(educationBulletsStore.delete(id))))
      await Promise.all(deletedEducationEntryIds.map((id) => requestToPromise(educationEntriesStore.delete(id))))
      await Promise.all(educationEntries.map((entry) => requestToPromise(educationEntriesStore.put(entry))))
      await Promise.all(educationBullets.map((bullet) => requestToPromise(educationBulletsStore.put(bullet))))
      await transactionToPromise(transaction)
    })
  }

  private async writeProfileWithProjectGraph(
    profile: Profile,
    projects: Project[],
    projectBullets: ProjectBullet[],
    deletedProjectIds: string[] = [],
    deletedProjectBulletIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'projects', 'projectBullets'], 'readwrite')
      const profilesStore = transaction.objectStore('profiles')
      const projectsStore = transaction.objectStore('projects')
      const projectBulletsStore = transaction.objectStore('projectBullets')

      await requestToPromise(profilesStore.put(profile))
      await Promise.all(deletedProjectBulletIds.map((id) => requestToPromise(projectBulletsStore.delete(id))))
      await Promise.all(deletedProjectIds.map((id) => requestToPromise(projectsStore.delete(id))))
      await Promise.all(projects.map((project) => requestToPromise(projectsStore.put(project))))
      await Promise.all(projectBullets.map((bullet) => requestToPromise(projectBulletsStore.put(bullet))))
      await transactionToPromise(transaction)
    })
  }

  private async writeProfileWithAdditionalExperienceGraph(
    profile: Profile,
    additionalExperienceEntries: AdditionalExperienceEntry[],
    additionalExperienceBullets: AdditionalExperienceBullet[],
    deletedAdditionalExperienceEntryIds: string[] = [],
    deletedAdditionalExperienceBulletIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'additionalExperienceEntries', 'additionalExperienceBullets'], 'readwrite')
      const profilesStore = transaction.objectStore('profiles')
      const additionalExperienceEntriesStore = transaction.objectStore('additionalExperienceEntries')
      const additionalExperienceBulletsStore = transaction.objectStore('additionalExperienceBullets')

      await requestToPromise(profilesStore.put(profile))
      await Promise.all(deletedAdditionalExperienceBulletIds.map((id) => requestToPromise(additionalExperienceBulletsStore.delete(id))))
      await Promise.all(deletedAdditionalExperienceEntryIds.map((id) => requestToPromise(additionalExperienceEntriesStore.delete(id))))
      await Promise.all(additionalExperienceEntries.map((entry) => requestToPromise(additionalExperienceEntriesStore.put(entry))))
      await Promise.all(additionalExperienceBullets.map((bullet) => requestToPromise(additionalExperienceBulletsStore.put(bullet))))
      await transactionToPromise(transaction)
    })
  }

  private async writeJobWithLinks(job: Job, jobLinks: JobLink[], deletedJobLinkIds: string[] = []): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['jobs', 'jobLinks'], 'readwrite')
      const jobsStore = transaction.objectStore('jobs')
      const jobLinksStore = transaction.objectStore('jobLinks')

      await requestToPromise(jobsStore.put(job))
      await Promise.all(deletedJobLinkIds.map((jobLinkId) => requestToPromise(jobLinksStore.delete(jobLinkId))))
      await Promise.all(jobLinks.map((link) => requestToPromise(jobLinksStore.put(link))))
      await transactionToPromise(transaction)
    })
  }

  private async writeJobWithContacts(
    job: Job,
    jobContacts: JobContact[],
    interviewContacts: InterviewContact[],
    deletedJobContactIds: string[] = [],
    deletedInterviewContactIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['jobs', 'jobContacts', 'interviewContacts'], 'readwrite')
      const jobsStore = transaction.objectStore('jobs')
      const jobContactsStore = transaction.objectStore('jobContacts')
      const interviewContactsStore = transaction.objectStore('interviewContacts')

      await requestToPromise(jobsStore.put(job))
      await Promise.all(deletedInterviewContactIds.map((interviewContactId) => requestToPromise(interviewContactsStore.delete(interviewContactId))))
      await Promise.all(deletedJobContactIds.map((jobContactId) => requestToPromise(jobContactsStore.delete(jobContactId))))
      await Promise.all(jobContacts.map((jobContact) => requestToPromise(jobContactsStore.put(jobContact))))
      await Promise.all(interviewContacts.map((interviewContact) => requestToPromise(interviewContactsStore.put(interviewContact))))
      await transactionToPromise(transaction)
    })
  }

  private async writeJobWithApplicationQuestions(
    job: Job,
    applicationQuestions: ApplicationQuestion[],
    deletedApplicationQuestionIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['jobs', 'applicationQuestions'], 'readwrite')
      const jobsStore = transaction.objectStore('jobs')
      const applicationQuestionsStore = transaction.objectStore('applicationQuestions')

      await requestToPromise(jobsStore.put(job))
      await Promise.all(
        deletedApplicationQuestionIds.map((applicationQuestionId) => requestToPromise(applicationQuestionsStore.delete(applicationQuestionId))),
      )
      await Promise.all(applicationQuestions.map((applicationQuestion) => requestToPromise(applicationQuestionsStore.put(applicationQuestion))))
      await transactionToPromise(transaction)
    })
  }

  private async writeJobWithInterviews(
    job: Job,
    interviews: Interview[],
    interviewContacts: InterviewContact[],
    deletedInterviewIds: string[] = [],
    deletedInterviewContactIds: string[] = [],
  ): Promise<void> {
    await this.ensureInitialized()

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(['jobs', 'interviews', 'interviewContacts'], 'readwrite')
      const jobsStore = transaction.objectStore('jobs')
      const interviewsStore = transaction.objectStore('interviews')
      const interviewContactsStore = transaction.objectStore('interviewContacts')

      await requestToPromise(jobsStore.put(job))
      await Promise.all(deletedInterviewContactIds.map((id) => requestToPromise(interviewContactsStore.delete(id))))
      await Promise.all(deletedInterviewIds.map((id) => requestToPromise(interviewsStore.delete(id))))
      await Promise.all(interviews.map((interview) => requestToPromise(interviewsStore.put(interview))))
      await Promise.all(interviewContacts.map((interviewContact) => requestToPromise(interviewContactsStore.put(interviewContact))))
      await transactionToPromise(transaction)
    })
  }

  private async deleteRecordsFromStores(storeDeletions: Array<{ storeName: string; ids: string[] }>): Promise<void> {
    await this.ensureInitialized()

    const activeDeletions = storeDeletions.filter((deletion) => deletion.ids.length > 0)

    if (activeDeletions.length === 0) {
      return
    }

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(activeDeletions.map((deletion) => deletion.storeName), 'readwrite')

      await Promise.all(
        activeDeletions.flatMap(({ storeName, ids }) => {
          const store = transaction.objectStore(storeName)
          return ids.map((id) => requestToPromise(store.delete(id)))
        }),
      )

      await transactionToPromise(transaction)
    })
  }

  private async writeRecordsToStores(storeWrites: Array<{ storeName: string; records: Array<{ id: string }> }>): Promise<void> {
    await this.ensureInitialized()

    const activeWrites = storeWrites.filter((write) => write.records.length > 0)

    if (activeWrites.length === 0) {
      return
    }

    await this.withDatabase(async (database) => {
      const transaction = database.transaction(activeWrites.map((write) => write.storeName), 'readwrite')

      await Promise.all(
        activeWrites.flatMap(({ storeName, records }) => {
          const store = transaction.objectStore(storeName)
          return records.map((record) => requestToPromise(store.put(record)))
        }),
      )

      await transactionToPromise(transaction)
    })
  }

  private async finalizeProfileMutationResult(
    partialResult: Omit<ProfileMutationResult, 'data'> & { data?: AppDataState },
  ): Promise<ProfileMutationResult> {
    return {
      ...partialResult,
      data: await this.snapshotRepository.readAppData(),
    }
  }

  private async finalizeJobMutationResult(
    partialResult: Omit<JobMutationResult, 'data'> & { data?: AppDataState },
  ): Promise<JobMutationResult> {
    return {
      ...partialResult,
      data: await this.snapshotRepository.readAppData(),
    }
  }

  private async applyProfileRootMutation(
    profileId: string,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const existingProfile = await this.readRecordById<Profile>('profiles', profileId)

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (nextProfile) {
      await this.writeRecords('profiles', [nextProfile])
    }

    return this.finalizeProfileMutationResult(result)
  }

  private async applyProfileLinksMutation(
    profileId: string,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const [existingProfile, existingProfileLinks] = await Promise.all([
      this.readRecordById<Profile>('profiles', profileId),
      this.readRecordsByIndex<ProfileLink>('profileLinks', 'profileId', profileId),
    ])

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    existingProfileLinks.forEach((profileLink) => {
      mutationData.profileLinks[profileLink.id] = profileLink
    })

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (!nextProfile) {
      return this.finalizeProfileMutationResult(result)
    }

    const nextProfileLinks = Object.values(result.data.profileLinks).filter((profileLink) => profileLink.profileId === profileId)
    const deletedProfileLinkIds = existingProfileLinks
      .map((profileLink) => profileLink.id)
      .filter((profileLinkId) => !result.data.profileLinks[profileLinkId])

    await this.writeProfileWithLinks(nextProfile, nextProfileLinks, deletedProfileLinkIds)

    return this.finalizeProfileMutationResult(result)
  }

  private async applySimpleProfileChildMutation<T extends { id: string; profileId: string }>(
    profileId: string,
    storeName: SimpleProfileChildStoreName,
    selectCollection: (data: AppDataState) => Record<string, T>,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const [existingProfile, existingRecords] = await Promise.all([
      this.readRecordById<Profile>('profiles', profileId),
      this.readRecordsByIndex<T>(storeName, 'profileId', profileId),
    ])

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    const collection = selectCollection(mutationData)

    existingRecords.forEach((record) => {
      collection[record.id] = record
    })

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (!nextProfile) {
      return this.finalizeProfileMutationResult(result)
    }

    const nextCollection = selectCollection(result.data)
    const nextRecords = Object.values(nextCollection).filter((record) => record.profileId === profileId)
    const deletedIds = existingRecords.map((record) => record.id).filter((id) => !nextCollection[id])

    await this.writeProfileWithRecords(storeName, nextProfile, nextRecords, deletedIds)

    return this.finalizeProfileMutationResult(result)
  }

  private async applyProfileSkillsMutation(
    profileId: string,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const [existingProfile, existingSkillCategories] = await Promise.all([
      this.readRecordById<Profile>('profiles', profileId),
      this.readRecordsByIndex<SkillCategory>('skillCategories', 'profileId', profileId),
    ])

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const existingSkillsByCategory = await Promise.all(
      existingSkillCategories.map((skillCategory) => this.readRecordsByIndex<Skill>('skills', 'skillCategoryId', skillCategory.id)),
    )
    const existingSkills = existingSkillsByCategory.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    existingSkillCategories.forEach((skillCategory) => {
      mutationData.skillCategories[skillCategory.id] = skillCategory
    })
    existingSkills.forEach((skill) => {
      mutationData.skills[skill.id] = skill
    })

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (!nextProfile) {
      return this.finalizeProfileMutationResult(result)
    }

    const nextSkillCategories = Object.values(result.data.skillCategories).filter((skillCategory) => skillCategory.profileId === profileId)
    const nextCategoryIds = new Set(nextSkillCategories.map((skillCategory) => skillCategory.id))
    const nextSkills = Object.values(result.data.skills).filter((skill) => nextCategoryIds.has(skill.skillCategoryId))
    const deletedSkillCategoryIds = existingSkillCategories.map((skillCategory) => skillCategory.id).filter((id) => !result.data.skillCategories[id])
    const deletedSkillIds = existingSkills.map((skill) => skill.id).filter((id) => !result.data.skills[id])

    await this.writeProfileWithSkillGraph(nextProfile, nextSkillCategories, nextSkills, deletedSkillCategoryIds, deletedSkillIds)

    return this.finalizeProfileMutationResult(result)
  }

  private async applyProfileExperienceMutation(
    profileId: string,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const [existingProfile, existingExperienceEntries] = await Promise.all([
      this.readRecordById<Profile>('profiles', profileId),
      this.readRecordsByIndex<ExperienceEntry>('experienceEntries', 'profileId', profileId),
    ])

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const existingBulletsByEntry = await Promise.all(
      existingExperienceEntries.map((entry) => this.readRecordsByIndex<ExperienceBullet>('experienceBullets', 'experienceEntryId', entry.id)),
    )
    const existingExperienceBullets = existingBulletsByEntry.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    existingExperienceEntries.forEach((entry) => {
      mutationData.experienceEntries[entry.id] = entry
    })
    existingExperienceBullets.forEach((bullet) => {
      mutationData.experienceBullets[bullet.id] = bullet
    })

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (!nextProfile) {
      return this.finalizeProfileMutationResult(result)
    }

    const nextExperienceEntries = Object.values(result.data.experienceEntries).filter((entry) => entry.profileId === profileId)
    const nextEntryIds = new Set(nextExperienceEntries.map((entry) => entry.id))
    const nextExperienceBullets = Object.values(result.data.experienceBullets).filter((bullet) => nextEntryIds.has(bullet.experienceEntryId))
    const deletedExperienceEntryIds = existingExperienceEntries.map((entry) => entry.id).filter((id) => !result.data.experienceEntries[id])
    const deletedExperienceBulletIds = existingExperienceBullets.map((bullet) => bullet.id).filter((id) => !result.data.experienceBullets[id])

    await this.writeProfileWithExperienceGraph(
      nextProfile,
      nextExperienceEntries,
      nextExperienceBullets,
      deletedExperienceEntryIds,
      deletedExperienceBulletIds,
    )

    return this.finalizeProfileMutationResult(result)
  }

  private async applyProfileEducationMutation(
    profileId: string,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const [existingProfile, existingEducationEntries] = await Promise.all([
      this.readRecordById<Profile>('profiles', profileId),
      this.readRecordsByIndex<EducationEntry>('educationEntries', 'profileId', profileId),
    ])

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const existingBulletsByEntry = await Promise.all(
      existingEducationEntries.map((entry) => this.readRecordsByIndex<EducationBullet>('educationBullets', 'educationEntryId', entry.id)),
    )
    const existingEducationBullets = existingBulletsByEntry.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    existingEducationEntries.forEach((entry) => {
      mutationData.educationEntries[entry.id] = entry
    })
    existingEducationBullets.forEach((bullet) => {
      mutationData.educationBullets[bullet.id] = bullet
    })

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (!nextProfile) {
      return this.finalizeProfileMutationResult(result)
    }

    const nextEducationEntries = Object.values(result.data.educationEntries).filter((entry) => entry.profileId === profileId)
    const nextEntryIds = new Set(nextEducationEntries.map((entry) => entry.id))
    const nextEducationBullets = Object.values(result.data.educationBullets).filter((bullet) => nextEntryIds.has(bullet.educationEntryId))
    const deletedEducationEntryIds = existingEducationEntries.map((entry) => entry.id).filter((id) => !result.data.educationEntries[id])
    const deletedEducationBulletIds = existingEducationBullets.map((bullet) => bullet.id).filter((id) => !result.data.educationBullets[id])

    await this.writeProfileWithEducationGraph(
      nextProfile,
      nextEducationEntries,
      nextEducationBullets,
      deletedEducationEntryIds,
      deletedEducationBulletIds,
    )

    return this.finalizeProfileMutationResult(result)
  }

  private async applyProfileProjectMutation(
    profileId: string,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const [existingProfile, existingProjects] = await Promise.all([
      this.readRecordById<Profile>('profiles', profileId),
      this.readRecordsByIndex<Project>('projects', 'profileId', profileId),
    ])

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const existingBulletsByProject = await Promise.all(
      existingProjects.map((project) => this.readRecordsByIndex<ProjectBullet>('projectBullets', 'projectId', project.id)),
    )
    const existingProjectBullets = existingBulletsByProject.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    existingProjects.forEach((project) => {
      mutationData.projects[project.id] = project
    })
    existingProjectBullets.forEach((bullet) => {
      mutationData.projectBullets[bullet.id] = bullet
    })

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (!nextProfile) {
      return this.finalizeProfileMutationResult(result)
    }

    const nextProjects = Object.values(result.data.projects).filter((project) => project.profileId === profileId)
    const nextProjectIds = new Set(nextProjects.map((project) => project.id))
    const nextProjectBullets = Object.values(result.data.projectBullets).filter((bullet) => nextProjectIds.has(bullet.projectId))
    const deletedProjectIds = existingProjects.map((project) => project.id).filter((id) => !result.data.projects[id])
    const deletedProjectBulletIds = existingProjectBullets.map((bullet) => bullet.id).filter((id) => !result.data.projectBullets[id])

    await this.writeProfileWithProjectGraph(nextProfile, nextProjects, nextProjectBullets, deletedProjectIds, deletedProjectBulletIds)

    return this.finalizeProfileMutationResult(result)
  }

  private async applyProfileAdditionalExperienceMutation(
    profileId: string,
    mutation: (data: AppDataState, context: ProfileMutationContext) => ProfileMutationResult,
  ): Promise<ProfileMutationResult> {
    const [existingProfile, existingAdditionalExperienceEntries] = await Promise.all([
      this.readRecordById<Profile>('profiles', profileId),
      this.readRecordsByIndex<AdditionalExperienceEntry>('additionalExperienceEntries', 'profileId', profileId),
    ])

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const existingBulletsByEntry = await Promise.all(
      existingAdditionalExperienceEntries.map((entry) =>
        this.readRecordsByIndex<AdditionalExperienceBullet>('additionalExperienceBullets', 'additionalExperienceEntryId', entry.id),
      ),
    )
    const existingAdditionalExperienceBullets = existingBulletsByEntry.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    existingAdditionalExperienceEntries.forEach((entry) => {
      mutationData.additionalExperienceEntries[entry.id] = entry
    })
    existingAdditionalExperienceBullets.forEach((bullet) => {
      mutationData.additionalExperienceBullets[bullet.id] = bullet
    })

    const result = mutation(mutationData, this.createProfileMutationContext())
    const nextProfile = result.data.profiles[profileId]

    if (!nextProfile) {
      return this.finalizeProfileMutationResult(result)
    }

    const nextAdditionalExperienceEntries = Object.values(result.data.additionalExperienceEntries).filter((entry) => entry.profileId === profileId)
    const nextEntryIds = new Set(nextAdditionalExperienceEntries.map((entry) => entry.id))
    const nextAdditionalExperienceBullets = Object.values(result.data.additionalExperienceBullets).filter((bullet) =>
      nextEntryIds.has(bullet.additionalExperienceEntryId),
    )
    const deletedAdditionalExperienceEntryIds = existingAdditionalExperienceEntries
      .map((entry) => entry.id)
      .filter((id) => !result.data.additionalExperienceEntries[id])
    const deletedAdditionalExperienceBulletIds = existingAdditionalExperienceBullets
      .map((bullet) => bullet.id)
      .filter((id) => !result.data.additionalExperienceBullets[id])

    await this.writeProfileWithAdditionalExperienceGraph(
      nextProfile,
      nextAdditionalExperienceEntries,
      nextAdditionalExperienceBullets,
      deletedAdditionalExperienceEntryIds,
      deletedAdditionalExperienceBulletIds,
    )

    return this.finalizeProfileMutationResult(result)
  }

  private async deleteProfileDirectly(profileId: string): Promise<ProfileMutationResult> {
    const existingProfile = await this.readRecordById<Profile>('profiles', profileId)

    if (!existingProfile) {
      return this.finalizeProfileMutationResult({})
    }

    const [
      existingProfileLinks,
      existingSkillCategories,
      existingAchievements,
      existingExperienceEntries,
      existingEducationEntries,
      existingProjects,
      existingAdditionalExperienceEntries,
      existingCertifications,
      existingReferences,
    ] = await Promise.all([
      this.readRecordsByIndex<ProfileLink>('profileLinks', 'profileId', profileId),
      this.readRecordsByIndex<SkillCategory>('skillCategories', 'profileId', profileId),
      this.readRecordsByIndex<Achievement>('achievements', 'profileId', profileId),
      this.readRecordsByIndex<ExperienceEntry>('experienceEntries', 'profileId', profileId),
      this.readRecordsByIndex<EducationEntry>('educationEntries', 'profileId', profileId),
      this.readRecordsByIndex<Project>('projects', 'profileId', profileId),
      this.readRecordsByIndex<AdditionalExperienceEntry>('additionalExperienceEntries', 'profileId', profileId),
      this.readRecordsByIndex<Certification>('certifications', 'profileId', profileId),
      this.readRecordsByIndex<Reference>('references', 'profileId', profileId),
    ])

    const [existingSkillsByCategory, existingExperienceBulletsByEntry, existingEducationBulletsByEntry, existingProjectBulletsByProject, existingAdditionalExperienceBulletsByEntry] =
      await Promise.all([
        Promise.all(existingSkillCategories.map((category) => this.readRecordsByIndex<Skill>('skills', 'skillCategoryId', category.id))),
        Promise.all(existingExperienceEntries.map((entry) => this.readRecordsByIndex<ExperienceBullet>('experienceBullets', 'experienceEntryId', entry.id))),
        Promise.all(existingEducationEntries.map((entry) => this.readRecordsByIndex<EducationBullet>('educationBullets', 'educationEntryId', entry.id))),
        Promise.all(existingProjects.map((project) => this.readRecordsByIndex<ProjectBullet>('projectBullets', 'projectId', project.id))),
        Promise.all(
          existingAdditionalExperienceEntries.map((entry) =>
            this.readRecordsByIndex<AdditionalExperienceBullet>('additionalExperienceBullets', 'additionalExperienceEntryId', entry.id),
          ),
        ),
      ])

    const existingSkills = existingSkillsByCategory.flat()
    const existingExperienceBullets = existingExperienceBulletsByEntry.flat()
    const existingEducationBullets = existingEducationBulletsByEntry.flat()
    const existingProjectBullets = existingProjectBulletsByProject.flat()
    const existingAdditionalExperienceBullets = existingAdditionalExperienceBulletsByEntry.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[profileId] = existingProfile
    existingProfileLinks.forEach((item) => {
      mutationData.profileLinks[item.id] = item
    })
    existingSkillCategories.forEach((item) => {
      mutationData.skillCategories[item.id] = item
    })
    existingSkills.forEach((item) => {
      mutationData.skills[item.id] = item
    })
    existingAchievements.forEach((item) => {
      mutationData.achievements[item.id] = item
    })
    existingExperienceEntries.forEach((item) => {
      mutationData.experienceEntries[item.id] = item
    })
    existingExperienceBullets.forEach((item) => {
      mutationData.experienceBullets[item.id] = item
    })
    existingEducationEntries.forEach((item) => {
      mutationData.educationEntries[item.id] = item
    })
    existingEducationBullets.forEach((item) => {
      mutationData.educationBullets[item.id] = item
    })
    existingProjects.forEach((item) => {
      mutationData.projects[item.id] = item
    })
    existingProjectBullets.forEach((item) => {
      mutationData.projectBullets[item.id] = item
    })
    existingAdditionalExperienceEntries.forEach((item) => {
      mutationData.additionalExperienceEntries[item.id] = item
    })
    existingAdditionalExperienceBullets.forEach((item) => {
      mutationData.additionalExperienceBullets[item.id] = item
    })
    existingCertifications.forEach((item) => {
      mutationData.certifications[item.id] = item
    })
    existingReferences.forEach((item) => {
      mutationData.references[item.id] = item
    })

    const result = deleteProfileMutation(mutationData, profileId)

    await this.deleteRecordsFromStores([
      { storeName: 'profiles', ids: [profileId] },
      { storeName: 'profileLinks', ids: existingProfileLinks.map((item) => item.id).filter((id) => !result.data.profileLinks[id]) },
      { storeName: 'skillCategories', ids: existingSkillCategories.map((item) => item.id).filter((id) => !result.data.skillCategories[id]) },
      { storeName: 'skills', ids: existingSkills.map((item) => item.id).filter((id) => !result.data.skills[id]) },
      { storeName: 'achievements', ids: existingAchievements.map((item) => item.id).filter((id) => !result.data.achievements[id]) },
      { storeName: 'experienceEntries', ids: existingExperienceEntries.map((item) => item.id).filter((id) => !result.data.experienceEntries[id]) },
      { storeName: 'experienceBullets', ids: existingExperienceBullets.map((item) => item.id).filter((id) => !result.data.experienceBullets[id]) },
      { storeName: 'educationEntries', ids: existingEducationEntries.map((item) => item.id).filter((id) => !result.data.educationEntries[id]) },
      { storeName: 'educationBullets', ids: existingEducationBullets.map((item) => item.id).filter((id) => !result.data.educationBullets[id]) },
      { storeName: 'projects', ids: existingProjects.map((item) => item.id).filter((id) => !result.data.projects[id]) },
      { storeName: 'projectBullets', ids: existingProjectBullets.map((item) => item.id).filter((id) => !result.data.projectBullets[id]) },
      {
        storeName: 'additionalExperienceEntries',
        ids: existingAdditionalExperienceEntries.map((item) => item.id).filter((id) => !result.data.additionalExperienceEntries[id]),
      },
      {
        storeName: 'additionalExperienceBullets',
        ids: existingAdditionalExperienceBullets.map((item) => item.id).filter((id) => !result.data.additionalExperienceBullets[id]),
      },
      { storeName: 'certifications', ids: existingCertifications.map((item) => item.id).filter((id) => !result.data.certifications[id]) },
      { storeName: 'references', ids: existingReferences.map((item) => item.id).filter((id) => !result.data.references[id]) },
    ])

    return this.finalizeProfileMutationResult(result)
  }

  private async duplicateProfileDirectly(input: DuplicateProfileInput): Promise<ProfileMutationResult> {
    const sourceProfile = await this.readRecordById<Profile>('profiles', input.sourceProfileId)

    if (!sourceProfile) {
      return this.finalizeProfileMutationResult({ createdId: null })
    }

    const targetJob = input.targetJobId ? await this.readRecordById<Job>('jobs', input.targetJobId) : undefined

    if (input.targetJobId !== undefined && input.targetJobId !== null && !targetJob) {
      return this.finalizeProfileMutationResult({ createdId: null })
    }

    const [
      existingProfileLinks,
      existingSkillCategories,
      existingAchievements,
      existingExperienceEntries,
      existingEducationEntries,
      existingProjects,
      existingAdditionalExperienceEntries,
      existingCertifications,
      existingReferences,
    ] = await Promise.all([
      this.readRecordsByIndex<ProfileLink>('profileLinks', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<SkillCategory>('skillCategories', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<Achievement>('achievements', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<ExperienceEntry>('experienceEntries', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<EducationEntry>('educationEntries', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<Project>('projects', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<AdditionalExperienceEntry>('additionalExperienceEntries', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<Certification>('certifications', 'profileId', input.sourceProfileId),
      this.readRecordsByIndex<Reference>('references', 'profileId', input.sourceProfileId),
    ])

    const [existingSkillsByCategory, existingExperienceBulletsByEntry, existingEducationBulletsByEntry, existingProjectBulletsByProject, existingAdditionalExperienceBulletsByEntry] =
      await Promise.all([
        Promise.all(existingSkillCategories.map((category) => this.readRecordsByIndex<Skill>('skills', 'skillCategoryId', category.id))),
        Promise.all(existingExperienceEntries.map((entry) => this.readRecordsByIndex<ExperienceBullet>('experienceBullets', 'experienceEntryId', entry.id))),
        Promise.all(existingEducationEntries.map((entry) => this.readRecordsByIndex<EducationBullet>('educationBullets', 'educationEntryId', entry.id))),
        Promise.all(existingProjects.map((project) => this.readRecordsByIndex<ProjectBullet>('projectBullets', 'projectId', project.id))),
        Promise.all(
          existingAdditionalExperienceEntries.map((entry) =>
            this.readRecordsByIndex<AdditionalExperienceBullet>('additionalExperienceBullets', 'additionalExperienceEntryId', entry.id),
          ),
        ),
      ])

    const existingSkills = existingSkillsByCategory.flat()
    const existingExperienceBullets = existingExperienceBulletsByEntry.flat()
    const existingEducationBullets = existingEducationBulletsByEntry.flat()
    const existingProjectBullets = existingProjectBulletsByProject.flat()
    const existingAdditionalExperienceBullets = existingAdditionalExperienceBulletsByEntry.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.profiles[input.sourceProfileId] = sourceProfile
    if (targetJob && input.targetJobId) {
      mutationData.jobs[input.targetJobId] = targetJob
    }
    existingProfileLinks.forEach((item) => {
      mutationData.profileLinks[item.id] = item
    })
    existingSkillCategories.forEach((item) => {
      mutationData.skillCategories[item.id] = item
    })
    existingSkills.forEach((item) => {
      mutationData.skills[item.id] = item
    })
    existingAchievements.forEach((item) => {
      mutationData.achievements[item.id] = item
    })
    existingExperienceEntries.forEach((item) => {
      mutationData.experienceEntries[item.id] = item
    })
    existingExperienceBullets.forEach((item) => {
      mutationData.experienceBullets[item.id] = item
    })
    existingEducationEntries.forEach((item) => {
      mutationData.educationEntries[item.id] = item
    })
    existingEducationBullets.forEach((item) => {
      mutationData.educationBullets[item.id] = item
    })
    existingProjects.forEach((item) => {
      mutationData.projects[item.id] = item
    })
    existingProjectBullets.forEach((item) => {
      mutationData.projectBullets[item.id] = item
    })
    existingAdditionalExperienceEntries.forEach((item) => {
      mutationData.additionalExperienceEntries[item.id] = item
    })
    existingAdditionalExperienceBullets.forEach((item) => {
      mutationData.additionalExperienceBullets[item.id] = item
    })
    existingCertifications.forEach((item) => {
      mutationData.certifications[item.id] = item
    })
    existingReferences.forEach((item) => {
      mutationData.references[item.id] = item
    })

    const result = duplicateProfileMutation(mutationData, input, this.createProfileMutationContext())

    await this.writeRecordsToStores([
      {
        storeName: 'profiles',
        records: Object.values(result.data.profiles).filter((item) => !mutationData.profiles[item.id]),
      },
      {
        storeName: 'profileLinks',
        records: Object.values(result.data.profileLinks).filter((item) => !mutationData.profileLinks[item.id]),
      },
      {
        storeName: 'skillCategories',
        records: Object.values(result.data.skillCategories).filter((item) => !mutationData.skillCategories[item.id]),
      },
      {
        storeName: 'skills',
        records: Object.values(result.data.skills).filter((item) => !mutationData.skills[item.id]),
      },
      {
        storeName: 'achievements',
        records: Object.values(result.data.achievements).filter((item) => !mutationData.achievements[item.id]),
      },
      {
        storeName: 'experienceEntries',
        records: Object.values(result.data.experienceEntries).filter((item) => !mutationData.experienceEntries[item.id]),
      },
      {
        storeName: 'experienceBullets',
        records: Object.values(result.data.experienceBullets).filter((item) => !mutationData.experienceBullets[item.id]),
      },
      {
        storeName: 'educationEntries',
        records: Object.values(result.data.educationEntries).filter((item) => !mutationData.educationEntries[item.id]),
      },
      {
        storeName: 'educationBullets',
        records: Object.values(result.data.educationBullets).filter((item) => !mutationData.educationBullets[item.id]),
      },
      {
        storeName: 'projects',
        records: Object.values(result.data.projects).filter((item) => !mutationData.projects[item.id]),
      },
      {
        storeName: 'projectBullets',
        records: Object.values(result.data.projectBullets).filter((item) => !mutationData.projectBullets[item.id]),
      },
      {
        storeName: 'additionalExperienceEntries',
        records: Object.values(result.data.additionalExperienceEntries).filter((item) => !mutationData.additionalExperienceEntries[item.id]),
      },
      {
        storeName: 'additionalExperienceBullets',
        records: Object.values(result.data.additionalExperienceBullets).filter((item) => !mutationData.additionalExperienceBullets[item.id]),
      },
      {
        storeName: 'certifications',
        records: Object.values(result.data.certifications).filter((item) => !mutationData.certifications[item.id]),
      },
      {
        storeName: 'references',
        records: Object.values(result.data.references).filter((item) => !mutationData.references[item.id]),
      },
    ])

    return this.finalizeProfileMutationResult(result)
  }

  private async applyJobRootMutation(
    jobId: string,
    mutation: (data: AppDataState, context: JobMutationContext) => JobMutationResult,
  ): Promise<JobMutationResult> {
    const existingJob = await this.readRecordById<Job>('jobs', jobId)

    if (!existingJob) {
      return this.finalizeJobMutationResult({})
    }

    const mutationData = createEmptyAppDataState()
    mutationData.jobs[jobId] = existingJob

    const result = mutation(mutationData, this.createJobMutationContext())
    const nextJob = result.data.jobs[jobId]

    if (nextJob) {
      await this.writeRecords('jobs', [nextJob])
    }

    return this.finalizeJobMutationResult(result)
  }

  private async applyJobLinksMutation(
    jobId: string,
    mutation: (data: AppDataState, context: JobMutationContext) => JobMutationResult,
  ): Promise<JobMutationResult> {
    const [existingJob, existingJobLinks] = await Promise.all([
      this.readRecordById<Job>('jobs', jobId),
      this.readRecordsByIndex<JobLink>('jobLinks', 'jobId', jobId),
    ])

    if (!existingJob) {
      return this.finalizeJobMutationResult({})
    }

    const mutationData = createEmptyAppDataState()
    mutationData.jobs[jobId] = existingJob
    existingJobLinks.forEach((jobLink) => {
      mutationData.jobLinks[jobLink.id] = jobLink
    })

    const result = mutation(mutationData, this.createJobMutationContext())
    const nextJob = result.data.jobs[jobId]

    if (!nextJob) {
      return this.finalizeJobMutationResult(result)
    }

    const nextJobLinks = Object.values(result.data.jobLinks).filter((jobLink) => jobLink.jobId === jobId)
    const deletedJobLinkIds = existingJobLinks
      .map((jobLink) => jobLink.id)
      .filter((jobLinkId) => !result.data.jobLinks[jobLinkId])

    await this.writeJobWithLinks(nextJob, nextJobLinks, deletedJobLinkIds)

    return this.finalizeJobMutationResult(result)
  }

  private async applyJobContactsMutation(
    jobId: string,
    mutation: (data: AppDataState, context: JobMutationContext) => JobMutationResult,
  ): Promise<JobMutationResult> {
    const [existingJob, existingJobContacts] = await Promise.all([
      this.readRecordById<Job>('jobs', jobId),
      this.readRecordsByIndex<JobContact>('jobContacts', 'jobId', jobId),
    ])

    if (!existingJob) {
      return this.finalizeJobMutationResult({})
    }

    const interviewContactsByJobContact = await Promise.all(
      existingJobContacts.map((jobContact) => this.readRecordsByIndex<InterviewContact>('interviewContacts', 'jobContactId', jobContact.id)),
    )
    const existingInterviewContacts = interviewContactsByJobContact.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.jobs[jobId] = existingJob
    existingJobContacts.forEach((jobContact) => {
      mutationData.jobContacts[jobContact.id] = jobContact
    })
    existingInterviewContacts.forEach((interviewContact) => {
      mutationData.interviewContacts[interviewContact.id] = interviewContact
    })

    const result = mutation(mutationData, this.createJobMutationContext())
    const nextJob = result.data.jobs[jobId]

    if (!nextJob) {
      return this.finalizeJobMutationResult(result)
    }

    const nextJobContacts = Object.values(result.data.jobContacts).filter((jobContact) => jobContact.jobId === jobId)
    const deletedJobContactIds = existingJobContacts
      .map((jobContact) => jobContact.id)
      .filter((jobContactId) => !result.data.jobContacts[jobContactId])
    const deletedInterviewContactIds = existingInterviewContacts
      .map((interviewContact) => interviewContact.id)
      .filter((interviewContactId) => !result.data.interviewContacts[interviewContactId])

    await this.writeJobWithContacts(nextJob, nextJobContacts, Object.values(result.data.interviewContacts), deletedJobContactIds, deletedInterviewContactIds)

    return this.finalizeJobMutationResult(result)
  }

  private async applyApplicationQuestionsMutation(
    jobId: string,
    mutation: (data: AppDataState, context: JobMutationContext) => JobMutationResult,
  ): Promise<JobMutationResult> {
    const [existingJob, existingApplicationQuestions] = await Promise.all([
      this.readRecordById<Job>('jobs', jobId),
      this.readRecordsByIndex<ApplicationQuestion>('applicationQuestions', 'jobId', jobId),
    ])

    if (!existingJob) {
      return this.finalizeJobMutationResult({})
    }

    const mutationData = createEmptyAppDataState()
    mutationData.jobs[jobId] = existingJob
    existingApplicationQuestions.forEach((applicationQuestion) => {
      mutationData.applicationQuestions[applicationQuestion.id] = applicationQuestion
    })

    const result = mutation(mutationData, this.createJobMutationContext())
    const nextJob = result.data.jobs[jobId]

    if (!nextJob) {
      return this.finalizeJobMutationResult(result)
    }

    const nextApplicationQuestions = Object.values(result.data.applicationQuestions).filter(
      (applicationQuestion) => applicationQuestion.jobId === jobId,
    )
    const deletedApplicationQuestionIds = existingApplicationQuestions
      .map((applicationQuestion) => applicationQuestion.id)
      .filter((applicationQuestionId) => !result.data.applicationQuestions[applicationQuestionId])

    await this.writeJobWithApplicationQuestions(nextJob, nextApplicationQuestions, deletedApplicationQuestionIds)

    return this.finalizeJobMutationResult(result)
  }

  private async applyJobInterviewsMutation(
    jobId: string,
    mutation: (data: AppDataState, context: JobMutationContext) => JobMutationResult,
  ): Promise<JobMutationResult> {
    const [existingJob, existingJobContacts, existingInterviews] = await Promise.all([
      this.readRecordById<Job>('jobs', jobId),
      this.readRecordsByIndex<JobContact>('jobContacts', 'jobId', jobId),
      this.readRecordsByIndex<Interview>('interviews', 'jobId', jobId),
    ])

    if (!existingJob) {
      return this.finalizeJobMutationResult({})
    }

    const existingInterviewContactsByInterview = await Promise.all(
      existingInterviews.map((interview) => this.readRecordsByIndex<InterviewContact>('interviewContacts', 'interviewId', interview.id)),
    )
    const existingInterviewContacts = existingInterviewContactsByInterview.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.jobs[jobId] = existingJob
    existingJobContacts.forEach((jobContact) => {
      mutationData.jobContacts[jobContact.id] = jobContact
    })
    existingInterviews.forEach((interview) => {
      mutationData.interviews[interview.id] = interview
    })
    existingInterviewContacts.forEach((interviewContact) => {
      mutationData.interviewContacts[interviewContact.id] = interviewContact
    })

    const result = mutation(mutationData, this.createJobMutationContext())
    const nextJob = result.data.jobs[jobId]

    if (!nextJob) {
      return this.finalizeJobMutationResult(result)
    }

    const nextInterviews = Object.values(result.data.interviews).filter((interview) => interview.jobId === jobId)
    const nextInterviewIds = new Set(nextInterviews.map((interview) => interview.id))
    const nextInterviewContacts = Object.values(result.data.interviewContacts).filter((interviewContact) =>
      nextInterviewIds.has(interviewContact.interviewId),
    )
    const deletedInterviewIds = existingInterviews.map((interview) => interview.id).filter((id) => !result.data.interviews[id])
    const deletedInterviewContactIds = existingInterviewContacts.map((interviewContact) => interviewContact.id).filter((id) => !result.data.interviewContacts[id])

    await this.writeJobWithInterviews(nextJob, nextInterviews, nextInterviewContacts, deletedInterviewIds, deletedInterviewContactIds)

    return this.finalizeJobMutationResult(result)
  }

  private async deleteJobDirectly(jobId: string): Promise<JobMutationResult> {
    const [existingJob, existingProfiles, existingJobLinks, existingJobContacts, existingInterviews, existingApplicationQuestions] = await Promise.all([
      this.readRecordById<Job>('jobs', jobId),
      this.readRecordsByIndex<Profile>('profiles', 'jobId', jobId),
      this.readRecordsByIndex<JobLink>('jobLinks', 'jobId', jobId),
      this.readRecordsByIndex<JobContact>('jobContacts', 'jobId', jobId),
      this.readRecordsByIndex<Interview>('interviews', 'jobId', jobId),
      this.readRecordsByIndex<ApplicationQuestion>('applicationQuestions', 'jobId', jobId),
    ])

    if (!existingJob) {
      return this.finalizeJobMutationResult({})
    }

    const profileIds = existingProfiles.map((profile) => profile.id)
    const skillCategoriesByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<SkillCategory>('skillCategories', 'profileId', profileId)),
    )
    const existingSkillCategories = skillCategoriesByProfile.flat()
    const skillsByCategory = await Promise.all(
      existingSkillCategories.map((category) => this.readRecordsByIndex<Skill>('skills', 'skillCategoryId', category.id)),
    )
    const existingSkills = skillsByCategory.flat()
    const achievementsByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<Achievement>('achievements', 'profileId', profileId)),
    )
    const existingAchievements = achievementsByProfile.flat()
    const profileLinksByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<ProfileLink>('profileLinks', 'profileId', profileId)),
    )
    const existingProfileLinks = profileLinksByProfile.flat()
    const experienceEntriesByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<ExperienceEntry>('experienceEntries', 'profileId', profileId)),
    )
    const existingExperienceEntries = experienceEntriesByProfile.flat()
    const experienceBulletsByEntry = await Promise.all(
      existingExperienceEntries.map((entry) => this.readRecordsByIndex<ExperienceBullet>('experienceBullets', 'experienceEntryId', entry.id)),
    )
    const existingExperienceBullets = experienceBulletsByEntry.flat()
    const educationEntriesByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<EducationEntry>('educationEntries', 'profileId', profileId)),
    )
    const existingEducationEntries = educationEntriesByProfile.flat()
    const educationBulletsByEntry = await Promise.all(
      existingEducationEntries.map((entry) => this.readRecordsByIndex<EducationBullet>('educationBullets', 'educationEntryId', entry.id)),
    )
    const existingEducationBullets = educationBulletsByEntry.flat()
    const projectsByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<Project>('projects', 'profileId', profileId)),
    )
    const existingProjects = projectsByProfile.flat()
    const projectBulletsByProject = await Promise.all(
      existingProjects.map((project) => this.readRecordsByIndex<ProjectBullet>('projectBullets', 'projectId', project.id)),
    )
    const existingProjectBullets = projectBulletsByProject.flat()
    const additionalExperienceEntriesByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<AdditionalExperienceEntry>('additionalExperienceEntries', 'profileId', profileId)),
    )
    const existingAdditionalExperienceEntries = additionalExperienceEntriesByProfile.flat()
    const additionalExperienceBulletsByEntry = await Promise.all(
      existingAdditionalExperienceEntries.map((entry) =>
        this.readRecordsByIndex<AdditionalExperienceBullet>('additionalExperienceBullets', 'additionalExperienceEntryId', entry.id),
      ),
    )
    const existingAdditionalExperienceBullets = additionalExperienceBulletsByEntry.flat()
    const certificationsByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<Certification>('certifications', 'profileId', profileId)),
    )
    const existingCertifications = certificationsByProfile.flat()
    const referencesByProfile = await Promise.all(
      profileIds.map((profileId) => this.readRecordsByIndex<Reference>('references', 'profileId', profileId)),
    )
    const existingReferences = referencesByProfile.flat()
    const interviewContactsByInterview = await Promise.all(
      existingInterviews.map((interview) => this.readRecordsByIndex<InterviewContact>('interviewContacts', 'interviewId', interview.id)),
    )
    const existingInterviewContacts = interviewContactsByInterview.flat()

    const mutationData = createEmptyAppDataState()
    mutationData.jobs[jobId] = existingJob
    existingProfiles.forEach((profile) => {
      mutationData.profiles[profile.id] = profile
    })
    existingJobLinks.forEach((jobLink) => {
      mutationData.jobLinks[jobLink.id] = jobLink
    })
    existingJobContacts.forEach((jobContact) => {
      mutationData.jobContacts[jobContact.id] = jobContact
    })
    existingInterviews.forEach((interview) => {
      mutationData.interviews[interview.id] = interview
    })
    existingInterviewContacts.forEach((interviewContact) => {
      mutationData.interviewContacts[interviewContact.id] = interviewContact
    })
    existingApplicationQuestions.forEach((applicationQuestion) => {
      mutationData.applicationQuestions[applicationQuestion.id] = applicationQuestion
    })
    existingProfileLinks.forEach((profileLink) => {
      mutationData.profileLinks[profileLink.id] = profileLink
    })
    existingSkillCategories.forEach((skillCategory) => {
      mutationData.skillCategories[skillCategory.id] = skillCategory
    })
    existingSkills.forEach((skill) => {
      mutationData.skills[skill.id] = skill
    })
    existingAchievements.forEach((achievement) => {
      mutationData.achievements[achievement.id] = achievement
    })
    existingExperienceEntries.forEach((entry) => {
      mutationData.experienceEntries[entry.id] = entry
    })
    existingExperienceBullets.forEach((bullet) => {
      mutationData.experienceBullets[bullet.id] = bullet
    })
    existingEducationEntries.forEach((entry) => {
      mutationData.educationEntries[entry.id] = entry
    })
    existingEducationBullets.forEach((bullet) => {
      mutationData.educationBullets[bullet.id] = bullet
    })
    existingProjects.forEach((project) => {
      mutationData.projects[project.id] = project
    })
    existingProjectBullets.forEach((bullet) => {
      mutationData.projectBullets[bullet.id] = bullet
    })
    existingAdditionalExperienceEntries.forEach((entry) => {
      mutationData.additionalExperienceEntries[entry.id] = entry
    })
    existingAdditionalExperienceBullets.forEach((bullet) => {
      mutationData.additionalExperienceBullets[bullet.id] = bullet
    })
    existingCertifications.forEach((certification) => {
      mutationData.certifications[certification.id] = certification
    })
    existingReferences.forEach((reference) => {
      mutationData.references[reference.id] = reference
    })

    const result = deleteJobMutation(mutationData, jobId)

    await this.deleteRecordsFromStores([
      { storeName: 'jobs', ids: [jobId] },
      { storeName: 'profiles', ids: existingProfiles.map((profile) => profile.id).filter((id) => !result.data.profiles[id]) },
      { storeName: 'jobLinks', ids: existingJobLinks.map((item) => item.id).filter((id) => !result.data.jobLinks[id]) },
      { storeName: 'jobContacts', ids: existingJobContacts.map((item) => item.id).filter((id) => !result.data.jobContacts[id]) },
      { storeName: 'interviews', ids: existingInterviews.map((item) => item.id).filter((id) => !result.data.interviews[id]) },
      { storeName: 'interviewContacts', ids: existingInterviewContacts.map((item) => item.id).filter((id) => !result.data.interviewContacts[id]) },
      { storeName: 'applicationQuestions', ids: existingApplicationQuestions.map((item) => item.id).filter((id) => !result.data.applicationQuestions[id]) },
      { storeName: 'profileLinks', ids: existingProfileLinks.map((item) => item.id).filter((id) => !result.data.profileLinks[id]) },
      { storeName: 'skillCategories', ids: existingSkillCategories.map((item) => item.id).filter((id) => !result.data.skillCategories[id]) },
      { storeName: 'skills', ids: existingSkills.map((item) => item.id).filter((id) => !result.data.skills[id]) },
      { storeName: 'achievements', ids: existingAchievements.map((item) => item.id).filter((id) => !result.data.achievements[id]) },
      { storeName: 'experienceEntries', ids: existingExperienceEntries.map((item) => item.id).filter((id) => !result.data.experienceEntries[id]) },
      { storeName: 'experienceBullets', ids: existingExperienceBullets.map((item) => item.id).filter((id) => !result.data.experienceBullets[id]) },
      { storeName: 'educationEntries', ids: existingEducationEntries.map((item) => item.id).filter((id) => !result.data.educationEntries[id]) },
      { storeName: 'educationBullets', ids: existingEducationBullets.map((item) => item.id).filter((id) => !result.data.educationBullets[id]) },
      { storeName: 'projects', ids: existingProjects.map((item) => item.id).filter((id) => !result.data.projects[id]) },
      { storeName: 'projectBullets', ids: existingProjectBullets.map((item) => item.id).filter((id) => !result.data.projectBullets[id]) },
      {
        storeName: 'additionalExperienceEntries',
        ids: existingAdditionalExperienceEntries.map((item) => item.id).filter((id) => !result.data.additionalExperienceEntries[id]),
      },
      {
        storeName: 'additionalExperienceBullets',
        ids: existingAdditionalExperienceBullets.map((item) => item.id).filter((id) => !result.data.additionalExperienceBullets[id]),
      },
      { storeName: 'certifications', ids: existingCertifications.map((item) => item.id).filter((id) => !result.data.certifications[id]) },
      { storeName: 'references', ids: existingReferences.map((item) => item.id).filter((id) => !result.data.references[id]) },
    ])

    return this.finalizeJobMutationResult(result)
  }

  async getAppData(): Promise<AppDataState> {
    await this.ensureInitialized()
    return this.snapshotRepository.readAppData()
  }

  async isAppDataEmpty(): Promise<boolean> {
    await this.ensureInitialized()
    return this.snapshotRepository.isAppDataEmpty()
  }

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'jobs', 'jobContacts', 'interviews'], 'readonly')
      const [profiles, jobs, jobContacts, interviews] = await Promise.all([
        requestToPromise(transaction.objectStore('profiles').getAll()) as Promise<Profile[]>,
        requestToPromise(transaction.objectStore('jobs').getAll()) as Promise<Job[]>,
        requestToPromise(transaction.objectStore('jobContacts').getAll()) as Promise<JobContact[]>,
        requestToPromise(transaction.objectStore('interviews').getAll()) as Promise<Interview[]>,
      ])

      await transactionToPromise(transaction)

      const now = new Date(this.now())

      const upcomingInterviews = interviews
        .filter((interview) => interview.startAt !== null && new Date(interview.startAt).getTime() > now.getTime())
        .sort(compareInterviewsBySchedule)
        .map((interview) => {
          const job = jobs.find((item) => item.id === interview.jobId)

          return job && interview.startAt
            ? {
                interviewId: interview.id,
                jobId: job.id,
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                staffingAgencyName: job.staffingAgencyName,
                startAt: interview.startAt,
              }
            : null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

      const addedTodayCount = jobs.filter((job) => isWithinLocalToday(job.createdAt, now)).length
      const addedLast7DaysCount = jobs.filter((job) => isWithinLast7Days(job.createdAt, now)).length
      const notAppliedCount = jobs.filter((job) => job.appliedAt === null).length
      const appliedTodayCount = jobs.filter((job) => job.appliedAt && isWithinLocalToday(job.appliedAt, now)).length
      const appliedLast7DaysCount = jobs.filter((job) => job.appliedAt && isWithinLast7Days(job.appliedAt, now)).length
      const interviewsBookedTodayCount = interviews.filter((interview) => isWithinLocalToday(interview.createdAt, now)).length
      const interviewsBookedLast7DaysCount = interviews.filter((interview) => isWithinLast7Days(interview.createdAt, now)).length
      const offersReceivedTodayCount = jobs.filter(
        (job) =>
          job.finalOutcome && offerStatusesCountedAsReceived.has(job.finalOutcome.status) && isWithinLocalToday(job.finalOutcome.setAt, now),
      ).length
      const offersReceivedLast7DaysCount = jobs.filter(
        (job) =>
          job.finalOutcome && offerStatusesCountedAsReceived.has(job.finalOutcome.status) && isWithinLast7Days(job.finalOutcome.setAt, now),
      ).length

      return {
        profileCount: profiles.length,
        baseProfileCount: profiles.filter((profile) => profile.jobId === null).length,
        jobProfileCount: profiles.filter((profile) => profile.jobId !== null).length,
        jobCount: jobs.length,
        activeInterviewCount: interviews.length,
        contactCount: jobContacts.length,
        addedTodayCount,
        addedLast7DaysCount,
        notAppliedCount,
        appliedTodayCount,
        appliedLast7DaysCount,
        interviewsBookedTodayCount,
        interviewsBookedLast7DaysCount,
        offersReceivedTodayCount,
        offersReceivedLast7DaysCount,
        upcomingInterviewCount: upcomingInterviews.length,
        upcomingInterviews,
        updatedAt:
          [...profiles.map((profile) => profile.updatedAt), ...jobs.map((job) => job.updatedAt)].sort((left, right) =>
            right.localeCompare(left),
          )[0] ?? emptyCollectionUpdatedAt,
      }
    })
  }

  async getDashboardActivity(periodDays: DashboardActivityPeriodDays): Promise<DashboardActivityDto> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction(['jobs', 'interviews'], 'readonly')
      const [jobs, interviews] = await Promise.all([
        requestToPromise(transaction.objectStore('jobs').getAll()) as Promise<Job[]>,
        requestToPromise(transaction.objectStore('interviews').getAll()) as Promise<Interview[]>,
      ])

      await transactionToPromise(transaction)

      const now = new Date(this.now())
      const todayStart = getStartOfLocalDay(now)
      const points = Array.from({ length: periodDays }, (_, index) => {
        const start = new Date(todayStart)
        start.setDate(todayStart.getDate() - (periodDays - 1 - index))

        const end = new Date(start)
        end.setDate(start.getDate() + 1)

        return {
          date: formatLocalDateKey(start),
          jobsAddedCount: jobs.filter((job) => isWithinDayRange(job.createdAt, start, end, now)).length,
          applicationsSubmittedCount: jobs.filter((job) => job.appliedAt && isWithinDayRange(job.appliedAt, start, end, now)).length,
          interviewsBookedCount: interviews.filter((interview) => isWithinDayRange(interview.createdAt, start, end, now)).length,
          offersReceivedCount: jobs.filter(
            (job) =>
              job.finalOutcome &&
              offerStatusesCountedAsReceived.has(job.finalOutcome.status) &&
              isWithinDayRange(job.finalOutcome.setAt, start, end, now),
          ).length,
        }
      })

      return {
        periodDays,
        points,
      }
    })
  }

  async getJobsList(): Promise<JobsListDto> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction(['jobs', 'jobLinks', 'interviews'], 'readonly')
      const [jobs, jobLinks, interviews] = await Promise.all([
        requestToPromise(transaction.objectStore('jobs').getAll()) as Promise<Job[]>,
        requestToPromise(transaction.objectStore('jobLinks').getAll()) as Promise<JobLink[]>,
        requestToPromise(transaction.objectStore('interviews').getAll()) as Promise<Interview[]>,
      ])

      await transactionToPromise(transaction)

      const interviewCounts = interviews.reduce<Map<string, number>>((counts, interview) => {
        counts.set(interview.jobId, (counts.get(interview.jobId) ?? 0) + 1)
        return counts
      }, new Map())

      const jobLinksByJobId = jobLinks.reduce<Map<string, Array<Pick<JobsListItemDto['jobLinks'][number], 'id' | 'url'> & { sortOrder: number }>>>(
        (linksByJobId, link) => {
          const links = linksByJobId.get(link.jobId) ?? []
          links.push({
            id: link.id,
            url: link.url,
            sortOrder: link.sortOrder,
          })
          linksByJobId.set(link.jobId, links)
          return linksByJobId
        },
        new Map(),
      )

      const items = jobs
        .map<JobsListItemDto>((job) => {
          const interviewCount = interviewCounts.get(job.id) ?? 0
          const sortedJobLinks = (jobLinksByJobId.get(job.id) ?? [])
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map(({ id, url }) => ({ id, url }))

          return {
            id: job.id,
            companyName: job.companyName,
            staffingAgencyName: job.staffingAgencyName,
            jobTitle: job.jobTitle,
            computedStatus: getJobComputedStatus({
              appliedAt: job.appliedAt,
              finalOutcome: job.finalOutcome,
              interviewCount,
            }),
            interviewCount,
            jobLinks: sortedJobLinks,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          }
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

      return {
        items,
        updatedAt: items[0]?.updatedAt ?? emptyCollectionUpdatedAt,
      }
    })
  }

  async getJobDetail(jobId: string): Promise<JobDetailDto | null> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction(
        ['jobs', 'profiles', 'jobLinks', 'jobContacts', 'interviews', 'interviewContacts', 'applicationQuestions'],
        'readonly',
      )
      const [job, profiles, jobLinks, jobContacts, interviews, interviewContacts, applicationQuestions] = await Promise.all([
        requestToPromise(transaction.objectStore('jobs').get(jobId)) as Promise<Job | undefined>,
        requestToPromise(transaction.objectStore('profiles').getAll()) as Promise<Profile[]>,
        requestToPromise(transaction.objectStore('jobLinks').getAll()) as Promise<JobLink[]>,
        requestToPromise(transaction.objectStore('jobContacts').getAll()) as Promise<JobContact[]>,
        requestToPromise(transaction.objectStore('interviews').getAll()) as Promise<Interview[]>,
        requestToPromise(transaction.objectStore('interviewContacts').getAll()) as Promise<InterviewContact[]>,
        requestToPromise(transaction.objectStore('applicationQuestions').getAll()) as Promise<ApplicationQuestion[]>,
      ])

      await transactionToPromise(transaction)

      if (!job) {
        return null
      }

      const relatedProfiles = profiles
        .filter((profile) => profile.jobId === jobId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))

      const sortedJobLinks = jobLinks
        .filter((link) => link.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      const sortedJobContacts = jobContacts
        .filter((contact) => contact.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      const jobContactsById = sortedJobContacts.reduce<Map<string, JobContact>>((contactsById, contact) => {
        contactsById.set(contact.id, contact)
        return contactsById
      }, new Map())

      const sortedInterviews = interviews
        .filter((interview) => interview.jobId === jobId)
        .sort(compareInterviewsBySchedule)
        .map((interview) => ({
          interview,
          contacts: interviewContacts
            .filter((association) => association.interviewId === interview.id)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((association) => ({
              interviewContact: association,
              jobContact: jobContactsById.get(association.jobContactId) ?? null,
            })),
        }))

      const sortedApplicationQuestions = applicationQuestions
        .filter((question) => question.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      return {
        job,
        computedStatus: getJobComputedStatus({
          appliedAt: job.appliedAt,
          finalOutcome: job.finalOutcome,
          interviewCount: sortedInterviews.length,
        }),
        relatedProfiles,
        jobLinks: sortedJobLinks,
        jobContacts: sortedJobContacts,
        interviews: sortedInterviews,
        applicationQuestions: sortedApplicationQuestions,
      }
    })
  }

  async getProfileDetail(profileId: string): Promise<ProfileDetailDto | null> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction(
        [
          'profiles',
          'jobs',
          'profileLinks',
          'skillCategories',
          'skills',
          'achievements',
          'experienceEntries',
          'experienceBullets',
          'educationEntries',
          'educationBullets',
          'projects',
          'projectBullets',
          'additionalExperienceEntries',
          'additionalExperienceBullets',
          'certifications',
          'references',
        ],
        'readonly',
      )
      const [
        profile,
        jobs,
        profileLinks,
        skillCategories,
        skills,
        achievements,
        experienceEntries,
        experienceBullets,
        educationEntries,
        educationBullets,
        projects,
        projectBullets,
        additionalExperienceEntries,
        additionalExperienceBullets,
        certifications,
        references,
      ] = await Promise.all([
        requestToPromise(transaction.objectStore('profiles').get(profileId)) as Promise<Profile | undefined>,
        requestToPromise(transaction.objectStore('jobs').getAll()) as Promise<Job[]>,
        requestToPromise(transaction.objectStore('profileLinks').getAll()) as Promise<ProfileLink[]>,
        requestToPromise(transaction.objectStore('skillCategories').getAll()) as Promise<SkillCategory[]>,
        requestToPromise(transaction.objectStore('skills').getAll()) as Promise<Skill[]>,
        requestToPromise(transaction.objectStore('achievements').getAll()) as Promise<Achievement[]>,
        requestToPromise(transaction.objectStore('experienceEntries').getAll()) as Promise<ExperienceEntry[]>,
        requestToPromise(transaction.objectStore('experienceBullets').getAll()) as Promise<ExperienceBullet[]>,
        requestToPromise(transaction.objectStore('educationEntries').getAll()) as Promise<EducationEntry[]>,
        requestToPromise(transaction.objectStore('educationBullets').getAll()) as Promise<EducationBullet[]>,
        requestToPromise(transaction.objectStore('projects').getAll()) as Promise<Project[]>,
        requestToPromise(transaction.objectStore('projectBullets').getAll()) as Promise<ProjectBullet[]>,
        requestToPromise(transaction.objectStore('additionalExperienceEntries').getAll()) as Promise<AdditionalExperienceEntry[]>,
        requestToPromise(transaction.objectStore('additionalExperienceBullets').getAll()) as Promise<AdditionalExperienceBullet[]>,
        requestToPromise(transaction.objectStore('certifications').getAll()) as Promise<Certification[]>,
        requestToPromise(transaction.objectStore('references').getAll()) as Promise<Reference[]>,
      ])

      await transactionToPromise(transaction)

      if (!profile) {
        return null
      }

      const jobsById = jobs.reduce<Map<string, Job>>((nextJobsById, job) => {
        nextJobsById.set(job.id, job)
        return nextJobsById
      }, new Map())

      const attachedJob = profile.jobId ? jobsById.get(profile.jobId) ?? null : null

      const sortedProfileLinks = profileLinks
        .filter((link) => link.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      const sortedSkillCategories = skillCategories
        .filter((category) => category.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((category) => ({
          category,
          skills: skills
            .filter((skill) => skill.skillCategoryId === category.id)
            .sort((left, right) => left.sortOrder - right.sortOrder),
        }))

      const sortedAchievements = achievements
        .filter((achievement) => achievement.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      const sortedExperienceEntries = experienceEntries
        .filter((entry) => entry.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((entry) => ({
          entry,
          bullets: experienceBullets
            .filter((bullet) => bullet.experienceEntryId === entry.id)
            .sort((left, right) => left.sortOrder - right.sortOrder),
        }))

      const sortedEducationEntries = educationEntries
        .filter((entry) => entry.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((entry) => ({
          entry,
          bullets: educationBullets
            .filter((bullet) => bullet.educationEntryId === entry.id)
            .sort((left, right) => left.sortOrder - right.sortOrder),
        }))

      const sortedProjectEntries = projects
        .filter((entry) => entry.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((entry) => ({
          entry,
          bullets: projectBullets
            .filter((bullet) => bullet.projectId === entry.id)
            .sort((left, right) => left.sortOrder - right.sortOrder),
        }))

      const sortedAdditionalExperienceEntries = additionalExperienceEntries
        .filter((entry) => entry.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((entry) => ({
          entry,
          bullets: additionalExperienceBullets
            .filter((bullet) => bullet.additionalExperienceEntryId === entry.id)
            .sort((left, right) => left.sortOrder - right.sortOrder),
        }))

      const sortedCertifications = certifications
        .filter((certification) => certification.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      const sortedReferences = references
        .filter((reference) => reference.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      return {
        profile,
        attachedJob,
        profileLinks: sortedProfileLinks,
        skillCategories: sortedSkillCategories,
        achievements: sortedAchievements,
        experienceEntries: sortedExperienceEntries,
        educationEntries: sortedEducationEntries,
        projectEntries: sortedProjectEntries,
        additionalExperienceEntries: sortedAdditionalExperienceEntries,
        certifications: sortedCertifications,
        references: sortedReferences,
      }
    })
  }

  async getProfileDocument(profileId: string): Promise<ProfileDocumentDto | null> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction(
        [
          'profiles',
          'jobs',
          'profileLinks',
          'jobContacts',
          'jobLinks',
          'interviews',
          'skillCategories',
          'skills',
          'achievements',
          'experienceEntries',
          'experienceBullets',
          'educationEntries',
          'educationBullets',
          'projects',
          'projectBullets',
          'additionalExperienceEntries',
          'additionalExperienceBullets',
          'certifications',
          'references',
        ],
        'readonly',
      )
      const [
        profile,
        jobs,
        profileLinks,
        jobContacts,
        jobLinks,
        interviews,
        skillCategories,
        skills,
        achievements,
        experienceEntries,
        experienceBullets,
        educationEntries,
        educationBullets,
        projects,
        projectBullets,
        additionalExperienceEntries,
        additionalExperienceBullets,
        certifications,
        references,
      ] = await Promise.all([
        requestToPromise(transaction.objectStore('profiles').get(profileId)) as Promise<Profile | undefined>,
        requestToPromise(transaction.objectStore('jobs').getAll()) as Promise<Job[]>,
        requestToPromise(transaction.objectStore('profileLinks').getAll()) as Promise<ProfileLink[]>,
        requestToPromise(transaction.objectStore('jobContacts').getAll()) as Promise<JobContact[]>,
        requestToPromise(transaction.objectStore('jobLinks').getAll()) as Promise<JobLink[]>,
        requestToPromise(transaction.objectStore('interviews').getAll()) as Promise<Interview[]>,
        requestToPromise(transaction.objectStore('skillCategories').getAll()) as Promise<SkillCategory[]>,
        requestToPromise(transaction.objectStore('skills').getAll()) as Promise<Skill[]>,
        requestToPromise(transaction.objectStore('achievements').getAll()) as Promise<Achievement[]>,
        requestToPromise(transaction.objectStore('experienceEntries').getAll()) as Promise<ExperienceEntry[]>,
        requestToPromise(transaction.objectStore('experienceBullets').getAll()) as Promise<ExperienceBullet[]>,
        requestToPromise(transaction.objectStore('educationEntries').getAll()) as Promise<EducationEntry[]>,
        requestToPromise(transaction.objectStore('educationBullets').getAll()) as Promise<EducationBullet[]>,
        requestToPromise(transaction.objectStore('projects').getAll()) as Promise<Project[]>,
        requestToPromise(transaction.objectStore('projectBullets').getAll()) as Promise<ProjectBullet[]>,
        requestToPromise(transaction.objectStore('additionalExperienceEntries').getAll()) as Promise<AdditionalExperienceEntry[]>,
        requestToPromise(transaction.objectStore('additionalExperienceBullets').getAll()) as Promise<AdditionalExperienceBullet[]>,
        requestToPromise(transaction.objectStore('certifications').getAll()) as Promise<Certification[]>,
        requestToPromise(transaction.objectStore('references').getAll()) as Promise<Reference[]>,
      ])

      await transactionToPromise(transaction)

      if (!profile) {
        return null
      }

      const jobsById = jobs.reduce<Map<string, Job>>((nextJobsById, job) => {
        nextJobsById.set(job.id, job)
        return nextJobsById
      }, new Map())

      const job = profile.jobId ? jobsById.get(profile.jobId) ?? buildFallbackJob(profile) : buildFallbackJob(profile)

      const sortedProfileLinks = profileLinks
        .filter((link) => link.profileId === profileId && link.enabled)
        .sort(compareSortOrder)

      const sortedContacts = createDocumentContacts(
        job,
        jobContacts.filter((contact) => contact.jobId === profile.jobId),
      )

      const sortedJobLinks = jobLinks
        .filter((link) => link.jobId === profile.jobId)
        .sort(compareSortOrder)

      const jobInterviewCount = interviews.filter((interview) => interview.jobId === profile.jobId).length

      const sortedSkillCategories = skillCategories
        .filter((category) => category.profileId === profileId && category.enabled)
        .sort(compareSortOrder)
        .map((category) => ({
          category,
          skills: skills
            .filter((skill) => skill.skillCategoryId === category.id && skill.enabled)
            .sort(compareSortOrder),
        }))
        .filter((item) => item.skills.length > 0 || item.category.name.trim())

      const sortedExperienceEntries = experienceEntries
        .filter((entry) => entry.profileId === profileId && entry.enabled)
        .sort(compareSortOrder)
        .map((entry) => ({
          entry,
          bullets: experienceBullets
            .filter((bullet) => bullet.experienceEntryId === entry.id && bullet.enabled && bullet.content.trim())
            .sort(compareSortOrder),
        }))

      const sortedEducationEntries = educationEntries
        .filter((entry) => entry.profileId === profileId && entry.enabled)
        .sort(compareSortOrder)
        .map((entry) => ({
          entry,
          bullets: educationBullets
            .filter((bullet) => bullet.educationEntryId === entry.id && bullet.enabled && bullet.content.trim())
            .sort(compareSortOrder),
        }))

      const sortedAchievements = achievements
        .filter((item) => item.profileId === profileId && item.enabled && (item.name.trim() || item.description.trim()))
        .sort(compareSortOrder)

      const sortedProjectEntries = projects
        .filter((entry) => entry.profileId === profileId && entry.enabled)
        .sort(compareSortOrder)
        .map((entry) => ({
          entry,
          bullets: projectBullets
            .filter((bullet) => bullet.projectId === entry.id && bullet.enabled && bullet.content.trim())
            .sort(compareSortOrder),
        }))
        .filter(
          (item) =>
            item.entry.name.trim() ||
            item.entry.organization.trim() ||
            item.bullets.length > 0 ||
            item.entry.startDate ||
            item.entry.endDate,
        )

      const sortedAdditionalExperienceEntries = additionalExperienceEntries
        .filter((entry) => entry.profileId === profileId && entry.enabled)
        .sort(compareSortOrder)
        .map((entry) => ({
          entry,
          bullets: additionalExperienceBullets
            .filter((bullet) => bullet.additionalExperienceEntryId === entry.id && bullet.enabled && bullet.content.trim())
            .sort(compareSortOrder),
        }))
        .filter(
          (item) =>
            item.entry.title.trim() ||
            item.entry.organization.trim() ||
            item.entry.location.trim() ||
            item.bullets.length > 0 ||
            item.entry.startDate ||
            item.entry.endDate,
        )

      const sortedCertifications = certifications
        .filter((entry) => entry.profileId === profileId && entry.enabled)
        .sort(compareSortOrder)

      const sortedReferences = references
        .filter((entry) => entry.profileId === profileId && entry.enabled)
        .sort(compareSortOrder)

      return {
        profile,
        profileLinks: sortedProfileLinks,
        job,
        primaryContact: selectPrimaryContact({
          contacts: sortedContacts,
          preferredContactId: profile.coverLetterContactId,
          job,
        }),
        contacts: sortedContacts,
        jobLinks: sortedJobLinks,
        skillCategories: sortedSkillCategories,
        achievements: sortedAchievements,
        experienceEntries: sortedExperienceEntries,
        educationEntries: sortedEducationEntries,
        projectEntries: sortedProjectEntries,
        additionalExperienceEntries: sortedAdditionalExperienceEntries,
        certifications: sortedCertifications,
        references: sortedReferences,
        computedStatus: getJobComputedStatus({
          appliedAt: job.appliedAt,
          finalOutcome: job.finalOutcome,
          interviewCount: jobInterviewCount,
        }),
      }
    })
  }

  async getProfilesList(kind: 'base' | 'job' | 'all' = 'all'): Promise<ProfilesListDto> {
    await this.ensureInitialized()

    return this.withDatabase(async (database) => {
      const transaction = database.transaction(['profiles', 'jobs'], 'readonly')
      const [profiles, jobs] = await Promise.all([
        requestToPromise(transaction.objectStore('profiles').getAll()) as Promise<Profile[]>,
        requestToPromise(transaction.objectStore('jobs').getAll()) as Promise<Job[]>,
      ])

      await transactionToPromise(transaction)

      const jobsById = jobs.reduce<Map<string, Job>>((nextJobsById, job) => {
        nextJobsById.set(job.id, job)
        return nextJobsById
      }, new Map())

      const items = profiles
        .filter((profile) => {
          if (kind === 'base') {
            return profile.jobId === null
          }

          if (kind === 'job') {
            return profile.jobId !== null
          }

          return true
        })
        .map<ProfilesListItemDto>((profile) => {
          const attachedJob = profile.jobId ? jobsById.get(profile.jobId) ?? null : null

          return {
            id: profile.id,
            name: profile.name,
            kind: profile.jobId === null ? 'base' : 'job',
            jobId: profile.jobId,
            jobSummary: attachedJob
              ? {
                  id: attachedJob.id,
                  companyName: attachedJob.companyName,
                    staffingAgencyName: attachedJob.staffingAgencyName,
                  jobTitle: attachedJob.jobTitle,
                }
              : null,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

      return {
        items,
        updatedAt: items[0]?.updatedAt ?? emptyCollectionUpdatedAt,
      }
    })
  }

  async importAppData(file: AppExportFile): Promise<AppDataState> {
    await this.ensureInitialized()
    const validatedFile = validateAppExportFile(file)
    return this.snapshotRepository.replaceAppData(structuredClone(validatedFile.data))
  }

  async resetLocalData(): Promise<void> {
    await deleteAppDatabase(this.databaseOptions)
    this.initialDataApplied = true
  }

  async exportAppData(): Promise<AppExportFile> {
    await this.ensureInitialized()
    return this.snapshotRepository.exportAppData()
  }

  async createBaseProfile(name: string): Promise<ProfileMutationResult> {
    await this.ensureInitialized()

    const result = createBaseProfileMutation(createEmptyAppDataState(), name, this.createProfileMutationContext())
    const createdProfile = result.createdId ? result.data.profiles[result.createdId] : null

    if (createdProfile) {
      await this.writeRecords('profiles', [createdProfile])
    }

    return this.finalizeProfileMutationResult(result)
  }

  async updateProfile(input: UpdateProfileInput): Promise<ProfileMutationResult> {
    return this.applyProfileRootMutation(input.profileId, (data, context) => updateProfileMutation(data, input, context))
  }

  async setDocumentHeaderTemplate(input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult> {
    return this.applyProfileRootMutation(input.profileId, (data, context) => setDocumentHeaderTemplateMutation(data, input, context))
  }

  async setResumeSectionEnabled(input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult> {
    return this.applyProfileRootMutation(input.profileId, (data, context) => setResumeSectionEnabledMutation(data, input, context))
  }

  async setResumeSectionLabel(input: SetResumeSectionLabelInput): Promise<ProfileMutationResult> {
    return this.applyProfileRootMutation(input.profileId, (data, context) => setResumeSectionLabelMutation(data, input, context))
  }

  async reorderResumeSections(input: ReorderResumeSectionsInput): Promise<ProfileMutationResult> {
    return this.applyProfileRootMutation(input.profileId, (data, context) => reorderResumeSectionsMutation(data, input, context))
  }

  async duplicateProfile(input: DuplicateProfileInput): Promise<ProfileMutationResult> {
    return this.duplicateProfileDirectly(input)
  }

  async deleteProfile(profileId: string): Promise<ProfileMutationResult> {
    return this.deleteProfileDirectly(profileId)
  }

  async createProfileLink(profileId: string): Promise<ProfileMutationResult> {
    return this.applyProfileLinksMutation(profileId, (data, context) => createProfileLinkMutation(data, profileId, context))
  }

  async updateProfileLink(input: UpdateProfileLinkInput): Promise<ProfileMutationResult> {
    const existingProfileLink = await this.readRecordById<ProfileLink>('profileLinks', input.profileLinkId)

    if (!existingProfileLink) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileLinksMutation(existingProfileLink.profileId, (data, context) => updateProfileLinkMutation(data, input, context))
  }

  async deleteProfileLink(profileLinkId: string): Promise<ProfileMutationResult> {
    const existingProfileLink = await this.readRecordById<ProfileLink>('profileLinks', profileLinkId)

    if (!existingProfileLink) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileLinksMutation(existingProfileLink.profileId, (data, context) => deleteProfileLinkMutation(data, profileLinkId, context))
  }

  async reorderProfileLinks(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applyProfileLinksMutation(input.profileId, (data, context) => reorderProfileLinksMutation(data, input, context))
  }

  async createSkillCategory(profileId: string): Promise<ProfileMutationResult> {
    return this.applyProfileSkillsMutation(profileId, (data, context) => createSkillCategoryMutation(data, profileId, context))
  }

  async updateSkillCategory(input: UpdateSkillCategoryInput): Promise<ProfileMutationResult> {
    const existingSkillCategory = await this.readRecordById<SkillCategory>('skillCategories', input.skillCategoryId)

    if (!existingSkillCategory) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileSkillsMutation(existingSkillCategory.profileId, (data, context) => updateSkillCategoryMutation(data, input, context))
  }

  async deleteSkillCategory(skillCategoryId: string): Promise<ProfileMutationResult> {
    const existingSkillCategory = await this.readRecordById<SkillCategory>('skillCategories', skillCategoryId)

    if (!existingSkillCategory) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileSkillsMutation(existingSkillCategory.profileId, (data, context) => deleteSkillCategoryMutation(data, skillCategoryId, context))
  }

  async reorderSkillCategories(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applyProfileSkillsMutation(input.profileId, (data, context) => reorderSkillCategoriesMutation(data, input, context))
  }

  async createSkill(skillCategoryId: string): Promise<ProfileMutationResult> {
    const existingSkillCategory = await this.readRecordById<SkillCategory>('skillCategories', skillCategoryId)

    if (!existingSkillCategory) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileSkillsMutation(existingSkillCategory.profileId, (data, context) => createSkillMutation(data, skillCategoryId, context))
  }

  async updateSkill(input: UpdateSkillInput): Promise<ProfileMutationResult> {
    const existingSkill = await this.readRecordById<Skill>('skills', input.skillId)

    if (!existingSkill) {
      return this.finalizeProfileMutationResult({})
    }

    const existingSkillCategory = await this.readRecordById<SkillCategory>('skillCategories', existingSkill.skillCategoryId)

    if (!existingSkillCategory) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileSkillsMutation(existingSkillCategory.profileId, (data, context) => updateSkillMutation(data, input, context))
  }

  async deleteSkill(skillId: string): Promise<ProfileMutationResult> {
    const existingSkill = await this.readRecordById<Skill>('skills', skillId)

    if (!existingSkill) {
      return this.finalizeProfileMutationResult({})
    }

    const existingSkillCategory = await this.readRecordById<SkillCategory>('skillCategories', existingSkill.skillCategoryId)

    if (!existingSkillCategory) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileSkillsMutation(existingSkillCategory.profileId, (data, context) => deleteSkillMutation(data, skillId, context))
  }

  async reorderSkills(skillCategoryId: string, orderedIds: string[]): Promise<ProfileMutationResult> {
    const existingSkillCategory = await this.readRecordById<SkillCategory>('skillCategories', skillCategoryId)

    if (!existingSkillCategory) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileSkillsMutation(existingSkillCategory.profileId, (data, context) =>
      reorderSkillsMutation(data, skillCategoryId, orderedIds, context),
    )
  }

  async createAchievement(profileId: string): Promise<ProfileMutationResult> {
    return this.applySimpleProfileChildMutation(profileId, 'achievements', (data) => data.achievements, (data, context) =>
      createAchievementMutation(data, profileId, context),
    )
  }

  async updateAchievement(input: UpdateAchievementInput): Promise<ProfileMutationResult> {
    const existingAchievement = await this.readRecordById<Achievement>('achievements', input.achievementId)

    if (!existingAchievement) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applySimpleProfileChildMutation(existingAchievement.profileId, 'achievements', (data) => data.achievements, (data, context) =>
      updateAchievementMutation(data, input, context),
    )
  }

  async deleteAchievement(achievementId: string): Promise<ProfileMutationResult> {
    const existingAchievement = await this.readRecordById<Achievement>('achievements', achievementId)

    if (!existingAchievement) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applySimpleProfileChildMutation(existingAchievement.profileId, 'achievements', (data) => data.achievements, (data, context) =>
      deleteAchievementMutation(data, achievementId, context),
    )
  }

  async reorderAchievements(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applySimpleProfileChildMutation(input.profileId, 'achievements', (data) => data.achievements, (data, context) =>
      reorderAchievementsMutation(data, input, context),
    )
  }

  async createExperienceEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.applyProfileExperienceMutation(profileId, (data, context) => createExperienceEntryMutation(data, profileId, context))
  }

  async updateExperienceEntry(input: UpdateExperienceEntryInput): Promise<ProfileMutationResult> {
    const existingExperienceEntry = await this.readRecordById<ExperienceEntry>('experienceEntries', input.experienceEntryId)

    if (!existingExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileExperienceMutation(existingExperienceEntry.profileId, (data, context) => updateExperienceEntryMutation(data, input, context))
  }

  async deleteExperienceEntry(experienceEntryId: string): Promise<ProfileMutationResult> {
    const existingExperienceEntry = await this.readRecordById<ExperienceEntry>('experienceEntries', experienceEntryId)

    if (!existingExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileExperienceMutation(existingExperienceEntry.profileId, (data, context) =>
      deleteExperienceEntryMutation(data, experienceEntryId, context),
    )
  }

  async reorderExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applyProfileExperienceMutation(input.profileId, (data, context) => reorderExperienceEntriesMutation(data, input, context))
  }

  async createExperienceBullet(experienceEntryId: string): Promise<ProfileMutationResult> {
    const existingExperienceEntry = await this.readRecordById<ExperienceEntry>('experienceEntries', experienceEntryId)

    if (!existingExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileExperienceMutation(existingExperienceEntry.profileId, (data, context) =>
      createExperienceBulletMutation(data, experienceEntryId, context),
    )
  }

  async updateExperienceBullet(input: UpdateExperienceBulletInput): Promise<ProfileMutationResult> {
    const existingExperienceBullet = await this.readRecordById<ExperienceBullet>('experienceBullets', input.experienceBulletId)

    if (!existingExperienceBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingExperienceEntry = await this.readRecordById<ExperienceEntry>('experienceEntries', existingExperienceBullet.experienceEntryId)

    if (!existingExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileExperienceMutation(existingExperienceEntry.profileId, (data, context) => updateExperienceBulletMutation(data, input, context))
  }

  async deleteExperienceBullet(experienceBulletId: string): Promise<ProfileMutationResult> {
    const existingExperienceBullet = await this.readRecordById<ExperienceBullet>('experienceBullets', experienceBulletId)

    if (!existingExperienceBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingExperienceEntry = await this.readRecordById<ExperienceEntry>('experienceEntries', existingExperienceBullet.experienceEntryId)

    if (!existingExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileExperienceMutation(existingExperienceEntry.profileId, (data, context) =>
      deleteExperienceBulletMutation(data, experienceBulletId, context),
    )
  }

  async reorderExperienceBullets(input: ReorderExperienceBulletsInput): Promise<ProfileMutationResult> {
    const existingExperienceEntry = await this.readRecordById<ExperienceEntry>('experienceEntries', input.experienceEntryId)

    if (!existingExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileExperienceMutation(existingExperienceEntry.profileId, (data, context) =>
      reorderExperienceBulletsMutation(data, input, context),
    )
  }

  async createEducationEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.applyProfileEducationMutation(profileId, (data, context) => createEducationEntryMutation(data, profileId, context))
  }

  async updateEducationEntry(input: UpdateEducationEntryInput): Promise<ProfileMutationResult> {
    const existingEducationEntry = await this.readRecordById<EducationEntry>('educationEntries', input.educationEntryId)

    if (!existingEducationEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileEducationMutation(existingEducationEntry.profileId, (data, context) => updateEducationEntryMutation(data, input, context))
  }

  async deleteEducationEntry(educationEntryId: string): Promise<ProfileMutationResult> {
    const existingEducationEntry = await this.readRecordById<EducationEntry>('educationEntries', educationEntryId)

    if (!existingEducationEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileEducationMutation(existingEducationEntry.profileId, (data, context) => deleteEducationEntryMutation(data, educationEntryId, context))
  }

  async reorderEducationEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applyProfileEducationMutation(input.profileId, (data, context) => reorderEducationEntriesMutation(data, input, context))
  }

  async createEducationBullet(educationEntryId: string): Promise<ProfileMutationResult> {
    const existingEducationEntry = await this.readRecordById<EducationEntry>('educationEntries', educationEntryId)

    if (!existingEducationEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileEducationMutation(existingEducationEntry.profileId, (data, context) => createEducationBulletMutation(data, educationEntryId, context))
  }

  async updateEducationBullet(input: UpdateEducationBulletInput): Promise<ProfileMutationResult> {
    const existingEducationBullet = await this.readRecordById<EducationBullet>('educationBullets', input.educationBulletId)

    if (!existingEducationBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingEducationEntry = await this.readRecordById<EducationEntry>('educationEntries', existingEducationBullet.educationEntryId)

    if (!existingEducationEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileEducationMutation(existingEducationEntry.profileId, (data, context) => updateEducationBulletMutation(data, input, context))
  }

  async deleteEducationBullet(educationBulletId: string): Promise<ProfileMutationResult> {
    const existingEducationBullet = await this.readRecordById<EducationBullet>('educationBullets', educationBulletId)

    if (!existingEducationBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingEducationEntry = await this.readRecordById<EducationEntry>('educationEntries', existingEducationBullet.educationEntryId)

    if (!existingEducationEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileEducationMutation(existingEducationEntry.profileId, (data, context) => deleteEducationBulletMutation(data, educationBulletId, context))
  }

  async reorderEducationBullets(input: ReorderEducationBulletsInput): Promise<ProfileMutationResult> {
    const existingEducationEntry = await this.readRecordById<EducationEntry>('educationEntries', input.educationEntryId)

    if (!existingEducationEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileEducationMutation(existingEducationEntry.profileId, (data, context) => reorderEducationBulletsMutation(data, input, context))
  }

  async createProject(profileId: string): Promise<ProfileMutationResult> {
    return this.applyProfileProjectMutation(profileId, (data, context) => createProjectMutation(data, profileId, context))
  }

  async updateProject(input: UpdateProjectInput): Promise<ProfileMutationResult> {
    const existingProject = await this.readRecordById<Project>('projects', input.projectId)

    if (!existingProject) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileProjectMutation(existingProject.profileId, (data, context) => updateProjectMutation(data, input, context))
  }

  async deleteProject(projectId: string): Promise<ProfileMutationResult> {
    const existingProject = await this.readRecordById<Project>('projects', projectId)

    if (!existingProject) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileProjectMutation(existingProject.profileId, (data, context) => deleteProjectMutation(data, projectId, context))
  }

  async reorderProjects(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applyProfileProjectMutation(input.profileId, (data, context) => reorderProjectsMutation(data, input, context))
  }

  async createProjectBullet(projectId: string): Promise<ProfileMutationResult> {
    const existingProject = await this.readRecordById<Project>('projects', projectId)

    if (!existingProject) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileProjectMutation(existingProject.profileId, (data, context) => createProjectBulletMutation(data, projectId, context))
  }

  async updateProjectBullet(input: UpdateProjectBulletInput): Promise<ProfileMutationResult> {
    const existingProjectBullet = await this.readRecordById<ProjectBullet>('projectBullets', input.projectBulletId)

    if (!existingProjectBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingProject = await this.readRecordById<Project>('projects', existingProjectBullet.projectId)

    if (!existingProject) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileProjectMutation(existingProject.profileId, (data, context) => updateProjectBulletMutation(data, input, context))
  }

  async deleteProjectBullet(projectBulletId: string): Promise<ProfileMutationResult> {
    const existingProjectBullet = await this.readRecordById<ProjectBullet>('projectBullets', projectBulletId)

    if (!existingProjectBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingProject = await this.readRecordById<Project>('projects', existingProjectBullet.projectId)

    if (!existingProject) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileProjectMutation(existingProject.profileId, (data, context) => deleteProjectBulletMutation(data, projectBulletId, context))
  }

  async reorderProjectBullets(input: ReorderProjectBulletsInput): Promise<ProfileMutationResult> {
    const existingProject = await this.readRecordById<Project>('projects', input.projectId)

    if (!existingProject) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileProjectMutation(existingProject.profileId, (data, context) => reorderProjectBulletsMutation(data, input, context))
  }

  async createAdditionalExperienceEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.applyProfileAdditionalExperienceMutation(profileId, (data, context) =>
      createAdditionalExperienceEntryMutation(data, profileId, context),
    )
  }

  async updateAdditionalExperienceEntry(input: UpdateAdditionalExperienceEntryInput): Promise<ProfileMutationResult> {
    const existingAdditionalExperienceEntry = await this.readRecordById<AdditionalExperienceEntry>(
      'additionalExperienceEntries',
      input.additionalExperienceEntryId,
    )

    if (!existingAdditionalExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileAdditionalExperienceMutation(existingAdditionalExperienceEntry.profileId, (data, context) =>
      updateAdditionalExperienceEntryMutation(data, input, context),
    )
  }

  async deleteAdditionalExperienceEntry(additionalExperienceEntryId: string): Promise<ProfileMutationResult> {
    const existingAdditionalExperienceEntry = await this.readRecordById<AdditionalExperienceEntry>(
      'additionalExperienceEntries',
      additionalExperienceEntryId,
    )

    if (!existingAdditionalExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileAdditionalExperienceMutation(existingAdditionalExperienceEntry.profileId, (data, context) =>
      deleteAdditionalExperienceEntryMutation(data, additionalExperienceEntryId, context),
    )
  }

  async reorderAdditionalExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applyProfileAdditionalExperienceMutation(input.profileId, (data, context) =>
      reorderAdditionalExperienceEntriesMutation(data, input, context),
    )
  }

  async createAdditionalExperienceBullet(additionalExperienceEntryId: string): Promise<ProfileMutationResult> {
    const existingAdditionalExperienceEntry = await this.readRecordById<AdditionalExperienceEntry>(
      'additionalExperienceEntries',
      additionalExperienceEntryId,
    )

    if (!existingAdditionalExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileAdditionalExperienceMutation(existingAdditionalExperienceEntry.profileId, (data, context) =>
      createAdditionalExperienceBulletMutation(data, additionalExperienceEntryId, context),
    )
  }

  async updateAdditionalExperienceBullet(input: UpdateAdditionalExperienceBulletInput): Promise<ProfileMutationResult> {
    const existingAdditionalExperienceBullet = await this.readRecordById<AdditionalExperienceBullet>(
      'additionalExperienceBullets',
      input.additionalExperienceBulletId,
    )

    if (!existingAdditionalExperienceBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingAdditionalExperienceEntry = await this.readRecordById<AdditionalExperienceEntry>(
      'additionalExperienceEntries',
      existingAdditionalExperienceBullet.additionalExperienceEntryId,
    )

    if (!existingAdditionalExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileAdditionalExperienceMutation(existingAdditionalExperienceEntry.profileId, (data, context) =>
      updateAdditionalExperienceBulletMutation(data, input, context),
    )
  }

  async deleteAdditionalExperienceBullet(additionalExperienceBulletId: string): Promise<ProfileMutationResult> {
    const existingAdditionalExperienceBullet = await this.readRecordById<AdditionalExperienceBullet>(
      'additionalExperienceBullets',
      additionalExperienceBulletId,
    )

    if (!existingAdditionalExperienceBullet) {
      return this.finalizeProfileMutationResult({})
    }

    const existingAdditionalExperienceEntry = await this.readRecordById<AdditionalExperienceEntry>(
      'additionalExperienceEntries',
      existingAdditionalExperienceBullet.additionalExperienceEntryId,
    )

    if (!existingAdditionalExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileAdditionalExperienceMutation(existingAdditionalExperienceEntry.profileId, (data, context) =>
      deleteAdditionalExperienceBulletMutation(data, additionalExperienceBulletId, context),
    )
  }

  async reorderAdditionalExperienceBullets(input: ReorderAdditionalExperienceBulletsInput): Promise<ProfileMutationResult> {
    const existingAdditionalExperienceEntry = await this.readRecordById<AdditionalExperienceEntry>(
      'additionalExperienceEntries',
      input.additionalExperienceEntryId,
    )

    if (!existingAdditionalExperienceEntry) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applyProfileAdditionalExperienceMutation(existingAdditionalExperienceEntry.profileId, (data, context) =>
      reorderAdditionalExperienceBulletsMutation(data, input, context),
    )
  }

  async createCertification(profileId: string): Promise<ProfileMutationResult> {
    return this.applySimpleProfileChildMutation(profileId, 'certifications', (data) => data.certifications, (data, context) =>
      createCertificationMutation(data, profileId, context),
    )
  }

  async updateCertification(input: UpdateCertificationInput): Promise<ProfileMutationResult> {
    const existingCertification = await this.readRecordById<Certification>('certifications', input.certificationId)

    if (!existingCertification) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applySimpleProfileChildMutation(
      existingCertification.profileId,
      'certifications',
      (data) => data.certifications,
      (data, context) => updateCertificationMutation(data, input, context),
    )
  }

  async deleteCertification(certificationId: string): Promise<ProfileMutationResult> {
    const existingCertification = await this.readRecordById<Certification>('certifications', certificationId)

    if (!existingCertification) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applySimpleProfileChildMutation(
      existingCertification.profileId,
      'certifications',
      (data) => data.certifications,
      (data, context) => deleteCertificationMutation(data, certificationId, context),
    )
  }

  async reorderCertifications(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applySimpleProfileChildMutation(input.profileId, 'certifications', (data) => data.certifications, (data, context) =>
      reorderCertificationsMutation(data, input, context),
    )
  }

  async createReference(profileId: string): Promise<ProfileMutationResult> {
    return this.applySimpleProfileChildMutation(profileId, 'references', (data) => data.references, (data, context) =>
      createReferenceMutation(data, profileId, context),
    )
  }

  async updateReference(input: UpdateReferenceInput): Promise<ProfileMutationResult> {
    const existingReference = await this.readRecordById<Reference>('references', input.referenceId)

    if (!existingReference) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applySimpleProfileChildMutation(existingReference.profileId, 'references', (data) => data.references, (data, context) =>
      updateReferenceMutation(data, input, context),
    )
  }

  async deleteReference(referenceId: string): Promise<ProfileMutationResult> {
    const existingReference = await this.readRecordById<Reference>('references', referenceId)

    if (!existingReference) {
      return this.finalizeProfileMutationResult({})
    }

    return this.applySimpleProfileChildMutation(existingReference.profileId, 'references', (data) => data.references, (data, context) =>
      deleteReferenceMutation(data, referenceId, context),
    )
  }

  async reorderReferences(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.applySimpleProfileChildMutation(input.profileId, 'references', (data) => data.references, (data, context) =>
      reorderReferencesMutation(data, input, context),
    )
  }

  async createJob(input: CreateJobInput): Promise<JobMutationResult> {
    await this.ensureInitialized()

    const result = createJobMutation(createEmptyAppDataState(), input, this.createJobMutationContext())
    const createdJob = result.createdId ? result.data.jobs[result.createdId] : null
    const createdJobLinks = Object.values(result.data.jobLinks)

    if (createdJob) {
      await this.writeJobWithLinks(createdJob, createdJobLinks)
    }

    return this.finalizeJobMutationResult(result)
  }

  async updateJob(input: UpdateJobInput): Promise<JobMutationResult> {
    return this.applyJobRootMutation(input.jobId, (data, context) => updateJobMutation(data, input, context))
  }

  async deleteJob(jobId: string): Promise<JobMutationResult> {
    return this.deleteJobDirectly(jobId)
  }

  async createJobLink(jobId: string): Promise<JobMutationResult> {
    return this.applyJobLinksMutation(jobId, (data, context) => createJobLinkMutation(data, jobId, context))
  }

  async updateJobLink(input: UpdateJobLinkInput): Promise<JobMutationResult> {
    const existingJobLink = await this.readRecordById<JobLink>('jobLinks', input.jobLinkId)

    if (!existingJobLink) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobLinksMutation(existingJobLink.jobId, (data, context) => updateJobLinkMutation(data, input, context))
  }

  async deleteJobLink(jobLinkId: string): Promise<JobMutationResult> {
    const existingJobLink = await this.readRecordById<JobLink>('jobLinks', jobLinkId)

    if (!existingJobLink) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobLinksMutation(existingJobLink.jobId, (data, context) => deleteJobLinkMutation(data, jobLinkId, context))
  }

  async reorderJobLinks(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.applyJobLinksMutation(input.jobId, (data, context) => reorderJobLinksMutation(data, input, context))
  }

  async createJobContact(jobId: string): Promise<JobMutationResult> {
    return this.applyJobContactsMutation(jobId, (data, context) => createJobContactMutation(data, jobId, context))
  }

  async updateJobContact(input: UpdateJobContactInput): Promise<JobMutationResult> {
    const existingJobContact = await this.readRecordById<JobContact>('jobContacts', input.jobContactId)

    if (!existingJobContact) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobContactsMutation(existingJobContact.jobId, (data, context) => updateJobContactMutation(data, input, context))
  }

  async deleteJobContact(jobContactId: string): Promise<JobMutationResult> {
    const existingJobContact = await this.readRecordById<JobContact>('jobContacts', jobContactId)

    if (!existingJobContact) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobContactsMutation(existingJobContact.jobId, (data, context) => deleteJobContactMutation(data, jobContactId, context))
  }

  async reorderJobContacts(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.applyJobContactsMutation(input.jobId, (data, context) => reorderJobContactsMutation(data, input, context))
  }

  async createApplicationQuestion(jobId: string): Promise<JobMutationResult> {
    return this.applyApplicationQuestionsMutation(jobId, (data, context) => createApplicationQuestionMutation(data, jobId, context))
  }

  async updateApplicationQuestion(input: UpdateApplicationQuestionInput): Promise<JobMutationResult> {
    const existingApplicationQuestion = await this.readRecordById<ApplicationQuestion>('applicationQuestions', input.applicationQuestionId)

    if (!existingApplicationQuestion) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyApplicationQuestionsMutation(existingApplicationQuestion.jobId, (data, context) => updateApplicationQuestionMutation(data, input, context))
  }

  async deleteApplicationQuestion(applicationQuestionId: string): Promise<JobMutationResult> {
    const existingApplicationQuestion = await this.readRecordById<ApplicationQuestion>('applicationQuestions', applicationQuestionId)

    if (!existingApplicationQuestion) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyApplicationQuestionsMutation(existingApplicationQuestion.jobId, (data, context) =>
      deleteApplicationQuestionMutation(data, applicationQuestionId, context),
    )
  }

  async reorderApplicationQuestions(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.applyApplicationQuestionsMutation(input.jobId, (data, context) => reorderApplicationQuestionsMutation(data, input, context))
  }

  async setJobAppliedAt(input: SetJobAppliedAtInput): Promise<JobMutationResult> {
    return this.applyJobRootMutation(input.jobId, (data, context) => setJobAppliedAtMutation(data, input, context))
  }

  async clearJobAppliedAt(jobId: string): Promise<JobMutationResult> {
    return this.applyJobRootMutation(jobId, (data, context) => clearJobAppliedAtMutation(data, jobId, context))
  }

  async setJobFinalOutcome(input: SetJobFinalOutcomeInput): Promise<JobMutationResult> {
    return this.applyJobRootMutation(input.jobId, (data, context) => setJobFinalOutcomeMutation(data, input, context))
  }

  async clearJobFinalOutcome(jobId: string): Promise<JobMutationResult> {
    return this.applyJobRootMutation(jobId, (data, context) => clearJobFinalOutcomeMutation(data, jobId, context))
  }

  async createInterview(jobId: string): Promise<JobMutationResult> {
    return this.applyJobInterviewsMutation(jobId, (data, context) => createInterviewMutation(data, jobId, context))
  }

  async updateInterview(input: UpdateInterviewInput): Promise<JobMutationResult> {
    const existingInterview = await this.readRecordById<Interview>('interviews', input.interviewId)

    if (!existingInterview) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobInterviewsMutation(existingInterview.jobId, (data, context) => updateInterviewMutation(data, input, context))
  }

  async deleteInterview(interviewId: string): Promise<JobMutationResult> {
    const existingInterview = await this.readRecordById<Interview>('interviews', interviewId)

    if (!existingInterview) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobInterviewsMutation(existingInterview.jobId, (data, context) => deleteInterviewMutation(data, interviewId, context))
  }

  async addInterviewContact(input: AddInterviewContactInput): Promise<JobMutationResult> {
    const existingInterview = await this.readRecordById<Interview>('interviews', input.interviewId)

    if (!existingInterview) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobInterviewsMutation(existingInterview.jobId, (data, context) => addInterviewContactMutation(data, input, context))
  }

  async removeInterviewContact(interviewContactId: string): Promise<JobMutationResult> {
    const existingInterviewContact = await this.readRecordById<InterviewContact>('interviewContacts', interviewContactId)

    if (!existingInterviewContact) {
      return this.finalizeJobMutationResult({})
    }

    const existingInterview = await this.readRecordById<Interview>('interviews', existingInterviewContact.interviewId)

    if (!existingInterview) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobInterviewsMutation(existingInterview.jobId, (data, context) =>
      removeInterviewContactMutation(data, interviewContactId, context),
    )
  }

  async reorderInterviewContacts(input: ReorderInterviewContactsInput): Promise<JobMutationResult> {
    const existingInterview = await this.readRecordById<Interview>('interviews', input.interviewId)

    if (!existingInterview) {
      return this.finalizeJobMutationResult({})
    }

    return this.applyJobInterviewsMutation(existingInterview.jobId, (data, context) => reorderInterviewContactsMutation(data, input, context))
  }
}
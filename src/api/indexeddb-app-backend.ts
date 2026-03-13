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
import { getJobComputedStatus } from '../features/jobs/job-status'
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
  ReorderAdditionalExperienceBulletsInput,
  ReorderEducationBulletsInput,
  ReorderExperienceBulletsInput,
  ReorderProjectBulletsInput,
  ReorderProfileEntitiesInput,
  ReorderResumeSectionsInput,
  SetDocumentHeaderTemplateInput,
  SetResumeSectionEnabledInput,
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
} from '../domain/profile-data'
import type { AppDataService } from './app-data-service'
import type {
  DashboardSummaryDto,
  JobDetailDto,
  JobsListDto,
  JobsListItemDto,
  ProfileDetailDto,
  ProfileDocumentDto,
  ProfilesListDto,
  ProfilesListItemDto,
} from './read-models'
import { createIndexedDbAppDataSnapshotRepository, openAppDatabase, type PersistedAppData } from './indexeddb'
import type { AppDatabaseOptions } from './indexeddb'
import { MockAppBackend } from './mock-app-backend'

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

const buildFallbackJob = (profile: Profile): Job => ({
  id: `document-job-${profile.id}`,
  companyName: 'Example Company',
  jobTitle: 'Example Role',
  description: '',
  location: '',
  postedCompensation: '',
  desiredCompensation: '',
  compensationNotes: '',
  workArrangement: 'unknown',
  employmentType: 'other',
  datePosted: null,
  appliedAt: null,
  finalOutcome: null,
  notes: '',
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
})

const buildFallbackContact = (job: Job): JobContact => ({
  id: `document-contact-${job.id}`,
  jobId: job.id,
  name: 'Hiring Manager',
  title: '',
  company: job.companyName || 'Example Company',
  addressLine1: '123 Example Street',
  addressLine2: '',
  addressLine3: '',
  addressLine4: 'Example City, EX 12345',
  email: '',
  phone: '',
  linkedinUrl: '',
  relationshipType: 'hiring_manager',
  notes: '',
  sortOrder: 0,
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

  private async withCompatibilityBackend<T>(operation: (backend: MockAppBackend) => Promise<T>): Promise<T> {
    await this.ensureInitialized()
    const data = await this.snapshotRepository.readAppData()
    const backend = new MockAppBackend({ initialData: data, now: this.now })
    return operation(backend)
  }

  private async persistMutationResult<T extends { data: AppDataState }>(result: T): Promise<T> {
    const persistedData = await this.snapshotRepository.replaceAppData(toPersistedAppData(result.data))
    return {
      ...result,
      data: persistedData,
    }
  }

  private async mutateWithCompatibilityBackend<T extends { data: AppDataState }>(
    operation: (backend: MockAppBackend) => Promise<T>,
  ): Promise<T> {
    const result = await this.withCompatibilityBackend(operation)
    return this.persistMutationResult(result)
  }

  async getAppData(): Promise<AppDataState> {
    await this.ensureInitialized()
    return this.snapshotRepository.readAppData()
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

      return {
        profileCount: profiles.length,
        baseProfileCount: profiles.filter((profile) => profile.jobId === null).length,
        jobProfileCount: profiles.filter((profile) => profile.jobId !== null).length,
        jobCount: jobs.length,
        activeInterviewCount: interviews.length,
        contactCount: jobContacts.length,
        updatedAt:
          [...profiles.map((profile) => profile.updatedAt), ...jobs.map((job) => job.updatedAt)].sort((left, right) =>
            right.localeCompare(left),
          )[0] ?? emptyCollectionUpdatedAt,
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
        .sort((left, right) => {
          if (!left.startAt && !right.startAt) {
            return 0
          }

          if (!left.startAt) {
            return 1
          }

          if (!right.startAt) {
            return -1
          }

          return left.startAt.localeCompare(right.startAt)
        })
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

      const sortedContacts = jobContacts
        .filter((contact) => contact.jobId === profile.jobId)
        .sort(compareSortOrder)

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
        primaryContact: sortedContacts[0] ?? buildFallbackContact(job),
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
    return this.snapshotRepository.replaceAppData(structuredClone(file.data))
  }

  async exportAppData(): Promise<AppExportFile> {
    await this.ensureInitialized()
    return this.snapshotRepository.exportAppData()
  }

  async createBaseProfile(name: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createBaseProfile(name))
  }

  async updateProfile(input: UpdateProfileInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateProfile(input))
  }

  async setDocumentHeaderTemplate(input: SetDocumentHeaderTemplateInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.setDocumentHeaderTemplate(input))
  }

  async setResumeSectionEnabled(input: SetResumeSectionEnabledInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.setResumeSectionEnabled(input))
  }

  async setResumeSectionLabel(input: SetResumeSectionLabelInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.setResumeSectionLabel(input))
  }

  async reorderResumeSections(input: ReorderResumeSectionsInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderResumeSections(input))
  }

  async duplicateProfile(input: DuplicateProfileInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.duplicateProfile(input))
  }

  async deleteProfile(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteProfile(profileId))
  }

  async createProfileLink(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createProfileLink(profileId))
  }

  async updateProfileLink(input: UpdateProfileLinkInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateProfileLink(input))
  }

  async deleteProfileLink(profileLinkId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteProfileLink(profileLinkId))
  }

  async reorderProfileLinks(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderProfileLinks(input))
  }

  async createSkillCategory(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createSkillCategory(profileId))
  }

  async updateSkillCategory(input: UpdateSkillCategoryInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateSkillCategory(input))
  }

  async deleteSkillCategory(skillCategoryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteSkillCategory(skillCategoryId))
  }

  async reorderSkillCategories(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderSkillCategories(input))
  }

  async createSkill(skillCategoryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createSkill(skillCategoryId))
  }

  async updateSkill(input: UpdateSkillInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateSkill(input))
  }

  async deleteSkill(skillId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteSkill(skillId))
  }

  async reorderSkills(skillCategoryId: string, orderedIds: string[]): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderSkills(skillCategoryId, orderedIds))
  }

  async createAchievement(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createAchievement(profileId))
  }

  async updateAchievement(input: UpdateAchievementInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateAchievement(input))
  }

  async deleteAchievement(achievementId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteAchievement(achievementId))
  }

  async reorderAchievements(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderAchievements(input))
  }

  async createExperienceEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createExperienceEntry(profileId))
  }

  async updateExperienceEntry(input: UpdateExperienceEntryInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateExperienceEntry(input))
  }

  async deleteExperienceEntry(experienceEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteExperienceEntry(experienceEntryId))
  }

  async reorderExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderExperienceEntries(input))
  }

  async createExperienceBullet(experienceEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createExperienceBullet(experienceEntryId))
  }

  async updateExperienceBullet(input: UpdateExperienceBulletInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateExperienceBullet(input))
  }

  async deleteExperienceBullet(experienceBulletId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteExperienceBullet(experienceBulletId))
  }

  async reorderExperienceBullets(input: ReorderExperienceBulletsInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderExperienceBullets(input))
  }

  async createEducationEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createEducationEntry(profileId))
  }

  async updateEducationEntry(input: UpdateEducationEntryInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateEducationEntry(input))
  }

  async deleteEducationEntry(educationEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteEducationEntry(educationEntryId))
  }

  async reorderEducationEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderEducationEntries(input))
  }

  async createEducationBullet(educationEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createEducationBullet(educationEntryId))
  }

  async updateEducationBullet(input: UpdateEducationBulletInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateEducationBullet(input))
  }

  async deleteEducationBullet(educationBulletId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteEducationBullet(educationBulletId))
  }

  async reorderEducationBullets(input: ReorderEducationBulletsInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderEducationBullets(input))
  }

  async createProject(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createProject(profileId))
  }

  async updateProject(input: UpdateProjectInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateProject(input))
  }

  async deleteProject(projectId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteProject(projectId))
  }

  async reorderProjects(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderProjects(input))
  }

  async createProjectBullet(projectId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createProjectBullet(projectId))
  }

  async updateProjectBullet(input: UpdateProjectBulletInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateProjectBullet(input))
  }

  async deleteProjectBullet(projectBulletId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteProjectBullet(projectBulletId))
  }

  async reorderProjectBullets(input: ReorderProjectBulletsInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderProjectBullets(input))
  }

  async createAdditionalExperienceEntry(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createAdditionalExperienceEntry(profileId))
  }

  async updateAdditionalExperienceEntry(input: UpdateAdditionalExperienceEntryInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateAdditionalExperienceEntry(input))
  }

  async deleteAdditionalExperienceEntry(additionalExperienceEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteAdditionalExperienceEntry(additionalExperienceEntryId))
  }

  async reorderAdditionalExperienceEntries(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderAdditionalExperienceEntries(input))
  }

  async createAdditionalExperienceBullet(additionalExperienceEntryId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createAdditionalExperienceBullet(additionalExperienceEntryId))
  }

  async updateAdditionalExperienceBullet(input: UpdateAdditionalExperienceBulletInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateAdditionalExperienceBullet(input))
  }

  async deleteAdditionalExperienceBullet(additionalExperienceBulletId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteAdditionalExperienceBullet(additionalExperienceBulletId))
  }

  async reorderAdditionalExperienceBullets(input: ReorderAdditionalExperienceBulletsInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderAdditionalExperienceBullets(input))
  }

  async createCertification(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createCertification(profileId))
  }

  async updateCertification(input: UpdateCertificationInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateCertification(input))
  }

  async deleteCertification(certificationId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteCertification(certificationId))
  }

  async reorderCertifications(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderCertifications(input))
  }

  async createReference(profileId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createReference(profileId))
  }

  async updateReference(input: UpdateReferenceInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateReference(input))
  }

  async deleteReference(referenceId: string): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteReference(referenceId))
  }

  async reorderReferences(input: ReorderProfileEntitiesInput): Promise<ProfileMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderReferences(input))
  }

  async createJob(input: CreateJobInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createJob(input))
  }

  async updateJob(input: UpdateJobInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateJob(input))
  }

  async deleteJob(jobId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteJob(jobId))
  }

  async createJobLink(jobId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createJobLink(jobId))
  }

  async updateJobLink(input: UpdateJobLinkInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateJobLink(input))
  }

  async deleteJobLink(jobLinkId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteJobLink(jobLinkId))
  }

  async reorderJobLinks(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderJobLinks(input))
  }

  async createJobContact(jobId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createJobContact(jobId))
  }

  async updateJobContact(input: UpdateJobContactInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateJobContact(input))
  }

  async deleteJobContact(jobContactId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteJobContact(jobContactId))
  }

  async reorderJobContacts(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderJobContacts(input))
  }

  async createApplicationQuestion(jobId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createApplicationQuestion(jobId))
  }

  async updateApplicationQuestion(input: UpdateApplicationQuestionInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateApplicationQuestion(input))
  }

  async deleteApplicationQuestion(applicationQuestionId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteApplicationQuestion(applicationQuestionId))
  }

  async reorderApplicationQuestions(input: ReorderJobEntitiesInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderApplicationQuestions(input))
  }

  async setJobAppliedAt(input: SetJobAppliedAtInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.setJobAppliedAt(input))
  }

  async clearJobAppliedAt(jobId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.clearJobAppliedAt(jobId))
  }

  async setJobFinalOutcome(input: SetJobFinalOutcomeInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.setJobFinalOutcome(input))
  }

  async clearJobFinalOutcome(jobId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.clearJobFinalOutcome(jobId))
  }

  async createInterview(jobId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.createInterview(jobId))
  }

  async updateInterview(input: UpdateInterviewInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.updateInterview(input))
  }

  async deleteInterview(interviewId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.deleteInterview(interviewId))
  }

  async addInterviewContact(input: AddInterviewContactInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.addInterviewContact(input))
  }

  async removeInterviewContact(interviewContactId: string): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.removeInterviewContact(interviewContactId))
  }

  async reorderInterviewContacts(input: ReorderInterviewContactsInput): Promise<JobMutationResult> {
    return this.mutateWithCompatibilityBackend((backend) => backend.reorderInterviewContacts(input))
  }
}
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppApiClient, resetAppApiClient, setAppApiClient } from '../api'
import { getOrderedResumeSections, selectProfileDocumentData } from '../features/documents/document-data'
import { getJobComputedStatus } from '../features/jobs/job-status'
import type { AppExportFile } from '../types/state'
import { createDefaultResumeSettings, createDefaultUiState, createEmptyDataState } from './create-initial-state'
import { defaultBulletLevel } from '../utils/bullet-levels'
import { defaultDocumentHeaderTemplate } from '../utils/document-header-templates'
import { useAppStore } from './app-store'

const resetStore = () => {
  resetAppApiClient()
  useAppStore.setState((state) => ({
    ...state,
    data: createEmptyDataState(),
    ui: createDefaultUiState('system'),
    status: {
      hydration: 'idle',
      saving: 'idle',
      errorMessage: null,
    },
  }))
}

const getOrderedIds = <T extends { id: string; sortOrder: number }>(items: Record<string, T>) =>
  Object.values(items)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => item.id)

const expectDefined = <T>(value: T | null | undefined, message: string): T => {
  expect(value, message).toBeDefined()
  expect(value, message).not.toBeNull()
  return value as T
}

const waitForNextTick = () => new Promise((resolve) => setTimeout(resolve, 2))

describe('app store hydration and persistence boundary', () => {
  beforeEach(() => {
    resetStore()
  })

  it('hydrates store data from the app api client', async () => {
    const seededData = createEmptyDataState()
    seededData.profiles.profile_1 = {
      id: 'profile_1',
      name: 'Hydrated Profile',
      summary: '',
      coverLetter: '',
      resumeSettings: createDefaultResumeSettings(),
      personalDetails: {
        fullName: '',
        email: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        city: '',
        state: '',
        postalCode: '',
      },
      jobId: null,
      clonedFromProfileId: null,
      createdAt: '2026-03-12T12:00:00.000Z',
      updatedAt: '2026-03-12T12:00:00.000Z',
    }

    setAppApiClient(createAppApiClient({ initialData: seededData }))

    await useAppStore.getState().actions.hydrate()

    expect(useAppStore.getState().status.hydration).toBe('ready')
    expect(useAppStore.getState().data.profiles.profile_1?.name).toBe('Hydrated Profile')
  })

  it('imports and exports through the app api client asynchronously', async () => {
    const imported: AppExportFile = {
      version: 1 as const,
      exportedAt: '2026-03-12T09:00:00.000Z',
      data: {
        ...createEmptyDataState(),
        jobs: {
          job_1: {
            id: 'job_1',
            companyName: 'Example Co',
            jobTitle: 'Engineer',
            description: '',
            location: '',
            postedCompensation: '',
            desiredCompensation: '',
            compensationNotes: '',
            workArrangement: 'unknown',
            employmentType: 'other',
            datePosted: null,
            notes: '',
            createdAt: '2026-03-12T09:00:00.000Z',
            updatedAt: '2026-03-12T09:00:00.000Z',
            appliedAt: null,
            finalOutcome: null,
          },
        },
      },
    }

    await useAppStore.getState().actions.importAppData(imported)

    const exported = await useAppStore.getState().actions.exportAppData()

    expect(useAppStore.getState().status.saving).toBe('idle')
    expect(useAppStore.getState().data.jobs.job_1?.companyName).toBe('Example Co')
    expect(exported.data.jobs.job_1?.jobTitle).toBe('Engineer')
  })
})

describe('app store reorder actions', () => {
  beforeEach(() => {
    resetStore()
  })

  it('reorders skill categories for a profile', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.createSkillCategory(profileId)
    await actions.createSkillCategory(profileId)

    const initialIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.skillCategories)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstSkillCategoryId = expectDefined(initialIds[0], 'Expected first skill category id')
    const secondSkillCategoryId = expectDefined(initialIds[1], 'Expected second skill category id')

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    await actions.reorderSkillCategories({
      profileId,
      orderedIds: [secondSkillCategoryId, firstSkillCategoryId],
    })

    const categories = useAppStore.getState().data.skillCategories
    expect(categories[secondSkillCategoryId]?.sortOrder).toBe(1)
    expect(categories[firstSkillCategoryId]?.sortOrder).toBe(2)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)
  })

  it('reorders enabled profile links for a profile and preview data reflects the new order', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.createProfileLink(profileId)
    await actions.createProfileLink(profileId)

    const createdLinks = Object.values(useAppStore.getState().data.profileLinks).filter((item) => item.profileId === profileId)
    expect(createdLinks.every((item) => item.enabled)).toBe(true)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')
    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    await actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })
    await actions.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    })

    await actions.reorderProfileLinks({
      profileId,
      orderedIds: [secondProfileLinkId, firstProfileLinkId],
    })

    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)
    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.profileLinks.map((link) => link.name)).toEqual(['LinkedIn', 'Portfolio'])
    expect(preview?.profileLinks.map((link) => link.url)).toEqual([
      'https://linkedin.com/in/example',
      'https://example.com/portfolio',
    ])
  })

  it('toggles profile link enabled state and excludes disabled links from preview data', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.createProfileLink(profileId)
    await actions.createProfileLink(profileId)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')

    await actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })
    await actions.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    })

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    await actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { enabled: false },
    })

    expect(useAppStore.getState().data.profileLinks[firstProfileLinkId]?.enabled).toBe(false)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.profileLinks.map((link) => link.name)).toEqual(['LinkedIn'])
    expect(preview?.profileLinks.map((link) => link.url)).toEqual(['https://linkedin.com/in/example'])
  })

  it('initializes, updates, and reorders per-profile resume settings', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const initialProfile = useAppStore.getState().data.profiles[profileId]
    expect(initialProfile?.resumeSettings.headerTemplate).toBe(defaultDocumentHeaderTemplate)
    expect(initialProfile?.resumeSettings.sections.summary.enabled).toBe(true)
    expect(initialProfile?.resumeSettings.sections.summary.sortOrder).toBe(1)
    expect(initialProfile?.resumeSettings.sections.summary.label).toBe('Summary')
    expect(initialProfile?.resumeSettings.sections.achievements.sortOrder).toBe(3)
    expect(initialProfile?.resumeSettings.sections.projects.sortOrder).toBe(6)
    expect(initialProfile?.resumeSettings.sections.additional_experience.sortOrder).toBe(7)
    expect(initialProfile?.resumeSettings.sections.references.sortOrder).toBe(9)

    await actions.setDocumentHeaderTemplate({
      profileId,
      headerTemplate: 'stacked',
    })

    await actions.setResumeSectionLabel({
      profileId,
      section: 'summary',
      label: 'Professional Summary',
    })

    await actions.setResumeSectionEnabled({
      profileId,
      section: 'references',
      enabled: false,
    })

    await actions.reorderResumeSections({
      profileId,
      orderedSections: ['skills', 'achievements', 'experience', 'summary', 'education', 'projects', 'additional_experience', 'certifications', 'references'],
    })

    const nextProfile = useAppStore.getState().data.profiles[profileId]
    expect(nextProfile?.resumeSettings.headerTemplate).toBe('stacked')
    expect(nextProfile?.resumeSettings.sections.summary.label).toBe('Professional Summary')
    expect(nextProfile?.resumeSettings.sections.references.enabled).toBe(false)
    expect(getOrderedResumeSections(nextProfile!).map((section) => section.section)).toEqual([
      'skills',
      'achievements',
      'experience',
      'summary',
      'education',
      'projects',
      'additional_experience',
      'certifications',
      'references',
    ])
  })

  it('clears and protects endDate when an experience entry is marked current', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.createExperienceEntry(profileId)
    const experienceEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.experienceEntries)[0],
      'Expected an experience entry id',
    )

    await actions.updateExperienceEntry({
      experienceEntryId,
      changes: { endDate: '2024-06-01', isCurrent: false },
    })

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    await actions.updateExperienceEntry({
      experienceEntryId,
      changes: { isCurrent: true },
    })

    expect(useAppStore.getState().data.experienceEntries[experienceEntryId]).toMatchObject({
      isCurrent: true,
      endDate: null,
    })
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    await actions.updateExperienceEntry({
      experienceEntryId,
      changes: { endDate: '2025-01-01' },
    })

    expect(useAppStore.getState().data.experienceEntries[experienceEntryId]?.endDate).toBeNull()

    await actions.updateExperienceEntry({
      experienceEntryId,
      changes: { isCurrent: false, endDate: '2025-01-01' },
    })

    expect(useAppStore.getState().data.experienceEntries[experienceEntryId]).toMatchObject({
      isCurrent: false,
      endDate: '2025-01-01',
    })
  })

  it('reorders experience bullets and preview data reflects the new order', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.createExperienceEntry(profileId)
    const experienceEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.experienceEntries)[0],
      'Expected an experience entry id',
    )

    await actions.createExperienceBullet(experienceEntryId)
    await actions.createExperienceBullet(experienceEntryId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.experienceBullets)
          .filter((item) => item.experienceEntryId === experienceEntryId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second bullet id')

    await actions.updateExperienceBullet({
      experienceBulletId: firstBulletId,
      changes: { content: 'First bullet', enabled: true, level: 2 },
    })
    await actions.updateExperienceBullet({
      experienceBulletId: secondBulletId,
      changes: { content: 'Second bullet', enabled: true, level: 3 },
    })

    await actions.reorderExperienceBullets({
      experienceEntryId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.experienceEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual(['Second bullet', 'First bullet'])
    expect(preview?.experienceEntries[0]?.bullets.map((bullet) => bullet.level)).toEqual([3, 2])
  })

  it('defaults bullet levels to level 1 and rejects unsupported bullet level updates', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const experienceEntryId = expectDefined(await actions.createExperienceEntry(profileId), 'Expected an experience entry id')
    const educationEntryId = expectDefined(actions.createEducationEntry(profileId), 'Expected an education entry id')
    const projectId = expectDefined(actions.createProject(profileId), 'Expected a project id')
    const additionalExperienceEntryId = expectDefined(actions.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')

    await actions.createExperienceBullet(experienceEntryId)
    actions.createEducationBullet(educationEntryId)
    actions.createProjectBullet(projectId)
    actions.createAdditionalExperienceBullet(additionalExperienceEntryId)

    const experienceBulletId = expectDefined(Object.keys(useAppStore.getState().data.experienceBullets)[0], 'Expected an experience bullet id')
    const educationBulletId = expectDefined(Object.keys(useAppStore.getState().data.educationBullets)[0], 'Expected an education bullet id')
    const projectBulletId = expectDefined(Object.keys(useAppStore.getState().data.projectBullets)[0], 'Expected a project bullet id')
    const additionalExperienceBulletId = expectDefined(
      Object.keys(useAppStore.getState().data.additionalExperienceBullets)[0],
      'Expected an additional experience bullet id',
    )

    expect(useAppStore.getState().data.experienceBullets[experienceBulletId]?.level).toBe(defaultBulletLevel)
    expect(useAppStore.getState().data.educationBullets[educationBulletId]?.level).toBe(defaultBulletLevel)
    expect(useAppStore.getState().data.projectBullets[projectBulletId]?.level).toBe(defaultBulletLevel)
    expect(useAppStore.getState().data.additionalExperienceBullets[additionalExperienceBulletId]?.level).toBe(defaultBulletLevel)

    await actions.updateExperienceBullet({ experienceBulletId, changes: { level: 2 } })
    actions.updateEducationBullet({ educationBulletId, changes: { level: 3 } })
    actions.updateProjectBullet({ projectBulletId, changes: { level: 2 } })
    actions.updateAdditionalExperienceBullet({ additionalExperienceBulletId, changes: { level: 3 } })

    expect(useAppStore.getState().data.experienceBullets[experienceBulletId]?.level).toBe(2)
    expect(useAppStore.getState().data.educationBullets[educationBulletId]?.level).toBe(3)
    expect(useAppStore.getState().data.projectBullets[projectBulletId]?.level).toBe(2)
    expect(useAppStore.getState().data.additionalExperienceBullets[additionalExperienceBulletId]?.level).toBe(3)

    await actions.updateExperienceBullet({ experienceBulletId, changes: { level: 99 as never } })
    actions.updateEducationBullet({ educationBulletId, changes: { level: 0 as never } })
    actions.updateProjectBullet({ projectBulletId, changes: { level: -1 as never } })
    actions.updateAdditionalExperienceBullet({ additionalExperienceBulletId, changes: { level: 4 as never } })

    expect(useAppStore.getState().data.experienceBullets[experienceBulletId]?.level).toBe(2)
    expect(useAppStore.getState().data.educationBullets[educationBulletId]?.level).toBe(3)
    expect(useAppStore.getState().data.projectBullets[projectBulletId]?.level).toBe(2)
    expect(useAppStore.getState().data.additionalExperienceBullets[additionalExperienceBulletId]?.level).toBe(3)
  })

  it('reorders education bullets and preview data reflects the new order', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createEducationEntry(profileId)
    const educationEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.educationEntries)[0],
      'Expected an education entry id',
    )

    actions.createEducationBullet(educationEntryId)
    actions.createEducationBullet(educationEntryId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.educationBullets)
          .filter((item) => item.educationEntryId === educationEntryId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second bullet id')

    actions.updateEducationBullet({
      educationBulletId: firstBulletId,
      changes: { content: 'Dean list', enabled: true },
    })
    actions.updateEducationBullet({
      educationBulletId: secondBulletId,
      changes: { content: 'Senior capstone', enabled: true },
    })

    actions.reorderEducationBullets({
      educationEntryId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.educationEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual([
      'Senior capstone',
      'Dean list',
    ])
  })

  it('reorders achievements for a profile and preview data reflects the new order', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const firstAchievementId = expectDefined(await actions.createAchievement(profileId), 'Expected first achievement id')
    const secondAchievementId = expectDefined(await actions.createAchievement(profileId), 'Expected second achievement id')

    await actions.updateAchievement({
      achievementId: firstAchievementId,
      changes: { name: 'First achievement', description: 'First description' },
    })
    await actions.updateAchievement({
      achievementId: secondAchievementId,
      changes: { name: 'Second achievement', description: 'Second description' },
    })

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    await actions.reorderAchievements({
      profileId,
      orderedIds: [secondAchievementId, firstAchievementId],
    })

    expect(useAppStore.getState().data.achievements[secondAchievementId]?.sortOrder).toBe(1)
    expect(useAppStore.getState().data.achievements[firstAchievementId]?.sortOrder).toBe(2)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.achievements.map((item) => item.name)).toEqual(['Second achievement', 'First achievement'])
  })

  it('toggles achievement enabled state and excludes disabled achievements from preview data', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')
    const achievementId = expectDefined(await actions.createAchievement(profileId), 'Expected achievement id')

    await actions.updateAchievement({
      achievementId,
      changes: { name: 'Award', description: 'Received a company-wide award' },
    })

    expect(selectProfileDocumentData(useAppStore.getState().data, profileId)?.achievements).toHaveLength(1)

    await actions.updateAchievement({
      achievementId,
      changes: { enabled: false },
    })

    expect(useAppStore.getState().data.achievements[achievementId]?.enabled).toBe(false)
    expect(selectProfileDocumentData(useAppStore.getState().data, profileId)?.achievements).toHaveLength(0)
  })

  it('normalizes education entry dates for status changes and rejects invalid ranges', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createEducationEntry(profileId)
    const educationEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.educationEntries)[0],
      'Expected an education entry id',
    )

    actions.updateEducationEntry({
      educationEntryId,
      changes: {
        school: 'Example University',
        degree: 'B.S. Computer Science',
        startDate: '2020-09',
        endDate: '2024-05',
        status: 'graduated',
      },
    })

    const updatedAtBeforeStatusChange = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.updateEducationEntry({
      educationEntryId,
      changes: {
        status: 'in_progress',
        endDate: '2025-05',
      },
    })

    expect(useAppStore.getState().data.educationEntries[educationEntryId]).toMatchObject({
      startDate: '2020-09',
      endDate: null,
      status: 'in_progress',
    })
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBeforeStatusChange)

    actions.updateEducationEntry({
      educationEntryId,
      changes: { endDate: '2025-12' },
    })

    expect(useAppStore.getState().data.educationEntries[educationEntryId]).toMatchObject({
      endDate: null,
      status: 'in_progress',
    })

    actions.updateEducationEntry({
      educationEntryId,
      changes: {
        status: 'attended',
        endDate: '2023-12',
      },
    })

    const validEntry = expectDefined(
      useAppStore.getState().data.educationEntries[educationEntryId],
      'Expected updated education entry',
    )

    expect(validEntry).toMatchObject({
      startDate: '2020-09',
      endDate: '2023-12',
      status: 'attended',
    })

    const updatedAtBeforeInvalidRange = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.updateEducationEntry({
      educationEntryId,
      changes: { startDate: '2024-01' },
    })

    expect(useAppStore.getState().data.educationEntries[educationEntryId]).toEqual(validEntry)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).toBe(updatedAtBeforeInvalidRange)
  })

  it('reorders projects and project bullets and preview data reflects the new order', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const firstProjectId = expectDefined(actions.createProject(profileId), 'Expected first project id')
    const secondProjectId = expectDefined(actions.createProject(profileId), 'Expected second project id')

    actions.updateProject({
      projectId: firstProjectId,
      changes: { name: 'Alpha', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-03-01' },
    })
    actions.updateProject({
      projectId: secondProjectId,
      changes: { name: 'Beta', organization: '', startDate: '2024-04-01', endDate: '2024-05-01' },
    })

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.reorderProjects({
      profileId,
      orderedIds: [secondProjectId, firstProjectId],
    })

    expect(useAppStore.getState().data.projects[secondProjectId]?.sortOrder).toBe(1)
    expect(useAppStore.getState().data.projects[firstProjectId]?.sortOrder).toBe(2)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    actions.createProjectBullet(secondProjectId)
    actions.createProjectBullet(secondProjectId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.projectBullets)
          .filter((item) => item.projectId === secondProjectId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first project bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second project bullet id')

    actions.updateProjectBullet({
      projectBulletId: firstBulletId,
      changes: { content: 'First project bullet', enabled: true },
    })
    actions.updateProjectBullet({
      projectBulletId: secondBulletId,
      changes: { content: 'Second project bullet', enabled: true },
    })

    actions.reorderProjectBullets({
      projectId: secondProjectId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.projectEntries.map((item) => item.entry.name)).toEqual(['Beta', 'Alpha'])
    expect(preview?.projectEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual([
      'Second project bullet',
      'First project bullet',
    ])
  })

  it('rejects invalid project date ranges and excludes disabled projects from preview data', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')
    const projectId = expectDefined(actions.createProject(profileId), 'Expected project id')

    actions.updateProject({
      projectId,
      changes: { name: 'Portfolio rebuild', startDate: '2024-02-01', endDate: '2024-04-01', enabled: true },
    })

    const validProject = expectDefined(useAppStore.getState().data.projects[projectId], 'Expected valid project')
    const updatedAtBeforeInvalidRange = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.updateProject({
      projectId,
      changes: { startDate: '2024-05-01' },
    })

    expect(useAppStore.getState().data.projects[projectId]).toEqual(validProject)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).toBe(updatedAtBeforeInvalidRange)
    expect(selectProfileDocumentData(useAppStore.getState().data, profileId)?.projectEntries).toHaveLength(1)

    actions.updateProject({
      projectId,
      changes: { enabled: false },
    })

    expect(selectProfileDocumentData(useAppStore.getState().data, profileId)?.projectEntries).toHaveLength(0)
  })

  it('reorders additional experience entries and bullets and preview data reflects the new order', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const firstEntryId = expectDefined(actions.createAdditionalExperienceEntry(profileId), 'Expected first additional experience id')
    const secondEntryId = expectDefined(actions.createAdditionalExperienceEntry(profileId), 'Expected second additional experience id')

    actions.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: firstEntryId,
      changes: { title: 'Sergeant', organization: 'Army Reserve' },
    })
    actions.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: secondEntryId,
      changes: { title: 'Board Member', organization: 'Neighborhood Council' },
    })

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.reorderAdditionalExperienceEntries({
      profileId,
      orderedIds: [secondEntryId, firstEntryId],
    })

    expect(useAppStore.getState().data.additionalExperienceEntries[secondEntryId]?.sortOrder).toBe(1)
    expect(useAppStore.getState().data.additionalExperienceEntries[firstEntryId]?.sortOrder).toBe(2)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    actions.createAdditionalExperienceBullet(secondEntryId)
    actions.createAdditionalExperienceBullet(secondEntryId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.additionalExperienceBullets)
          .filter((item) => item.additionalExperienceEntryId === secondEntryId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first additional experience bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second additional experience bullet id')

    actions.updateAdditionalExperienceBullet({
      additionalExperienceBulletId: firstBulletId,
      changes: { content: 'Led training exercises', enabled: true },
    })
    actions.updateAdditionalExperienceBullet({
      additionalExperienceBulletId: secondBulletId,
      changes: { content: 'Coordinated emergency response drills', enabled: true },
    })

    actions.reorderAdditionalExperienceBullets({
      additionalExperienceEntryId: secondEntryId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.additionalExperienceEntries.map((item) => item.entry.title)).toEqual(['Board Member', 'Sergeant'])
    expect(preview?.additionalExperienceEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual([
      'Coordinated emergency response drills',
      'Led training exercises',
    ])
  })

  it('rejects invalid additional experience date ranges and excludes disabled additional experience from preview data', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')
    const entryId = expectDefined(actions.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')

    actions.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: entryId,
      changes: {
        title: 'Sergeant',
        organization: 'Army Reserve',
        location: 'Los Angeles, CA',
        startDate: '2020-01-01',
        endDate: '2022-01-01',
        enabled: true,
      },
    })

    const validEntry = expectDefined(useAppStore.getState().data.additionalExperienceEntries[entryId], 'Expected valid additional experience entry')
    const updatedAtBeforeInvalidRange = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: entryId,
      changes: { startDate: '2023-01-01' },
    })

    expect(useAppStore.getState().data.additionalExperienceEntries[entryId]).toEqual(validEntry)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).toBe(updatedAtBeforeInvalidRange)
    expect(selectProfileDocumentData(useAppStore.getState().data, profileId)?.additionalExperienceEntries).toHaveLength(1)

    actions.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: entryId,
      changes: { enabled: false },
    })

    expect(selectProfileDocumentData(useAppStore.getState().data, profileId)?.additionalExperienceEntries).toHaveLength(0)
  })

  it('reorders job contacts for a job', async () => {
    const { actions } = useAppStore.getState()

    await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const jobId = expectDefined(Object.keys(useAppStore.getState().data.jobs)[0], 'Expected a job id')

    await actions.createJobContact(jobId)
    await actions.createJobContact(jobId)

    const contactIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.jobContacts)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstContactId = expectDefined(contactIds[0], 'Expected first contact id')
    const secondContactId = expectDefined(contactIds[1], 'Expected second contact id')

    await actions.updateJobContact({
      jobContactId: firstContactId,
      changes: { name: 'Contact One' },
    })
    await actions.updateJobContact({
      jobContactId: secondContactId,
      changes: { name: 'Contact Two' },
    })

    await actions.reorderJobContacts({
      jobId,
      orderedIds: [secondContactId, firstContactId],
    })

    const reorderedContacts = Object.values(useAppStore.getState().data.jobContacts)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(reorderedContacts.map((item) => item.name)).toEqual(['Contact Two', 'Contact One'])
  })

  it('creates a job with an optional initial link', async () => {
    const { actions } = useAppStore.getState()

    const jobId = expectDefined(await actions.createJob({
      companyName: 'Example Co',
      jobTitle: 'Engineer',
      initialLinkUrl: 'https://example.com/job',
    }), 'Expected job id')

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      jobTitle: 'Engineer',
      appliedAt: null,
      finalOutcome: null,
    })

    const jobLinks = Object.values(useAppStore.getState().data.jobLinks)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(jobLinks).toHaveLength(1)
    expect(jobLinks[0]?.url).toBe('https://example.com/job')
  })

  it('sets and clears job progress fields', async () => {
    const { actions } = useAppStore.getState()

    const jobId = expectDefined(await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')
    const updatedAtBefore = useAppStore.getState().data.jobs[jobId]?.updatedAt
    await waitForNextTick()

    await actions.setJobAppliedAt({ jobId, appliedAt: '2026-03-09T12:00:00.000Z' })
    await actions.setJobFinalOutcome({ jobId, status: 'offer_received', setAt: '2026-03-10T09:30:00.000Z' })

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: '2026-03-09T12:00:00.000Z',
      finalOutcome: {
        status: 'offer_received',
        setAt: '2026-03-10T09:30:00.000Z',
      },
    })
    expect(useAppStore.getState().data.jobs[jobId]?.updatedAt).not.toBe(updatedAtBefore)

    await actions.clearJobAppliedAt(jobId)

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: null,
      finalOutcome: null,
    })
  })

  it('does not allow a final outcome when the job is not applied', async () => {
    const { actions } = useAppStore.getState()

    const jobId = expectDefined(await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')

    await actions.setJobFinalOutcome({ jobId, status: 'rejected', setAt: '2026-03-10T09:30:00.000Z' })

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: null,
      finalOutcome: null,
    })

    await actions.setJobAppliedAt({ jobId, appliedAt: '2026-03-09T12:00:00.000Z' })
    await actions.setJobFinalOutcome({ jobId, status: 'rejected', setAt: '2026-03-10T09:30:00.000Z' })

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: '2026-03-09T12:00:00.000Z',
      finalOutcome: {
        status: 'rejected',
        setAt: '2026-03-10T09:30:00.000Z',
      },
    })
  })

  it('creates interviews, manages associated contacts, and preserves interview contact order through export/import', async () => {
    const { actions } = useAppStore.getState()

    const jobId = expectDefined(await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')

    await actions.createJobContact(jobId)
    await actions.createJobContact(jobId)

    const contactIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.jobContacts)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstContactId = expectDefined(contactIds[0], 'Expected first contact id')
    const secondContactId = expectDefined(contactIds[1], 'Expected second contact id')

    await actions.updateJobContact({ jobContactId: firstContactId, changes: { name: 'Contact One' } })
    await actions.updateJobContact({ jobContactId: secondContactId, changes: { name: 'Contact Two' } })

    const interviewId = expectDefined(await actions.createInterview(jobId), 'Expected interview id')

    expect(useAppStore.getState().data.interviews[interviewId]).toMatchObject({
      startAt: null,
    })

    await actions.updateInterview({
      interviewId,
      changes: {
        startAt: '2026-03-12T15:00:00.000Z',
        notes: 'Team screen',
      },
    })

    await actions.addInterviewContact({ interviewId, jobContactId: firstContactId })
    await actions.addInterviewContact({ interviewId, jobContactId: secondContactId })

    const interviewContactIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.interviewContacts)
          .filter((item) => item.interviewId === interviewId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstInterviewContactId = expectDefined(interviewContactIds[0], 'Expected first interview contact id')
    const secondInterviewContactId = expectDefined(interviewContactIds[1], 'Expected second interview contact id')

    await actions.reorderInterviewContacts({
      interviewId,
      orderedIds: [secondInterviewContactId, firstInterviewContactId],
    })

    const exported = await actions.exportAppData()

    resetStore()
    await useAppStore.getState().actions.importAppData(exported)

    const importedInterviewContacts = Object.values(useAppStore.getState().data.interviewContacts)
      .filter((item) => item.interviewId === interviewId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedInterviewContacts.map((item) => useAppStore.getState().data.jobContacts[item.jobContactId]?.name)).toEqual([
      'Contact Two',
      'Contact One',
    ])
  })

  it('allows an interview to remain unscheduled', async () => {
    const { actions } = useAppStore.getState()

    const jobId = expectDefined(await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')
    const interviewId = expectDefined(await actions.createInterview(jobId), 'Expected interview id')

    await actions.updateInterview({
      interviewId,
      changes: {
        notes: 'Awaiting scheduling confirmation',
      },
    })

    expect(useAppStore.getState().data.interviews[interviewId]).toMatchObject({
      startAt: null,
      notes: 'Awaiting scheduling confirmation',
    })
  })

  it('cascades interview associations when deleting a contact, interview, or job', async () => {
    const { actions } = useAppStore.getState()

    const jobId = expectDefined(await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')
    await actions.createJobContact(jobId)
    const contactId = expectDefined(Object.keys(useAppStore.getState().data.jobContacts)[0], 'Expected contact id')
    const interviewId = expectDefined(await actions.createInterview(jobId), 'Expected interview id')

    await actions.addInterviewContact({ interviewId, jobContactId: contactId })
    const interviewContactId = expectDefined(Object.keys(useAppStore.getState().data.interviewContacts)[0], 'Expected interview contact id')

    await actions.deleteJobContact(contactId)
    expect(useAppStore.getState().data.interviewContacts[interviewContactId]).toBeUndefined()

    await actions.createJobContact(jobId)
    const replacementContactId = expectDefined(Object.keys(useAppStore.getState().data.jobContacts)[0], 'Expected replacement contact id')
    await actions.addInterviewContact({ interviewId, jobContactId: replacementContactId })
    const replacementAssociationId = expectDefined(Object.keys(useAppStore.getState().data.interviewContacts)[0], 'Expected replacement interview contact id')

    await actions.deleteInterview(interviewId)
    expect(useAppStore.getState().data.interviews[interviewId]).toBeUndefined()
    expect(useAppStore.getState().data.interviewContacts[replacementAssociationId]).toBeUndefined()

    const secondInterviewId = expectDefined(await actions.createInterview(jobId), 'Expected second interview id')
    await actions.addInterviewContact({ interviewId: secondInterviewId, jobContactId: replacementContactId })
    expect(Object.keys(useAppStore.getState().data.interviewContacts)).toHaveLength(1)

    await actions.deleteJob(jobId)
    expect(useAppStore.getState().data.jobs[jobId]).toBeUndefined()
    expect(Object.keys(useAppStore.getState().data.interviews)).toHaveLength(0)
    expect(Object.keys(useAppStore.getState().data.interviewContacts)).toHaveLength(0)
  })

  it('computes job status from appliedAt, interviews, and finalOutcome', async () => {
    expect(getJobComputedStatus({ appliedAt: null, finalOutcome: null, interviewCount: 0 })).toBe('interested')
    expect(getJobComputedStatus({ appliedAt: '2026-03-09T12:00:00.000Z', finalOutcome: null, interviewCount: 0 })).toBe('applied')
    expect(getJobComputedStatus({ appliedAt: '2026-03-09T12:00:00.000Z', finalOutcome: null, interviewCount: 1 })).toBe('interview')
    expect(
      getJobComputedStatus({
        appliedAt: '2026-03-09T12:00:00.000Z',
        finalOutcome: { status: 'offer_received', setAt: '2026-03-10T12:00:00.000Z' },
        interviewCount: 1,
      }),
    ).toBe('offer_received')
    expect(
      getJobComputedStatus({
        appliedAt: '2026-03-09T12:00:00.000Z',
        finalOutcome: { status: 'offer_accepted', setAt: '2026-03-11T12:00:00.000Z' },
        interviewCount: 2,
      }),
    ).toBe('offer_accepted')
    expect(
      getJobComputedStatus({
        appliedAt: '2026-03-09T12:00:00.000Z',
        finalOutcome: { status: 'rejected', setAt: '2026-03-11T12:00:00.000Z' },
        interviewCount: 2,
      }),
    ).toBe('rejected')
  })

  it('preserves job link order through export and import', async () => {
    const { actions } = useAppStore.getState()

    await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const jobId = expectDefined(Object.keys(useAppStore.getState().data.jobs)[0], 'Expected a job id')

    await actions.createJobLink(jobId)
    await actions.createJobLink(jobId)

    const jobLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.jobLinks)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstJobLinkId = expectDefined(jobLinkIds[0], 'Expected first job link id')
    const secondJobLinkId = expectDefined(jobLinkIds[1], 'Expected second job link id')

    await actions.updateJobLink({
      jobLinkId: firstJobLinkId,
      changes: { url: 'https://example.com/job' },
    })
    await actions.updateJobLink({
      jobLinkId: secondJobLinkId,
      changes: { url: 'https://linkedin.com/jobs/view/example' },
    })

    await actions.reorderJobLinks({
      jobId,
      orderedIds: [secondJobLinkId, firstJobLinkId],
    })

    const exported = await actions.exportAppData()

    resetStore()
    await useAppStore.getState().actions.importAppData(exported)

    const importedJobLinks = Object.values(useAppStore.getState().data.jobLinks)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedJobLinks.map((item) => item.url)).toEqual([
      'https://linkedin.com/jobs/view/example',
      'https://example.com/job',
    ])
  })

  it('preserves application question order through export and import', async () => {
    const { actions } = useAppStore.getState()

    await actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const jobId = expectDefined(Object.keys(useAppStore.getState().data.jobs)[0], 'Expected a job id')

    await actions.createApplicationQuestion(jobId)
    await actions.createApplicationQuestion(jobId)

    const questionIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.applicationQuestions)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstQuestionId = expectDefined(questionIds[0], 'Expected first application question id')
    const secondQuestionId = expectDefined(questionIds[1], 'Expected second application question id')

    await actions.updateApplicationQuestion({
      applicationQuestionId: firstQuestionId,
      changes: { question: 'Question One', answer: 'Answer One' },
    })
    await actions.updateApplicationQuestion({
      applicationQuestionId: secondQuestionId,
      changes: { question: 'Question Two', answer: 'Answer Two' },
    })

    await actions.reorderApplicationQuestions({
      jobId,
      orderedIds: [secondQuestionId, firstQuestionId],
    })

    const exported = await actions.exportAppData()

    resetStore()
    await useAppStore.getState().actions.importAppData(exported)

    const importedQuestions = Object.values(useAppStore.getState().data.applicationQuestions)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedQuestions.map((item) => item.question)).toEqual(['Question Two', 'Question One'])
  })

  it('preserves resume settings through profile duplication and export/import', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.setDocumentHeaderTemplate({ profileId, headerTemplate: 'stacked' })
    await actions.setResumeSectionLabel({ profileId, section: 'summary', label: 'Career Summary' })
    await actions.setResumeSectionEnabled({ profileId, section: 'references', enabled: false })
    await actions.reorderResumeSections({
      profileId,
      orderedSections: ['experience', 'summary', 'skills', 'achievements', 'education', 'projects', 'additional_experience', 'certifications', 'references'],
    })

    const achievementId = expectDefined(await actions.createAchievement(profileId), 'Expected achievement id')
    await actions.updateAchievement({
      achievementId,
      changes: { name: 'Promotion', description: 'Promoted after leading a critical delivery' },
    })
    const projectId = expectDefined(actions.createProject(profileId), 'Expected project id')
    actions.updateProject({
      projectId,
      changes: { name: 'Migration tool', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-02-01' },
    })
    actions.createProjectBullet(projectId)
    const projectBulletId = expectDefined(Object.keys(useAppStore.getState().data.projectBullets)[0], 'Expected project bullet id')
    actions.updateProjectBullet({
      projectBulletId,
      changes: { content: 'Automated bulk migration workflow', enabled: true, level: 2 },
    })
    const additionalExperienceEntryId = expectDefined(actions.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')
    actions.updateAdditionalExperienceEntry({
      additionalExperienceEntryId,
      changes: { title: 'Sergeant', organization: 'Army Reserve', location: 'Los Angeles, CA', startDate: '2020-01-01', endDate: '2022-01-01' },
    })
    actions.createAdditionalExperienceBullet(additionalExperienceEntryId)
    const additionalExperienceBulletId = expectDefined(
      Object.keys(useAppStore.getState().data.additionalExperienceBullets)[0],
      'Expected additional experience bullet id',
    )
    actions.updateAdditionalExperienceBullet({
      additionalExperienceBulletId,
      changes: { content: 'Led CBRN readiness training', enabled: true, level: 3 },
    })

    const duplicatedProfileId = expectDefined(
      await actions.duplicateProfile({ sourceProfileId: profileId }),
      'Expected duplicate profile id',
    )

    expect(getOrderedResumeSections(useAppStore.getState().data.profiles[duplicatedProfileId]!).map((section) => section.section)).toEqual([
      'experience',
      'summary',
      'skills',
      'achievements',
      'education',
      'projects',
      'additional_experience',
      'certifications',
      'references',
    ])
    expect(useAppStore.getState().data.profiles[duplicatedProfileId]?.resumeSettings.headerTemplate).toBe('stacked')
    expect(useAppStore.getState().data.profiles[duplicatedProfileId]?.resumeSettings.sections.summary.label).toBe('Career Summary')
    expect(useAppStore.getState().data.profiles[duplicatedProfileId]?.resumeSettings.sections.references.enabled).toBe(false)
    const duplicatedAchievement = Object.values(useAppStore.getState().data.achievements).find((item) => item.profileId === duplicatedProfileId)
    expect(duplicatedAchievement).toMatchObject({
      name: 'Promotion',
      description: 'Promoted after leading a critical delivery',
      enabled: true,
      sortOrder: 1,
    })
    const duplicatedProject = Object.values(useAppStore.getState().data.projects).find((item) => item.profileId === duplicatedProfileId)
    expect(duplicatedProject).toMatchObject({
      name: 'Migration tool',
      organization: 'Acme',
      startDate: '2024-01-01',
      endDate: '2024-02-01',
      enabled: true,
      sortOrder: 1,
    })
    const duplicatedProjectBullet = Object.values(useAppStore.getState().data.projectBullets).find((item) => item.projectId === duplicatedProject?.id)
    expect(duplicatedProjectBullet).toMatchObject({
      content: 'Automated bulk migration workflow',
      level: 2,
      enabled: true,
      sortOrder: 1,
    })
    const duplicatedAdditionalExperience = Object.values(useAppStore.getState().data.additionalExperienceEntries).find(
      (item) => item.profileId === duplicatedProfileId,
    )
    expect(duplicatedAdditionalExperience).toMatchObject({
      title: 'Sergeant',
      organization: 'Army Reserve',
      location: 'Los Angeles, CA',
      startDate: '2020-01-01',
      endDate: '2022-01-01',
      enabled: true,
      sortOrder: 1,
    })
    const duplicatedAdditionalExperienceBullet = Object.values(useAppStore.getState().data.additionalExperienceBullets).find(
      (item) => item.additionalExperienceEntryId === duplicatedAdditionalExperience?.id,
    )
    expect(duplicatedAdditionalExperienceBullet).toMatchObject({
      content: 'Led CBRN readiness training',
      level: 3,
      enabled: true,
      sortOrder: 1,
    })

    const exported = await actions.exportAppData()

    resetStore()
    await useAppStore.getState().actions.importAppData(exported)

    const importedProfile = useAppStore.getState().data.profiles[duplicatedProfileId]
  expect(importedProfile?.resumeSettings.headerTemplate).toBe('stacked')
    expect(importedProfile?.resumeSettings.sections.summary.label).toBe('Career Summary')
    expect(importedProfile?.resumeSettings.sections.references.enabled).toBe(false)
    expect(getOrderedResumeSections(importedProfile!).map((section) => section.section)).toEqual([
      'experience',
      'summary',
      'skills',
      'achievements',
      'education',
      'projects',
      'additional_experience',
      'certifications',
      'references',
    ])
    expect(useAppStore.getState().data.achievements[duplicatedAchievement!.id]).toMatchObject({
      name: 'Promotion',
      description: 'Promoted after leading a critical delivery',
    })
    expect(useAppStore.getState().data.projects[duplicatedProject!.id]).toMatchObject({
      name: 'Migration tool',
      organization: 'Acme',
    })
    expect(useAppStore.getState().data.projectBullets[duplicatedProjectBullet!.id]).toMatchObject({
      content: 'Automated bulk migration workflow',
      level: 2,
    })
    expect(useAppStore.getState().data.additionalExperienceEntries[duplicatedAdditionalExperience!.id]).toMatchObject({
      title: 'Sergeant',
      organization: 'Army Reserve',
    })
    expect(useAppStore.getState().data.additionalExperienceBullets[duplicatedAdditionalExperienceBullet!.id]).toMatchObject({
      content: 'Led CBRN readiness training',
      level: 3,
    })
  })

  it('duplicates and cascades deletes projects and project bullets with their parent profile', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const originalProjectId = expectDefined(actions.createProject(profileId), 'Expected project id')
    actions.updateProject({
      projectId: originalProjectId,
      changes: { name: 'Internal dashboard', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-03-01' },
    })
    actions.createProjectBullet(originalProjectId)
    const originalProjectBulletId = expectDefined(Object.keys(useAppStore.getState().data.projectBullets)[0], 'Expected project bullet id')
    actions.updateProjectBullet({
      projectBulletId: originalProjectBulletId,
      changes: { content: 'Built analytics reporting view', enabled: true },
    })

    const duplicatedProfileId = expectDefined(await actions.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedProject = expectDefined(
      Object.values(useAppStore.getState().data.projects).find((item) => item.profileId === duplicatedProfileId),
      'Expected duplicated project',
    )

    expect(duplicatedProject).toMatchObject({
      name: 'Internal dashboard',
      organization: 'Acme',
      startDate: '2024-01-01',
      endDate: '2024-03-01',
      enabled: true,
      sortOrder: 1,
    })
    expect(duplicatedProject.id).not.toBe(originalProjectId)

    const duplicatedProjectBullet = expectDefined(
      Object.values(useAppStore.getState().data.projectBullets).find((item) => item.projectId === duplicatedProject.id),
      'Expected duplicated project bullet',
    )

    expect(duplicatedProjectBullet).toMatchObject({
      content: 'Built analytics reporting view',
      enabled: true,
      sortOrder: 1,
    })
    expect(duplicatedProjectBullet.id).not.toBe(originalProjectBulletId)

    actions.deleteProject(originalProjectId)
    expect(Object.values(useAppStore.getState().data.projectBullets).filter((item) => item.projectId === originalProjectId)).toHaveLength(0)
    expect(Object.values(useAppStore.getState().data.projectBullets).filter((item) => item.projectId === duplicatedProject.id)).toHaveLength(1)

    await actions.deleteProfile(duplicatedProfileId)

    expect(Object.values(useAppStore.getState().data.projects).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(0)
    expect(Object.values(useAppStore.getState().data.projectBullets).filter((item) => item.projectId === duplicatedProject.id)).toHaveLength(0)
  })

  it('duplicates and cascades deletes additional experience entries and bullets with their parent profile', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const originalEntryId = expectDefined(actions.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')
    actions.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: originalEntryId,
      changes: { title: 'Sergeant', organization: 'Army Reserve', location: 'Los Angeles, CA', startDate: '2020-01-01', endDate: '2022-01-01' },
    })
    actions.createAdditionalExperienceBullet(originalEntryId)
    const originalBulletId = expectDefined(
      Object.keys(useAppStore.getState().data.additionalExperienceBullets)[0],
      'Expected additional experience bullet id',
    )
    actions.updateAdditionalExperienceBullet({
      additionalExperienceBulletId: originalBulletId,
      changes: { content: 'Led CBRN readiness training', enabled: true },
    })

    const duplicatedProfileId = expectDefined(await actions.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedEntry = expectDefined(
      Object.values(useAppStore.getState().data.additionalExperienceEntries).find((item) => item.profileId === duplicatedProfileId),
      'Expected duplicated additional experience entry',
    )

    expect(duplicatedEntry).toMatchObject({
      title: 'Sergeant',
      organization: 'Army Reserve',
      location: 'Los Angeles, CA',
      startDate: '2020-01-01',
      endDate: '2022-01-01',
      enabled: true,
      sortOrder: 1,
    })
    expect(duplicatedEntry.id).not.toBe(originalEntryId)

    const duplicatedBullet = expectDefined(
      Object.values(useAppStore.getState().data.additionalExperienceBullets).find(
        (item) => item.additionalExperienceEntryId === duplicatedEntry.id,
      ),
      'Expected duplicated additional experience bullet',
    )

    expect(duplicatedBullet).toMatchObject({
      content: 'Led CBRN readiness training',
      enabled: true,
      sortOrder: 1,
    })
    expect(duplicatedBullet.id).not.toBe(originalBulletId)

    actions.deleteAdditionalExperienceEntry(originalEntryId)
    expect(
      Object.values(useAppStore.getState().data.additionalExperienceBullets).filter(
        (item) => item.additionalExperienceEntryId === originalEntryId,
      ),
    ).toHaveLength(0)
    expect(
      Object.values(useAppStore.getState().data.additionalExperienceBullets).filter(
        (item) => item.additionalExperienceEntryId === duplicatedEntry.id,
      ),
    ).toHaveLength(1)

    await actions.deleteProfile(duplicatedProfileId)

    expect(
      Object.values(useAppStore.getState().data.additionalExperienceEntries).filter((item) => item.profileId === duplicatedProfileId),
    ).toHaveLength(0)
    expect(
      Object.values(useAppStore.getState().data.additionalExperienceBullets).filter(
        (item) => item.additionalExperienceEntryId === duplicatedEntry.id,
      ),
    ).toHaveLength(0)
  })

  it('duplicates and cascades deletes achievements with their parent profile', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const originalAchievementId = expectDefined(await actions.createAchievement(profileId), 'Expected achievement id')
    await actions.updateAchievement({
      achievementId: originalAchievementId,
      changes: { name: 'Team award', description: 'Recognized for a cross-team platform initiative' },
    })

    const duplicatedProfileId = expectDefined(await actions.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedAchievements = Object.values(useAppStore.getState().data.achievements)
      .filter((item) => item.profileId === duplicatedProfileId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(duplicatedAchievements).toHaveLength(1)
    expect(duplicatedAchievements[0]).toMatchObject({
      name: 'Team award',
      description: 'Recognized for a cross-team platform initiative',
      enabled: true,
      sortOrder: 1,
    })
    expect(duplicatedAchievements[0]?.id).not.toBe(originalAchievementId)

    await actions.deleteProfile(profileId)

    expect(Object.values(useAppStore.getState().data.achievements).filter((item) => item.profileId === profileId)).toHaveLength(0)
    expect(Object.values(useAppStore.getState().data.achievements).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)

    await actions.deleteProfile(duplicatedProfileId)

    expect(Object.keys(useAppStore.getState().data.achievements)).toHaveLength(0)
  })

  it('preserves achievement data through export and import', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')
    const achievementId = expectDefined(await actions.createAchievement(profileId), 'Expected achievement id')

    await actions.updateAchievement({
      achievementId,
      changes: { name: 'Conference speaker', description: 'Presented a talk on service reliability', enabled: false },
    })

    const exported = await actions.exportAppData()

    resetStore()
    await useAppStore.getState().actions.importAppData(exported)

    expect(useAppStore.getState().data.achievements[achievementId]).toMatchObject({
      profileId,
      name: 'Conference speaker',
      description: 'Presented a talk on service reliability',
      enabled: false,
      sortOrder: 1,
    })
  })

  it('duplicates and cascades deletes profile links with their parent profile', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.createProfileLink(profileId)
    const originalLinkId = expectDefined(Object.keys(useAppStore.getState().data.profileLinks)[0], 'Expected a profile link id')

    await actions.updateProfileLink({
      profileLinkId: originalLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })

    const duplicatedProfileId = expectDefined(await actions.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')

    const duplicatedLinks = Object.values(useAppStore.getState().data.profileLinks)
      .filter((item) => item.profileId === duplicatedProfileId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(duplicatedLinks).toHaveLength(1)
    expect(duplicatedLinks[0]).toMatchObject({
      name: 'Portfolio',
      url: 'https://example.com/portfolio',
      enabled: true,
      sortOrder: 1,
    })
    expect(duplicatedLinks[0]?.id).not.toBe(originalLinkId)

    await actions.deleteProfile(profileId)

    expect(Object.values(useAppStore.getState().data.profileLinks).filter((item) => item.profileId === profileId)).toHaveLength(0)
    expect(Object.values(useAppStore.getState().data.profileLinks).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)

    await actions.deleteProfile(duplicatedProfileId)

    expect(Object.keys(useAppStore.getState().data.profileLinks)).toHaveLength(0)
  })

  it('duplicates and cascades deletes education bullets with their parent profile and education entry', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createEducationEntry(profileId)
    const educationEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.educationEntries)[0],
      'Expected an education entry id',
    )

    actions.updateEducationEntry({
      educationEntryId,
      changes: {
        school: 'Example University',
        degree: 'B.S. Computer Science',
        startDate: '2020-09',
        endDate: '2024-05',
        status: 'graduated',
      },
    })

    actions.createEducationBullet(educationEntryId)
    const originalBulletId = expectDefined(
      Object.keys(useAppStore.getState().data.educationBullets)[0],
      'Expected an education bullet id',
    )

    actions.updateEducationBullet({
      educationBulletId: originalBulletId,
      changes: { content: 'Graduated magna cum laude', enabled: true },
    })

    const duplicatedProfileId = expectDefined(await actions.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')

    const duplicatedEducationEntry = expectDefined(
      Object.values(useAppStore.getState().data.educationEntries).find((item) => item.profileId === duplicatedProfileId),
      'Expected duplicated education entry',
    )

    expect(duplicatedEducationEntry).toMatchObject({
      school: 'Example University',
      degree: 'B.S. Computer Science',
      startDate: '2020-09',
      endDate: '2024-05',
      status: 'graduated',
    })

    const duplicatedBullets = Object.values(useAppStore.getState().data.educationBullets)
      .filter((item) => item.educationEntryId === duplicatedEducationEntry.id)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(duplicatedBullets).toHaveLength(1)
    expect(duplicatedBullets[0]).toMatchObject({
      content: 'Graduated magna cum laude',
      enabled: true,
      sortOrder: 1,
    })
    expect(duplicatedBullets[0]?.id).not.toBe(originalBulletId)

    actions.deleteEducationEntry(educationEntryId)
    expect(Object.values(useAppStore.getState().data.educationBullets).filter((item) => item.educationEntryId === educationEntryId)).toHaveLength(0)
    expect(Object.values(useAppStore.getState().data.educationBullets).filter((item) => item.educationEntryId === duplicatedEducationEntry.id)).toHaveLength(1)

    await actions.deleteProfile(duplicatedProfileId)

    expect(Object.values(useAppStore.getState().data.educationBullets).filter((item) => item.educationEntryId === duplicatedEducationEntry.id)).toHaveLength(0)
  })

  it('preserves education bullet data through export and import', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createEducationEntry(profileId)
    const educationEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.educationEntries)[0],
      'Expected an education entry id',
    )

    actions.updateEducationEntry({
      educationEntryId,
      changes: {
        school: 'Example University',
        degree: 'M.S. Data Science',
        startDate: '2021-09',
        endDate: null,
        status: 'in_progress',
      },
    })

    actions.createEducationBullet(educationEntryId)
    const educationBulletId = expectDefined(
      Object.keys(useAppStore.getState().data.educationBullets)[0],
      'Expected an education bullet id',
    )

    actions.updateEducationBullet({
      educationBulletId,
      changes: { content: 'Honors program', enabled: false, level: 2 },
    })

    const exported = await actions.exportAppData()

    resetStore()
    await useAppStore.getState().actions.importAppData(exported)

    expect(useAppStore.getState().data.educationEntries[educationEntryId]).toMatchObject({
      school: 'Example University',
      degree: 'M.S. Data Science',
      startDate: '2021-09',
      endDate: null,
      status: 'in_progress',
    })
    expect(useAppStore.getState().data.educationBullets[educationBulletId]).toMatchObject({
      educationEntryId,
      content: 'Honors program',
      level: 2,
      enabled: false,
      sortOrder: 1,
    })
  })

  it('preserves profile link order through export and import', async () => {
    const { actions } = useAppStore.getState()

    await actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    await actions.createProfileLink(profileId)
    await actions.createProfileLink(profileId)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')

    await actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'GitHub', url: 'https://github.com/example', enabled: false },
    })
    await actions.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'Website', url: 'https://example.com' },
    })

    await actions.reorderProfileLinks({
      profileId,
      orderedIds: [secondProfileLinkId, firstProfileLinkId],
    })

    const exported = await actions.exportAppData()

    resetStore()
    await useAppStore.getState().actions.importAppData(exported)

    const importedLinks = Object.values(useAppStore.getState().data.profileLinks)
      .filter((item) => item.profileId === profileId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedLinks.map((item) => item.name)).toEqual(['Website', 'GitHub'])
    expect(importedLinks.map((item) => item.url)).toEqual(['https://example.com', 'https://github.com/example'])
    expect(importedLinks.map((item) => item.enabled)).toEqual([true, false])
  })
})

describe('app store theme preference', () => {
  beforeEach(() => {
    resetStore()
  })

  it('updates the theme preference and preserves it when resetting ui state', async () => {
    const { actions } = useAppStore.getState()

    actions.setThemePreference('dark')
    actions.selectJob('job-123')
    actions.selectProfile('profile-123')

    expect(useAppStore.getState().ui.themePreference).toBe('dark')

    actions.resetUiState()

    expect(useAppStore.getState().ui.themePreference).toBe('dark')
    expect(useAppStore.getState().ui.selectedJobId).toBeNull()
    expect(useAppStore.getState().ui.selectedProfileId).toBeNull()
  })
})

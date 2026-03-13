import { beforeEach, describe, expect, it } from 'vitest'

import { getOrderedResumeSections, selectProfileDocumentData } from '../features/documents/document-data'
import type { AppExportFile } from '../types/state'
import { createEmptyAppDataState } from '../domain/app-data-state'
import { createDefaultResumeSettings } from '../domain/profile-defaults'
import { defaultBulletLevel } from '../utils/bullet-levels'
import { defaultDocumentHeaderTemplate } from '../utils/document-header-templates'
import { MockAppBackend } from './mock-app-backend'

const getOrderedIds = <T extends { id: string; sortOrder: number }>(items: Record<string, T>) =>
  Object.values(items)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => item.id)

const expectDefined = <T>(value: T | null | undefined, message: string): T => {
  expect(value, message).toBeDefined()
  expect(value, message).not.toBeNull()
  return value as T
}

const expectCreatedId = <T extends { createdId?: string | null }>(result: T, message: string) =>
  expectDefined(result.createdId, message)

const waitForNextTick = () => new Promise((resolve) => setTimeout(resolve, 2))

describe('mock app backend mutation behaviors', () => {
  let backend: MockAppBackend

  const getData = () => backend.getAppData()

  beforeEach(() => {
    backend = new MockAppBackend()
  })

  it('does not overwrite backend-seeded data before the first mutation', async () => {
    const seededData = createEmptyAppDataState()
    seededData.profiles.profile_seeded = {
      id: 'profile_seeded',
      name: 'Seeded Profile',
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

    backend = new MockAppBackend({ initialData: seededData })

    const createdProfileId = expectCreatedId(await backend.createBaseProfile('New Profile'), 'Expected profile id')
    const data = await getData()

    expect(createdProfileId).toBeDefined()
    expect(data.profiles.profile_seeded?.name).toBe('Seeded Profile')
    expect(Object.keys(data.profiles)).toHaveLength(2)
  })

  it('reorders skill categories for a profile', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    await backend.createSkillCategory(profileId)
    await backend.createSkillCategory(profileId)

    const initialIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).skillCategories)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstSkillCategoryId = expectDefined(initialIds[0], 'Expected first skill category id')
    const secondSkillCategoryId = expectDefined(initialIds[1], 'Expected second skill category id')

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.reorderSkillCategories({
      profileId,
      orderedIds: [secondSkillCategoryId, firstSkillCategoryId],
    })

    const data = await getData()
    expect(data.skillCategories[secondSkillCategoryId]?.sortOrder).toBe(1)
    expect(data.skillCategories[firstSkillCategoryId]?.sortOrder).toBe(2)
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)
  })

  it('reorders enabled profile links for a profile and preview data reflects the new order', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    await backend.createProfileLink(profileId)
    await backend.createProfileLink(profileId)

    const createdLinks = Object.values((await getData()).profileLinks).filter((item) => item.profileId === profileId)
    expect(createdLinks.every((item) => item.enabled)).toBe(true)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')
    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })
    await backend.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    })

    await backend.reorderProfileLinks({
      profileId,
      orderedIds: [secondProfileLinkId, firstProfileLinkId],
    })

    const data = await getData()
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)
    const preview = selectProfileDocumentData(data, profileId)
    expect(preview?.profileLinks.map((link) => link.name)).toEqual(['LinkedIn', 'Portfolio'])
    expect(preview?.profileLinks.map((link) => link.url)).toEqual([
      'https://linkedin.com/in/example',
      'https://example.com/portfolio',
    ])
  })

  it('toggles profile link enabled state and excludes disabled links from preview data', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    await backend.createProfileLink(profileId)
    await backend.createProfileLink(profileId)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')

    await backend.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })
    await backend.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    })

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { enabled: false },
    })

    const data = await getData()
    expect(data.profileLinks[firstProfileLinkId]?.enabled).toBe(false)
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    const preview = selectProfileDocumentData(data, profileId)
    expect(preview?.profileLinks.map((link) => link.name)).toEqual(['LinkedIn'])
    expect(preview?.profileLinks.map((link) => link.url)).toEqual(['https://linkedin.com/in/example'])
  })

  it('initializes, updates, and reorders per-profile resume settings', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const initialProfile = (await getData()).profiles[profileId]
    expect(initialProfile?.resumeSettings.headerTemplate).toBe(defaultDocumentHeaderTemplate)
    expect(initialProfile?.resumeSettings.sections.summary.enabled).toBe(true)
    expect(initialProfile?.resumeSettings.sections.summary.sortOrder).toBe(1)
    expect(initialProfile?.resumeSettings.sections.summary.label).toBe('Summary')
    expect(initialProfile?.resumeSettings.sections.achievements.sortOrder).toBe(3)
    expect(initialProfile?.resumeSettings.sections.projects.sortOrder).toBe(6)
    expect(initialProfile?.resumeSettings.sections.additional_experience.sortOrder).toBe(7)
    expect(initialProfile?.resumeSettings.sections.references.sortOrder).toBe(9)

    await backend.setDocumentHeaderTemplate({
      profileId,
      headerTemplate: 'stacked',
    })

    await backend.setResumeSectionLabel({
      profileId,
      section: 'summary',
      label: 'Professional Summary',
    })

    await backend.setResumeSectionEnabled({
      profileId,
      section: 'references',
      enabled: false,
    })

    await backend.reorderResumeSections({
      profileId,
      orderedSections: ['skills', 'achievements', 'experience', 'summary', 'education', 'projects', 'additional_experience', 'certifications', 'references'],
    })

    const nextProfile = (await getData()).profiles[profileId]
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
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const experienceEntryId = expectCreatedId(await backend.createExperienceEntry(profileId), 'Expected an experience entry id')

    await backend.updateExperienceEntry({
      experienceEntryId,
      changes: { endDate: '2024-06-01', isCurrent: false },
    })

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.updateExperienceEntry({
      experienceEntryId,
      changes: { isCurrent: true },
    })

    let data = await getData()
    expect(data.experienceEntries[experienceEntryId]).toMatchObject({
      isCurrent: true,
      endDate: null,
    })
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    await backend.updateExperienceEntry({
      experienceEntryId,
      changes: { endDate: '2025-01-01' },
    })

    data = await getData()
    expect(data.experienceEntries[experienceEntryId]?.endDate).toBeNull()

    await backend.updateExperienceEntry({
      experienceEntryId,
      changes: { isCurrent: false, endDate: '2025-01-01' },
    })

    data = await getData()
    expect(data.experienceEntries[experienceEntryId]).toMatchObject({
      isCurrent: false,
      endDate: '2025-01-01',
    })
  })

  it('reorders experience bullets and preview data reflects the new order', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const experienceEntryId = expectCreatedId(await backend.createExperienceEntry(profileId), 'Expected an experience entry id')

    await backend.createExperienceBullet(experienceEntryId)
    await backend.createExperienceBullet(experienceEntryId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).experienceBullets)
          .filter((item) => item.experienceEntryId === experienceEntryId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second bullet id')

    await backend.updateExperienceBullet({
      experienceBulletId: firstBulletId,
      changes: { content: 'First bullet', enabled: true, level: 2 },
    })
    await backend.updateExperienceBullet({
      experienceBulletId: secondBulletId,
      changes: { content: 'Second bullet', enabled: true, level: 3 },
    })

    await backend.reorderExperienceBullets({
      experienceEntryId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    const preview = selectProfileDocumentData(await getData(), profileId)
    expect(preview?.experienceEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual(['Second bullet', 'First bullet'])
    expect(preview?.experienceEntries[0]?.bullets.map((bullet) => bullet.level)).toEqual([3, 2])
  })

  it('defaults bullet levels to level 1 and rejects unsupported bullet level updates', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const experienceEntryId = expectCreatedId(await backend.createExperienceEntry(profileId), 'Expected an experience entry id')
    const educationEntryId = expectCreatedId(await backend.createEducationEntry(profileId), 'Expected an education entry id')
    const projectId = expectCreatedId(await backend.createProject(profileId), 'Expected a project id')
    const additionalExperienceEntryId = expectCreatedId(await backend.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')

    await backend.createExperienceBullet(experienceEntryId)
    await backend.createEducationBullet(educationEntryId)
    await backend.createProjectBullet(projectId)
    await backend.createAdditionalExperienceBullet(additionalExperienceEntryId)

    let data = await getData()
    const experienceBulletId = expectDefined(Object.keys(data.experienceBullets)[0], 'Expected an experience bullet id')
    const educationBulletId = expectDefined(Object.keys(data.educationBullets)[0], 'Expected an education bullet id')
    const projectBulletId = expectDefined(Object.keys(data.projectBullets)[0], 'Expected a project bullet id')
    const additionalExperienceBulletId = expectDefined(
      Object.keys(data.additionalExperienceBullets)[0],
      'Expected an additional experience bullet id',
    )

    expect(data.experienceBullets[experienceBulletId]?.level).toBe(defaultBulletLevel)
    expect(data.educationBullets[educationBulletId]?.level).toBe(defaultBulletLevel)
    expect(data.projectBullets[projectBulletId]?.level).toBe(defaultBulletLevel)
    expect(data.additionalExperienceBullets[additionalExperienceBulletId]?.level).toBe(defaultBulletLevel)

    await backend.updateExperienceBullet({ experienceBulletId, changes: { level: 2 } })
    await backend.updateEducationBullet({ educationBulletId, changes: { level: 3 } })
    await backend.updateProjectBullet({ projectBulletId, changes: { level: 2 } })
    await backend.updateAdditionalExperienceBullet({ additionalExperienceBulletId, changes: { level: 3 } })

    data = await getData()
    expect(data.experienceBullets[experienceBulletId]?.level).toBe(2)
    expect(data.educationBullets[educationBulletId]?.level).toBe(3)
    expect(data.projectBullets[projectBulletId]?.level).toBe(2)
    expect(data.additionalExperienceBullets[additionalExperienceBulletId]?.level).toBe(3)

    await backend.updateExperienceBullet({ experienceBulletId, changes: { level: 99 as never } })
    await backend.updateEducationBullet({ educationBulletId, changes: { level: 0 as never } })
    await backend.updateProjectBullet({ projectBulletId, changes: { level: -1 as never } })
    await backend.updateAdditionalExperienceBullet({ additionalExperienceBulletId, changes: { level: 4 as never } })

    data = await getData()
    expect(data.experienceBullets[experienceBulletId]?.level).toBe(2)
    expect(data.educationBullets[educationBulletId]?.level).toBe(3)
    expect(data.projectBullets[projectBulletId]?.level).toBe(2)
    expect(data.additionalExperienceBullets[additionalExperienceBulletId]?.level).toBe(3)
  })

  it('reorders education bullets and preview data reflects the new order', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const educationEntryId = expectCreatedId(await backend.createEducationEntry(profileId), 'Expected an education entry id')

    await backend.createEducationBullet(educationEntryId)
    await backend.createEducationBullet(educationEntryId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).educationBullets)
          .filter((item) => item.educationEntryId === educationEntryId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second bullet id')

    await backend.updateEducationBullet({
      educationBulletId: firstBulletId,
      changes: { content: 'Dean list', enabled: true },
    })
    await backend.updateEducationBullet({
      educationBulletId: secondBulletId,
      changes: { content: 'Senior capstone', enabled: true },
    })

    await backend.reorderEducationBullets({
      educationEntryId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    const preview = selectProfileDocumentData(await getData(), profileId)
    expect(preview?.educationEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual([
      'Senior capstone',
      'Dean list',
    ])
  })

  it('reorders achievements for a profile and preview data reflects the new order', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const firstAchievementId = expectCreatedId(await backend.createAchievement(profileId), 'Expected first achievement id')
    const secondAchievementId = expectCreatedId(await backend.createAchievement(profileId), 'Expected second achievement id')

    await backend.updateAchievement({
      achievementId: firstAchievementId,
      changes: { name: 'First achievement', description: 'First description' },
    })
    await backend.updateAchievement({
      achievementId: secondAchievementId,
      changes: { name: 'Second achievement', description: 'Second description' },
    })

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.reorderAchievements({
      profileId,
      orderedIds: [secondAchievementId, firstAchievementId],
    })

    const data = await getData()
    expect(data.achievements[secondAchievementId]?.sortOrder).toBe(1)
    expect(data.achievements[firstAchievementId]?.sortOrder).toBe(2)
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    const preview = selectProfileDocumentData(data, profileId)
    expect(preview?.achievements.map((item) => item.name)).toEqual(['Second achievement', 'First achievement'])
  })

  it('toggles achievement enabled state and excludes disabled achievements from preview data', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const achievementId = expectCreatedId(await backend.createAchievement(profileId), 'Expected achievement id')

    await backend.updateAchievement({
      achievementId,
      changes: { name: 'Award', description: 'Received a company-wide award' },
    })

    expect(selectProfileDocumentData(await getData(), profileId)?.achievements).toHaveLength(1)

    await backend.updateAchievement({
      achievementId,
      changes: { enabled: false },
    })

    const data = await getData()
    expect(data.achievements[achievementId]?.enabled).toBe(false)
    expect(selectProfileDocumentData(data, profileId)?.achievements).toHaveLength(0)
  })

  it('normalizes education entry dates for status changes and rejects invalid ranges', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const educationEntryId = expectCreatedId(await backend.createEducationEntry(profileId), 'Expected an education entry id')

    await backend.updateEducationEntry({
      educationEntryId,
      changes: {
        school: 'Example University',
        degree: 'B.S. Computer Science',
        startDate: '2020-09',
        endDate: '2024-05',
        status: 'graduated',
      },
    })

    const updatedAtBeforeStatusChange = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.updateEducationEntry({
      educationEntryId,
      changes: {
        status: 'in_progress',
        endDate: '2025-05',
      },
    })

    let data = await getData()
    expect(data.educationEntries[educationEntryId]).toMatchObject({
      startDate: '2020-09',
      endDate: null,
      status: 'in_progress',
    })
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBeforeStatusChange)

    await backend.updateEducationEntry({
      educationEntryId,
      changes: { endDate: '2025-12' },
    })

    data = await getData()
    expect(data.educationEntries[educationEntryId]).toMatchObject({
      endDate: null,
      status: 'in_progress',
    })

    await backend.updateEducationEntry({
      educationEntryId,
      changes: {
        status: 'attended',
        endDate: '2023-12',
      },
    })

    const validEntry = expectDefined((await getData()).educationEntries[educationEntryId], 'Expected updated education entry')

    expect(validEntry).toMatchObject({
      startDate: '2020-09',
      endDate: '2023-12',
      status: 'attended',
    })

    const updatedAtBeforeInvalidRange = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.updateEducationEntry({
      educationEntryId,
      changes: { startDate: '2024-01' },
    })

    data = await getData()
    expect(data.educationEntries[educationEntryId]).toEqual(validEntry)
    expect(data.profiles[profileId]?.updatedAt).toBe(updatedAtBeforeInvalidRange)
  })

  it('reorders projects and project bullets and preview data reflects the new order', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const firstProjectId = expectCreatedId(await backend.createProject(profileId), 'Expected first project id')
    const secondProjectId = expectCreatedId(await backend.createProject(profileId), 'Expected second project id')

    await backend.updateProject({
      projectId: firstProjectId,
      changes: { name: 'Alpha', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-03-01' },
    })
    await backend.updateProject({
      projectId: secondProjectId,
      changes: { name: 'Beta', organization: '', startDate: '2024-04-01', endDate: '2024-05-01' },
    })

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.reorderProjects({
      profileId,
      orderedIds: [secondProjectId, firstProjectId],
    })

    let data = await getData()
    expect(data.projects[secondProjectId]?.sortOrder).toBe(1)
    expect(data.projects[firstProjectId]?.sortOrder).toBe(2)
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    await backend.createProjectBullet(secondProjectId)
    await backend.createProjectBullet(secondProjectId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).projectBullets)
          .filter((item) => item.projectId === secondProjectId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first project bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second project bullet id')

    await backend.updateProjectBullet({
      projectBulletId: firstBulletId,
      changes: { content: 'First project bullet', enabled: true },
    })
    await backend.updateProjectBullet({
      projectBulletId: secondBulletId,
      changes: { content: 'Second project bullet', enabled: true },
    })

    await backend.reorderProjectBullets({
      projectId: secondProjectId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    data = await getData()
    const preview = selectProfileDocumentData(data, profileId)
    expect(preview?.projectEntries.map((item) => item.entry.name)).toEqual(['Beta', 'Alpha'])
    expect(preview?.projectEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual([
      'Second project bullet',
      'First project bullet',
    ])
  })

  it('rejects invalid project date ranges and excludes disabled projects from preview data', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const projectId = expectCreatedId(await backend.createProject(profileId), 'Expected project id')

    await backend.updateProject({
      projectId,
      changes: { name: 'Portfolio rebuild', startDate: '2024-02-01', endDate: '2024-04-01', enabled: true },
    })

    const validProject = expectDefined((await getData()).projects[projectId], 'Expected valid project')
    const updatedAtBeforeInvalidRange = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.updateProject({
      projectId,
      changes: { startDate: '2024-05-01' },
    })

    let data = await getData()
    expect(data.projects[projectId]).toEqual(validProject)
    expect(data.profiles[profileId]?.updatedAt).toBe(updatedAtBeforeInvalidRange)
    expect(selectProfileDocumentData(data, profileId)?.projectEntries).toHaveLength(1)

    await backend.updateProject({
      projectId,
      changes: { enabled: false },
    })

    data = await getData()
    expect(selectProfileDocumentData(data, profileId)?.projectEntries).toHaveLength(0)
  })

  it('reorders additional experience entries and bullets and preview data reflects the new order', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const firstEntryId = expectCreatedId(await backend.createAdditionalExperienceEntry(profileId), 'Expected first additional experience id')
    const secondEntryId = expectCreatedId(await backend.createAdditionalExperienceEntry(profileId), 'Expected second additional experience id')

    await backend.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: firstEntryId,
      changes: { title: 'Sergeant', organization: 'Army Reserve' },
    })
    await backend.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: secondEntryId,
      changes: { title: 'Board Member', organization: 'Neighborhood Council' },
    })

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.reorderAdditionalExperienceEntries({
      profileId,
      orderedIds: [secondEntryId, firstEntryId],
    })

    let data = await getData()
    expect(data.additionalExperienceEntries[secondEntryId]?.sortOrder).toBe(1)
    expect(data.additionalExperienceEntries[firstEntryId]?.sortOrder).toBe(2)
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    await backend.createAdditionalExperienceBullet(secondEntryId)
    await backend.createAdditionalExperienceBullet(secondEntryId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).additionalExperienceBullets)
          .filter((item) => item.additionalExperienceEntryId === secondEntryId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first additional experience bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second additional experience bullet id')

    await backend.updateAdditionalExperienceBullet({
      additionalExperienceBulletId: firstBulletId,
      changes: { content: 'Led training exercises', enabled: true },
    })
    await backend.updateAdditionalExperienceBullet({
      additionalExperienceBulletId: secondBulletId,
      changes: { content: 'Coordinated emergency response drills', enabled: true },
    })

    await backend.reorderAdditionalExperienceBullets({
      additionalExperienceEntryId: secondEntryId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    data = await getData()
    const preview = selectProfileDocumentData(data, profileId)
    expect(preview?.additionalExperienceEntries.map((item) => item.entry.title)).toEqual(['Board Member', 'Sergeant'])
    expect(preview?.additionalExperienceEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual([
      'Coordinated emergency response drills',
      'Led training exercises',
    ])
  })

  it('rejects invalid additional experience date ranges and excludes disabled additional experience from preview data', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const entryId = expectCreatedId(await backend.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')

    await backend.updateAdditionalExperienceEntry({
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

    const validEntry = expectDefined((await getData()).additionalExperienceEntries[entryId], 'Expected valid additional experience entry')
    const updatedAtBeforeInvalidRange = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: entryId,
      changes: { startDate: '2023-01-01' },
    })

    let data = await getData()
    expect(data.additionalExperienceEntries[entryId]).toEqual(validEntry)
    expect(data.profiles[profileId]?.updatedAt).toBe(updatedAtBeforeInvalidRange)
    expect(selectProfileDocumentData(data, profileId)?.additionalExperienceEntries).toHaveLength(1)

    await backend.updateAdditionalExperienceEntry({
      additionalExperienceEntryId: entryId,
      changes: { enabled: false },
    })

    data = await getData()
    expect(selectProfileDocumentData(data, profileId)?.additionalExperienceEntries).toHaveLength(0)
  })

  it('reorders certifications and excludes disabled certifications from preview data', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const firstCertificationId = expectCreatedId(await backend.createCertification(profileId), 'Expected first certification id')
    const secondCertificationId = expectCreatedId(await backend.createCertification(profileId), 'Expected second certification id')

    await backend.updateCertification({
      certificationId: firstCertificationId,
      changes: { name: 'AWS Solutions Architect', issuer: 'Amazon', issueDate: '2024-03-01', enabled: true },
    })
    await backend.updateCertification({
      certificationId: secondCertificationId,
      changes: { name: 'Security+', issuer: 'CompTIA', issueDate: '2024-06-01', enabled: true },
    })

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.reorderCertifications({
      profileId,
      orderedIds: [secondCertificationId, firstCertificationId],
    })

    let data = await getData()
    expect(data.certifications[secondCertificationId]?.sortOrder).toBe(1)
    expect(data.certifications[firstCertificationId]?.sortOrder).toBe(2)
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)
    expect(selectProfileDocumentData(data, profileId)?.certifications.map((item) => item.name)).toEqual([
      'Security+',
      'AWS Solutions Architect',
    ])

    await backend.updateCertification({
      certificationId: secondCertificationId,
      changes: { enabled: false },
    })

    data = await getData()
    expect(selectProfileDocumentData(data, profileId)?.certifications.map((item) => item.name)).toEqual([
      'AWS Solutions Architect',
    ])
  })

  it('reorders references and excludes disabled references from preview data', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const firstReferenceId = expectCreatedId(await backend.createReference(profileId), 'Expected first reference id')
    const secondReferenceId = expectCreatedId(await backend.createReference(profileId), 'Expected second reference id')

    await backend.updateReference({
      referenceId: firstReferenceId,
      changes: { name: 'Pat Doe', company: 'Amazon', relationship: 'Manager', enabled: true },
    })
    await backend.updateReference({
      referenceId: secondReferenceId,
      changes: { name: 'Sam Lee', company: 'CompTIA', relationship: 'Mentor', enabled: true },
    })

    const updatedAtBefore = (await getData()).profiles[profileId]?.updatedAt
    await waitForNextTick()

    await backend.reorderReferences({
      profileId,
      orderedIds: [secondReferenceId, firstReferenceId],
    })

    let data = await getData()
    expect(data.references[secondReferenceId]?.sortOrder).toBe(1)
    expect(data.references[firstReferenceId]?.sortOrder).toBe(2)
    expect(data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)
    expect(selectProfileDocumentData(data, profileId)?.references.map((item) => item.name)).toEqual([
      'Sam Lee',
      'Pat Doe',
    ])

    await backend.updateReference({
      referenceId: secondReferenceId,
      changes: { enabled: false },
    })

    data = await getData()
    expect(selectProfileDocumentData(data, profileId)?.references.map((item) => item.name)).toEqual([
      'Pat Doe',
    ])
  })

  it('reorders job contacts for a job', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected a job id')

    await backend.createJobContact(jobId)
    await backend.createJobContact(jobId)

    const contactIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).jobContacts)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstContactId = expectDefined(contactIds[0], 'Expected first contact id')
    const secondContactId = expectDefined(contactIds[1], 'Expected second contact id')

    await backend.updateJobContact({
      jobContactId: firstContactId,
      changes: { name: 'Contact One' },
    })
    await backend.updateJobContact({
      jobContactId: secondContactId,
      changes: { name: 'Contact Two' },
    })

    await backend.reorderJobContacts({
      jobId,
      orderedIds: [secondContactId, firstContactId],
    })

    const reorderedContacts = Object.values((await getData()).jobContacts)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(reorderedContacts.map((item) => item.name)).toEqual(['Contact Two', 'Contact One'])
  })

  it('creates a job with an optional initial link', async () => {
    const jobId = expectCreatedId(await backend.createJob({
      companyName: 'Example Co',
      jobTitle: 'Engineer',
      initialLinkUrl: 'https://example.com/job',
    }), 'Expected job id')

    const data = await getData()
    expect(data.jobs[jobId]).toMatchObject({
      jobTitle: 'Engineer',
      appliedAt: null,
      finalOutcome: null,
    })

    const jobLinks = Object.values(data.jobLinks)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(jobLinks).toHaveLength(1)
    expect(jobLinks[0]?.url).toBe('https://example.com/job')
  })

  it('sets and clears job progress fields', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')
    const updatedAtBefore = (await getData()).jobs[jobId]?.updatedAt
    await waitForNextTick()

    await backend.setJobAppliedAt({ jobId, appliedAt: '2026-03-09T12:00:00.000Z' })
    await backend.setJobFinalOutcome({ jobId, status: 'offer_received', setAt: '2026-03-10T09:30:00.000Z' })

    let data = await getData()
    expect(data.jobs[jobId]).toMatchObject({
      appliedAt: '2026-03-09T12:00:00.000Z',
      finalOutcome: {
        status: 'offer_received',
        setAt: '2026-03-10T09:30:00.000Z',
      },
    })
    expect(data.jobs[jobId]?.updatedAt).not.toBe(updatedAtBefore)

    await backend.clearJobAppliedAt(jobId)

    data = await getData()
    expect(data.jobs[jobId]).toMatchObject({
      appliedAt: null,
      finalOutcome: null,
    })
  })

  it('does not allow a final outcome when the job is not applied', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')

    await backend.setJobFinalOutcome({ jobId, status: 'rejected', setAt: '2026-03-10T09:30:00.000Z' })

    let data = await getData()
    expect(data.jobs[jobId]).toMatchObject({
      appliedAt: null,
      finalOutcome: null,
    })

    await backend.setJobAppliedAt({ jobId, appliedAt: '2026-03-09T12:00:00.000Z' })
    await backend.setJobFinalOutcome({ jobId, status: 'rejected', setAt: '2026-03-10T09:30:00.000Z' })

    data = await getData()
    expect(data.jobs[jobId]).toMatchObject({
      appliedAt: '2026-03-09T12:00:00.000Z',
      finalOutcome: {
        status: 'rejected',
        setAt: '2026-03-10T09:30:00.000Z',
      },
    })
  })

  it('preserves import and export through the backend service', async () => {
    const imported: AppExportFile = {
      version: 1 as const,
      exportedAt: '2026-03-12T09:00:00.000Z',
      data: {
        ...createEmptyAppDataState(),
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

    await backend.importAppData(imported)

    const exported = await backend.exportAppData()

    expect((await getData()).jobs.job_1?.companyName).toBe('Example Co')
    expect(exported.data.jobs.job_1?.jobTitle).toBe('Engineer')
  })

  it('creates interviews, manages associated contacts, and preserves interview contact order through export/import', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')

    await backend.createJobContact(jobId)
    await backend.createJobContact(jobId)

    const contactIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).jobContacts)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstContactId = expectDefined(contactIds[0], 'Expected first contact id')
    const secondContactId = expectDefined(contactIds[1], 'Expected second contact id')

    await backend.updateJobContact({ jobContactId: firstContactId, changes: { name: 'Contact One' } })
    await backend.updateJobContact({ jobContactId: secondContactId, changes: { name: 'Contact Two' } })

    const interviewId = expectCreatedId(await backend.createInterview(jobId), 'Expected interview id')

    expect((await getData()).interviews[interviewId]).toMatchObject({
      createdAt: expect.any(String),
      startAt: null,
    })

    await backend.updateInterview({
      interviewId,
      changes: {
        startAt: '2026-03-12T15:00:00.000Z',
        notes: 'Team screen',
      },
    })

    await backend.addInterviewContact({ interviewId, jobContactId: firstContactId })
    await backend.addInterviewContact({ interviewId, jobContactId: secondContactId })

    const interviewContactIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).interviewContacts)
          .filter((item) => item.interviewId === interviewId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstInterviewContactId = expectDefined(interviewContactIds[0], 'Expected first interview contact id')
    const secondInterviewContactId = expectDefined(interviewContactIds[1], 'Expected second interview contact id')

    await backend.reorderInterviewContacts({
      interviewId,
      orderedIds: [secondInterviewContactId, firstInterviewContactId],
    })

    const exported = await backend.exportAppData()
    await backend.importAppData(exported)

    const importedInterviewContacts = Object.values((await getData()).interviewContacts)
      .filter((item) => item.interviewId === interviewId)
      .sort((left, right) => left.sortOrder - right.sortOrder)
    const importedData = await getData()

    expect(importedInterviewContacts.map((item) => importedData.jobContacts[item.jobContactId]?.name)).toEqual([
      'Contact Two',
      'Contact One',
    ])
  })

  it('allows an interview to remain unscheduled', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')
    const interviewId = expectCreatedId(await backend.createInterview(jobId), 'Expected interview id')

    await backend.updateInterview({
      interviewId,
      changes: {
        notes: 'Awaiting scheduling confirmation',
      },
    })

    expect((await getData()).interviews[interviewId]).toMatchObject({
      createdAt: expect.any(String),
      startAt: null,
      notes: 'Awaiting scheduling confirmation',
    })
  })

  it('cascades interview associations when deleting a contact, interview, or job', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected job id')
    await backend.createJobContact(jobId)
    const contactId = expectDefined(Object.keys((await getData()).jobContacts)[0], 'Expected contact id')
    const interviewId = expectCreatedId(await backend.createInterview(jobId), 'Expected interview id')

    await backend.addInterviewContact({ interviewId, jobContactId: contactId })
    const interviewContactId = expectDefined(Object.keys((await getData()).interviewContacts)[0], 'Expected interview contact id')

    await backend.deleteJobContact(contactId)
    expect((await getData()).interviewContacts[interviewContactId]).toBeUndefined()

    await backend.createJobContact(jobId)
    const replacementContactId = expectDefined(Object.keys((await getData()).jobContacts)[0], 'Expected replacement contact id')
    await backend.addInterviewContact({ interviewId, jobContactId: replacementContactId })
    const replacementAssociationId = expectDefined(Object.keys((await getData()).interviewContacts)[0], 'Expected replacement interview contact id')

    await backend.deleteInterview(interviewId)
    expect((await getData()).interviews[interviewId]).toBeUndefined()
    expect((await getData()).interviewContacts[replacementAssociationId]).toBeUndefined()

    const secondInterviewId = expectCreatedId(await backend.createInterview(jobId), 'Expected second interview id')
    await backend.addInterviewContact({ interviewId: secondInterviewId, jobContactId: replacementContactId })
    expect(Object.keys((await getData()).interviewContacts)).toHaveLength(1)

    await backend.deleteJob(jobId)
    expect((await getData()).jobs[jobId]).toBeUndefined()
    expect(Object.keys((await getData()).interviews)).toHaveLength(0)
    expect(Object.keys((await getData()).interviewContacts)).toHaveLength(0)
  })

  it('preserves job link order through export and import', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected a job id')

    await backend.createJobLink(jobId)
    await backend.createJobLink(jobId)

    const jobLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).jobLinks)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstJobLinkId = expectDefined(jobLinkIds[0], 'Expected first job link id')
    const secondJobLinkId = expectDefined(jobLinkIds[1], 'Expected second job link id')

    await backend.updateJobLink({
      jobLinkId: firstJobLinkId,
      changes: { url: 'https://example.com/job' },
    })
    await backend.updateJobLink({
      jobLinkId: secondJobLinkId,
      changes: { url: 'https://linkedin.com/jobs/view/example' },
    })

    await backend.reorderJobLinks({
      jobId,
      orderedIds: [secondJobLinkId, firstJobLinkId],
    })

    const exported = await backend.exportAppData()
    await backend.importAppData(exported)

    const importedJobLinks = Object.values((await getData()).jobLinks)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedJobLinks.map((item) => item.url)).toEqual([
      'https://linkedin.com/jobs/view/example',
      'https://example.com/job',
    ])
  })

  it('preserves application question order through export and import', async () => {
    const jobId = expectCreatedId(await backend.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' }), 'Expected a job id')

    await backend.createApplicationQuestion(jobId)
    await backend.createApplicationQuestion(jobId)

    const questionIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).applicationQuestions)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstQuestionId = expectDefined(questionIds[0], 'Expected first application question id')
    const secondQuestionId = expectDefined(questionIds[1], 'Expected second application question id')

    await backend.updateApplicationQuestion({
      applicationQuestionId: firstQuestionId,
      changes: { question: 'Question One', answer: 'Answer One' },
    })
    await backend.updateApplicationQuestion({
      applicationQuestionId: secondQuestionId,
      changes: { question: 'Question Two', answer: 'Answer Two' },
    })

    await backend.reorderApplicationQuestions({
      jobId,
      orderedIds: [secondQuestionId, firstQuestionId],
    })

    const exported = await backend.exportAppData()
    await backend.importAppData(exported)

    const importedQuestions = Object.values((await getData()).applicationQuestions)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedQuestions.map((item) => item.question)).toEqual(['Question Two', 'Question One'])
  })

  it('preserves resume settings through profile duplication and export/import', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    await backend.setDocumentHeaderTemplate({ profileId, headerTemplate: 'stacked' })
    await backend.setResumeSectionLabel({ profileId, section: 'summary', label: 'Career Summary' })
    await backend.setResumeSectionEnabled({ profileId, section: 'references', enabled: false })
    await backend.reorderResumeSections({
      profileId,
      orderedSections: ['experience', 'summary', 'skills', 'achievements', 'education', 'projects', 'additional_experience', 'certifications', 'references'],
    })

    const achievementId = expectCreatedId(await backend.createAchievement(profileId), 'Expected achievement id')
    await backend.updateAchievement({ achievementId, changes: { name: 'Promotion', description: 'Promoted after leading a critical delivery' } })
    const projectId = expectCreatedId(await backend.createProject(profileId), 'Expected project id')
    await backend.updateProject({
      projectId,
      changes: { name: 'Migration tool', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-02-01' },
    })
    await backend.createProjectBullet(projectId)
    const projectBulletId = expectDefined(Object.keys((await getData()).projectBullets)[0], 'Expected project bullet id')
    await backend.updateProjectBullet({ projectBulletId, changes: { content: 'Automated bulk migration workflow', enabled: true, level: 2 } })
    const additionalExperienceEntryId = expectCreatedId(await backend.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')
    await backend.updateAdditionalExperienceEntry({
      additionalExperienceEntryId,
      changes: { title: 'Sergeant', organization: 'Army Reserve', location: 'Los Angeles, CA', startDate: '2020-01-01', endDate: '2022-01-01' },
    })
    await backend.createAdditionalExperienceBullet(additionalExperienceEntryId)
    const additionalExperienceBulletId = expectDefined(Object.keys((await getData()).additionalExperienceBullets)[0], 'Expected additional experience bullet id')
    await backend.updateAdditionalExperienceBullet({ additionalExperienceBulletId, changes: { content: 'Led CBRN readiness training', enabled: true, level: 3 } })
    const certificationId = expectCreatedId(await backend.createCertification(profileId), 'Expected certification id')
    await backend.updateCertification({
      certificationId,
      changes: {
        name: 'Security+',
        issuer: 'CompTIA',
        issueDate: '2024-06-01',
        expiryDate: '2027-06-01',
        credentialId: 'ABC-123',
        credentialUrl: 'https://example.com/cert/security-plus',
      },
    })
    const referenceId = expectCreatedId(await backend.createReference(profileId), 'Expected reference id')
    await backend.updateReference({
      referenceId,
      changes: {
        type: 'professional',
        name: 'Pat Doe',
        relationship: 'Manager',
        company: 'Amazon',
        title: 'Senior Manager',
        email: 'pat@example.com',
        phone: '555-0100',
        notes: 'Former direct manager',
      },
    })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')

    let data = await getData()
    expect(getOrderedResumeSections(data.profiles[duplicatedProfileId]!).map((section) => section.section)).toEqual([
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
    expect(data.profiles[duplicatedProfileId]?.resumeSettings.headerTemplate).toBe('stacked')
    expect(data.profiles[duplicatedProfileId]?.resumeSettings.sections.summary.label).toBe('Career Summary')
    expect(data.profiles[duplicatedProfileId]?.resumeSettings.sections.references.enabled).toBe(false)
    const duplicatedAchievement = Object.values(data.achievements).find((item) => item.profileId === duplicatedProfileId)
    expect(duplicatedAchievement).toMatchObject({ name: 'Promotion', description: 'Promoted after leading a critical delivery', enabled: true, sortOrder: 1 })
    const duplicatedProject = Object.values(data.projects).find((item) => item.profileId === duplicatedProfileId)
    expect(duplicatedProject).toMatchObject({ name: 'Migration tool', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-02-01', enabled: true, sortOrder: 1 })
    const duplicatedProjectBullet = Object.values(data.projectBullets).find((item) => item.projectId === duplicatedProject?.id)
    expect(duplicatedProjectBullet).toMatchObject({ content: 'Automated bulk migration workflow', level: 2, enabled: true, sortOrder: 1 })
    const duplicatedAdditionalExperience = Object.values(data.additionalExperienceEntries).find((item) => item.profileId === duplicatedProfileId)
    expect(duplicatedAdditionalExperience).toMatchObject({ title: 'Sergeant', organization: 'Army Reserve', location: 'Los Angeles, CA', startDate: '2020-01-01', endDate: '2022-01-01', enabled: true, sortOrder: 1 })
    const duplicatedAdditionalExperienceBullet = Object.values(data.additionalExperienceBullets).find((item) => item.additionalExperienceEntryId === duplicatedAdditionalExperience?.id)
    expect(duplicatedAdditionalExperienceBullet).toMatchObject({ content: 'Led CBRN readiness training', level: 3, enabled: true, sortOrder: 1 })
    const duplicatedCertification = Object.values(data.certifications).find((item) => item.profileId === duplicatedProfileId)
    expect(duplicatedCertification).toMatchObject({ name: 'Security+', issuer: 'CompTIA', issueDate: '2024-06-01', expiryDate: '2027-06-01', credentialId: 'ABC-123', credentialUrl: 'https://example.com/cert/security-plus', enabled: true, sortOrder: 1 })
    const duplicatedReference = Object.values(data.references).find((item) => item.profileId === duplicatedProfileId)
    expect(duplicatedReference).toMatchObject({ type: 'professional', name: 'Pat Doe', relationship: 'Manager', company: 'Amazon', title: 'Senior Manager', email: 'pat@example.com', phone: '555-0100', notes: 'Former direct manager', enabled: true, sortOrder: 1 })

    const exported = await backend.exportAppData()
    await backend.importAppData(exported)

    data = await getData()
    const importedProfile = data.profiles[duplicatedProfileId]
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
    expect(data.achievements[duplicatedAchievement!.id]).toMatchObject({ name: 'Promotion', description: 'Promoted after leading a critical delivery' })
    expect(data.projects[duplicatedProject!.id]).toMatchObject({ name: 'Migration tool', organization: 'Acme' })
    expect(data.projectBullets[duplicatedProjectBullet!.id]).toMatchObject({ content: 'Automated bulk migration workflow', level: 2 })
    expect(data.additionalExperienceEntries[duplicatedAdditionalExperience!.id]).toMatchObject({ title: 'Sergeant', organization: 'Army Reserve' })
    expect(data.additionalExperienceBullets[duplicatedAdditionalExperienceBullet!.id]).toMatchObject({ content: 'Led CBRN readiness training', level: 3 })
    expect(data.certifications[duplicatedCertification!.id]).toMatchObject({ name: 'Security+', issuer: 'CompTIA', credentialId: 'ABC-123' })
    expect(data.references[duplicatedReference!.id]).toMatchObject({ name: 'Pat Doe', relationship: 'Manager', email: 'pat@example.com' })
  })

  it('duplicates and cascades deletes projects and project bullets with their parent profile', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const originalProjectId = expectCreatedId(await backend.createProject(profileId), 'Expected project id')
    await backend.updateProject({ projectId: originalProjectId, changes: { name: 'Internal dashboard', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-03-01' } })
    await backend.createProjectBullet(originalProjectId)
    const originalProjectBulletId = expectDefined(Object.keys((await getData()).projectBullets)[0], 'Expected project bullet id')
    await backend.updateProjectBullet({ projectBulletId: originalProjectBulletId, changes: { content: 'Built analytics reporting view', enabled: true } })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedProject = expectDefined(Object.values((await getData()).projects).find((item) => item.profileId === duplicatedProfileId), 'Expected duplicated project')

    expect(duplicatedProject).toMatchObject({ name: 'Internal dashboard', organization: 'Acme', startDate: '2024-01-01', endDate: '2024-03-01', enabled: true, sortOrder: 1 })
    expect(duplicatedProject.id).not.toBe(originalProjectId)

    const duplicatedProjectBullet = expectDefined(Object.values((await getData()).projectBullets).find((item) => item.projectId === duplicatedProject.id), 'Expected duplicated project bullet')
    expect(duplicatedProjectBullet).toMatchObject({ content: 'Built analytics reporting view', enabled: true, sortOrder: 1 })
    expect(duplicatedProjectBullet.id).not.toBe(originalProjectBulletId)

    await backend.deleteProject(originalProjectId)
    expect(Object.values((await getData()).projectBullets).filter((item) => item.projectId === originalProjectId)).toHaveLength(0)
    expect(Object.values((await getData()).projectBullets).filter((item) => item.projectId === duplicatedProject.id)).toHaveLength(1)

    await backend.deleteProfile(duplicatedProfileId)
    expect(Object.values((await getData()).projects).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(0)
    expect(Object.values((await getData()).projectBullets).filter((item) => item.projectId === duplicatedProject.id)).toHaveLength(0)
  })

  it('duplicates and cascades deletes additional experience entries and bullets with their parent profile', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    const originalEntryId = expectCreatedId(await backend.createAdditionalExperienceEntry(profileId), 'Expected additional experience id')
    await backend.updateAdditionalExperienceEntry({ additionalExperienceEntryId: originalEntryId, changes: { title: 'Sergeant', organization: 'Army Reserve', location: 'Los Angeles, CA', startDate: '2020-01-01', endDate: '2022-01-01' } })
    await backend.createAdditionalExperienceBullet(originalEntryId)
    const originalBulletId = expectDefined(Object.keys((await getData()).additionalExperienceBullets)[0], 'Expected additional experience bullet id')
    await backend.updateAdditionalExperienceBullet({ additionalExperienceBulletId: originalBulletId, changes: { content: 'Led CBRN readiness training', enabled: true } })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedEntry = expectDefined(Object.values((await getData()).additionalExperienceEntries).find((item) => item.profileId === duplicatedProfileId), 'Expected duplicated additional experience entry')
    expect(duplicatedEntry).toMatchObject({ title: 'Sergeant', organization: 'Army Reserve', location: 'Los Angeles, CA', startDate: '2020-01-01', endDate: '2022-01-01', enabled: true, sortOrder: 1 })
    expect(duplicatedEntry.id).not.toBe(originalEntryId)

    const duplicatedBullet = expectDefined(Object.values((await getData()).additionalExperienceBullets).find((item) => item.additionalExperienceEntryId === duplicatedEntry.id), 'Expected duplicated additional experience bullet')
    expect(duplicatedBullet).toMatchObject({ content: 'Led CBRN readiness training', enabled: true, sortOrder: 1 })
    expect(duplicatedBullet.id).not.toBe(originalBulletId)

    await backend.deleteAdditionalExperienceEntry(originalEntryId)
    expect(Object.values((await getData()).additionalExperienceBullets).filter((item) => item.additionalExperienceEntryId === originalEntryId)).toHaveLength(0)
    expect(Object.values((await getData()).additionalExperienceBullets).filter((item) => item.additionalExperienceEntryId === duplicatedEntry.id)).toHaveLength(1)

    await backend.deleteProfile(duplicatedProfileId)
    expect(Object.values((await getData()).additionalExperienceEntries).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(0)
    expect(Object.values((await getData()).additionalExperienceBullets).filter((item) => item.additionalExperienceEntryId === duplicatedEntry.id)).toHaveLength(0)
  })

  it('duplicates and cascades deletes certifications with their parent profile', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const originalCertificationId = expectCreatedId(await backend.createCertification(profileId), 'Expected certification id')
    await backend.updateCertification({ certificationId: originalCertificationId, changes: { name: 'Security+', issuer: 'CompTIA', issueDate: '2024-06-01', expiryDate: '2027-06-01', credentialId: 'ABC-123', credentialUrl: 'https://example.com/cert/security-plus' } })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedCertification = expectDefined(Object.values((await getData()).certifications).find((item) => item.profileId === duplicatedProfileId), 'Expected duplicated certification')
    expect(duplicatedCertification).toMatchObject({ name: 'Security+', issuer: 'CompTIA', issueDate: '2024-06-01', expiryDate: '2027-06-01', credentialId: 'ABC-123', credentialUrl: 'https://example.com/cert/security-plus', enabled: true, sortOrder: 1 })
    expect(duplicatedCertification.id).not.toBe(originalCertificationId)

    await backend.deleteCertification(originalCertificationId)
    expect((await getData()).certifications[originalCertificationId]).toBeUndefined()
    expect((await getData()).certifications[duplicatedCertification.id]).toBeDefined()

    await backend.deleteProfile(duplicatedProfileId)
    expect(Object.values((await getData()).certifications).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(0)
  })

  it('duplicates and cascades deletes references with their parent profile', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const originalReferenceId = expectCreatedId(await backend.createReference(profileId), 'Expected reference id')
    await backend.updateReference({ referenceId: originalReferenceId, changes: { type: 'professional', name: 'Pat Doe', relationship: 'Manager', company: 'Amazon', title: 'Senior Manager', email: 'pat@example.com', phone: '555-0100', notes: 'Former direct manager' } })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedReference = expectDefined(Object.values((await getData()).references).find((item) => item.profileId === duplicatedProfileId), 'Expected duplicated reference')
    expect(duplicatedReference).toMatchObject({ type: 'professional', name: 'Pat Doe', relationship: 'Manager', company: 'Amazon', title: 'Senior Manager', email: 'pat@example.com', phone: '555-0100', notes: 'Former direct manager', enabled: true, sortOrder: 1 })
    expect(duplicatedReference.id).not.toBe(originalReferenceId)

    await backend.deleteReference(originalReferenceId)
    expect((await getData()).references[originalReferenceId]).toBeUndefined()
    expect((await getData()).references[duplicatedReference.id]).toBeDefined()

    await backend.deleteProfile(duplicatedProfileId)
    expect(Object.values((await getData()).references).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(0)
  })

  it('duplicates and cascades deletes achievements with their parent profile', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const originalAchievementId = expectCreatedId(await backend.createAchievement(profileId), 'Expected achievement id')
    await backend.updateAchievement({ achievementId: originalAchievementId, changes: { name: 'Team award', description: 'Recognized for a cross-team platform initiative' } })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedAchievements = Object.values((await getData()).achievements)
      .filter((item) => item.profileId === duplicatedProfileId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(duplicatedAchievements).toHaveLength(1)
    expect(duplicatedAchievements[0]).toMatchObject({ name: 'Team award', description: 'Recognized for a cross-team platform initiative', enabled: true, sortOrder: 1 })
    expect(duplicatedAchievements[0]?.id).not.toBe(originalAchievementId)

    await backend.deleteProfile(profileId)
    expect(Object.values((await getData()).achievements).filter((item) => item.profileId === profileId)).toHaveLength(0)
    expect(Object.values((await getData()).achievements).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)

    await backend.deleteProfile(duplicatedProfileId)
    expect(Object.keys((await getData()).achievements)).toHaveLength(0)
  })

  it('preserves achievement data through export and import', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const achievementId = expectCreatedId(await backend.createAchievement(profileId), 'Expected achievement id')

    await backend.updateAchievement({ achievementId, changes: { name: 'Conference speaker', description: 'Presented a talk on service reliability', enabled: false } })

    const exported = await backend.exportAppData()
    await backend.importAppData(exported)

    expect((await getData()).achievements[achievementId]).toMatchObject({
      profileId,
      name: 'Conference speaker',
      description: 'Presented a talk on service reliability',
      enabled: false,
      sortOrder: 1,
    })
  })

  it('duplicates and cascades deletes profile links with their parent profile', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    await backend.createProfileLink(profileId)
    const originalLinkId = expectDefined(Object.keys((await getData()).profileLinks)[0], 'Expected a profile link id')

    await backend.updateProfileLink({ profileLinkId: originalLinkId, changes: { name: 'Portfolio', url: 'https://example.com/portfolio' } })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedLinks = Object.values((await getData()).profileLinks)
      .filter((item) => item.profileId === duplicatedProfileId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(duplicatedLinks).toHaveLength(1)
    expect(duplicatedLinks[0]).toMatchObject({ name: 'Portfolio', url: 'https://example.com/portfolio', enabled: true, sortOrder: 1 })
    expect(duplicatedLinks[0]?.id).not.toBe(originalLinkId)

    await backend.deleteProfile(profileId)
    expect(Object.values((await getData()).profileLinks).filter((item) => item.profileId === profileId)).toHaveLength(0)
    expect(Object.values((await getData()).profileLinks).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)

    await backend.deleteProfile(duplicatedProfileId)
    expect(Object.keys((await getData()).profileLinks)).toHaveLength(0)
  })

  it('duplicates and cascades deletes education bullets with their parent profile and education entry', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const educationEntryId = expectCreatedId(await backend.createEducationEntry(profileId), 'Expected an education entry id')

    await backend.updateEducationEntry({
      educationEntryId,
      changes: {
        school: 'Example University',
        degree: 'B.S. Computer Science',
        startDate: '2020-09',
        endDate: '2024-05',
        status: 'graduated',
      },
    })

    await backend.createEducationBullet(educationEntryId)
    const originalBulletId = expectDefined(Object.keys((await getData()).educationBullets)[0], 'Expected an education bullet id')

    await backend.updateEducationBullet({ educationBulletId: originalBulletId, changes: { content: 'Graduated magna cum laude', enabled: true } })

    const duplicatedProfileId = expectCreatedId(await backend.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')
    const duplicatedEducationEntry = expectDefined(Object.values((await getData()).educationEntries).find((item) => item.profileId === duplicatedProfileId), 'Expected duplicated education entry')

    expect(duplicatedEducationEntry).toMatchObject({ school: 'Example University', degree: 'B.S. Computer Science', startDate: '2020-09', endDate: '2024-05', status: 'graduated' })

    const duplicatedBullets = Object.values((await getData()).educationBullets)
      .filter((item) => item.educationEntryId === duplicatedEducationEntry.id)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(duplicatedBullets).toHaveLength(1)
    expect(duplicatedBullets[0]).toMatchObject({ content: 'Graduated magna cum laude', enabled: true, sortOrder: 1 })
    expect(duplicatedBullets[0]?.id).not.toBe(originalBulletId)

    await backend.deleteEducationEntry(educationEntryId)
    expect(Object.values((await getData()).educationBullets).filter((item) => item.educationEntryId === educationEntryId)).toHaveLength(0)
    expect(Object.values((await getData()).educationBullets).filter((item) => item.educationEntryId === duplicatedEducationEntry.id)).toHaveLength(1)

    await backend.deleteProfile(duplicatedProfileId)
    expect(Object.values((await getData()).educationBullets).filter((item) => item.educationEntryId === duplicatedEducationEntry.id)).toHaveLength(0)
  })

  it('preserves education bullet data through export and import', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')
    const educationEntryId = expectCreatedId(await backend.createEducationEntry(profileId), 'Expected an education entry id')

    await backend.updateEducationEntry({
      educationEntryId,
      changes: {
        school: 'Example University',
        degree: 'M.S. Data Science',
        startDate: '2021-09',
        endDate: null,
        status: 'in_progress',
      },
    })

    await backend.createEducationBullet(educationEntryId)
    const educationBulletId = expectDefined(Object.keys((await getData()).educationBullets)[0], 'Expected an education bullet id')

    await backend.updateEducationBullet({ educationBulletId, changes: { content: 'Honors program', enabled: false, level: 2 } })

    const exported = await backend.exportAppData()
    await backend.importAppData(exported)

    const data = await getData()
    expect(data.educationEntries[educationEntryId]).toMatchObject({ school: 'Example University', degree: 'M.S. Data Science', startDate: '2021-09', endDate: null, status: 'in_progress' })
    expect(data.educationBullets[educationBulletId]).toMatchObject({ educationEntryId, content: 'Honors program', level: 2, enabled: false, sortOrder: 1 })
  })

  it('preserves profile link order through export and import', async () => {
    const profileId = expectCreatedId(await backend.createBaseProfile('General Profile'), 'Expected a profile id')

    await backend.createProfileLink(profileId)
    await backend.createProfileLink(profileId)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values((await getData()).profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')

    await backend.updateProfileLink({ profileLinkId: firstProfileLinkId, changes: { name: 'GitHub', url: 'https://github.com/example', enabled: false } })
    await backend.updateProfileLink({ profileLinkId: secondProfileLinkId, changes: { name: 'Website', url: 'https://example.com' } })

    await backend.reorderProfileLinks({ profileId, orderedIds: [secondProfileLinkId, firstProfileLinkId] })

    const exported = await backend.exportAppData()
    await backend.importAppData(exported)

    const importedLinks = Object.values((await getData()).profileLinks)
      .filter((item) => item.profileId === profileId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedLinks.map((item) => item.name)).toEqual(['Website', 'GitHub'])
    expect(importedLinks.map((item) => item.url)).toEqual(['https://example.com', 'https://github.com/example'])
    expect(importedLinks.map((item) => item.enabled)).toEqual([true, false])
  })
})
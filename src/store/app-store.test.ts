import { beforeEach, describe, expect, it } from 'vitest'

import { getOrderedResumeSections, selectProfilePreviewData } from '../features/documents/preview-data'
import { createDefaultUiState, createEmptyDataState } from './create-initial-state'
import { useAppStore } from './app-store'

const resetStore = () => {
  useAppStore.setState((state) => ({
    ...state,
    data: createEmptyDataState(),
    ui: createDefaultUiState(),
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

describe('app store reorder actions', () => {
  beforeEach(() => {
    resetStore()
  })

  it('reorders skill categories for a profile', async () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createSkillCategory(profileId)
    actions.createSkillCategory(profileId)

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

    actions.reorderSkillCategories({
      profileId,
      orderedIds: [secondSkillCategoryId, firstSkillCategoryId],
    })

    const categories = useAppStore.getState().data.skillCategories
    expect(categories[secondSkillCategoryId]?.sortOrder).toBe(1)
    expect(categories[firstSkillCategoryId]?.sortOrder).toBe(2)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)
  })

  it('initializes, updates, and reorders per-profile resume settings', () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    const initialProfile = useAppStore.getState().data.profiles[profileId]
    expect(initialProfile?.resumeSettings.sections.summary.enabled).toBe(true)
    expect(initialProfile?.resumeSettings.sections.summary.sortOrder).toBe(1)
    expect(initialProfile?.resumeSettings.sections.references.sortOrder).toBe(6)

    actions.setResumeSectionEnabled({
      profileId,
      section: 'references',
      enabled: false,
    })

    actions.reorderResumeSections({
      profileId,
      orderedSections: ['skills', 'experience', 'summary', 'education', 'certifications', 'references'],
    })

    const nextProfile = useAppStore.getState().data.profiles[profileId]
    expect(nextProfile?.resumeSettings.sections.references.enabled).toBe(false)
    expect(getOrderedResumeSections(nextProfile!).map((section) => section.section)).toEqual([
      'skills',
      'experience',
      'summary',
      'education',
      'certifications',
      'references',
    ])
  })

  it('reorders experience bullets and preview data reflects the new order', () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createExperienceEntry(profileId)
    const experienceEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.experienceEntries)[0],
      'Expected an experience entry id',
    )

    actions.createExperienceBullet(experienceEntryId)
    actions.createExperienceBullet(experienceEntryId)

    const bulletIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.experienceBullets)
          .filter((item) => item.experienceEntryId === experienceEntryId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstBulletId = expectDefined(bulletIds[0], 'Expected first bullet id')
    const secondBulletId = expectDefined(bulletIds[1], 'Expected second bullet id')

    actions.updateExperienceBullet({
      experienceBulletId: firstBulletId,
      changes: { content: 'First bullet', enabled: true },
    })
    actions.updateExperienceBullet({
      experienceBulletId: secondBulletId,
      changes: { content: 'Second bullet', enabled: true },
    })

    actions.reorderExperienceBullets({
      experienceEntryId,
      orderedIds: [secondBulletId, firstBulletId],
    })

    const preview = selectProfilePreviewData(useAppStore.getState().data, profileId)
    expect(preview?.experienceEntries[0]?.bullets.map((bullet) => bullet.content)).toEqual(['Second bullet', 'First bullet'])
  })

  it('reorders job contacts for a job', () => {
    const { actions } = useAppStore.getState()

    actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const jobId = expectDefined(Object.keys(useAppStore.getState().data.jobs)[0], 'Expected a job id')

    actions.createJobContact(jobId)
    actions.createJobContact(jobId)

    const contactIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.jobContacts)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstContactId = expectDefined(contactIds[0], 'Expected first contact id')
    const secondContactId = expectDefined(contactIds[1], 'Expected second contact id')

    actions.updateJobContact({
      jobContactId: firstContactId,
      changes: { name: 'Contact One' },
    })
    actions.updateJobContact({
      jobContactId: secondContactId,
      changes: { name: 'Contact Two' },
    })

    actions.reorderJobContacts({
      jobId,
      orderedIds: [secondContactId, firstContactId],
    })

    const reorderedContacts = Object.values(useAppStore.getState().data.jobContacts)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(reorderedContacts.map((item) => item.name)).toEqual(['Contact Two', 'Contact One'])
  })

  it('preserves job link order through export and import', () => {
    const { actions } = useAppStore.getState()

    actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const jobId = expectDefined(Object.keys(useAppStore.getState().data.jobs)[0], 'Expected a job id')

    actions.createJobLink(jobId)
    actions.createJobLink(jobId)

    const jobLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.jobLinks)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstJobLinkId = expectDefined(jobLinkIds[0], 'Expected first job link id')
    const secondJobLinkId = expectDefined(jobLinkIds[1], 'Expected second job link id')

    actions.updateJobLink({
      jobLinkId: firstJobLinkId,
      changes: { url: 'https://example.com/job' },
    })
    actions.updateJobLink({
      jobLinkId: secondJobLinkId,
      changes: { url: 'https://linkedin.com/jobs/view/example' },
    })

    actions.reorderJobLinks({
      jobId,
      orderedIds: [secondJobLinkId, firstJobLinkId],
    })

    const exported = actions.exportAppData()

    resetStore()
    useAppStore.getState().actions.importAppData(exported)

    const importedJobLinks = Object.values(useAppStore.getState().data.jobLinks)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedJobLinks.map((item) => item.url)).toEqual([
      'https://linkedin.com/jobs/view/example',
      'https://example.com/job',
    ])
  })

  it('preserves application question order through export and import', () => {
    const { actions } = useAppStore.getState()

    actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const jobId = expectDefined(Object.keys(useAppStore.getState().data.jobs)[0], 'Expected a job id')

    actions.createApplicationQuestion(jobId)
    actions.createApplicationQuestion(jobId)

    const questionIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.applicationQuestions)
          .filter((item) => item.jobId === jobId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstQuestionId = expectDefined(questionIds[0], 'Expected first application question id')
    const secondQuestionId = expectDefined(questionIds[1], 'Expected second application question id')

    actions.updateApplicationQuestion({
      applicationQuestionId: firstQuestionId,
      changes: { question: 'Question One', answer: 'Answer One' },
    })
    actions.updateApplicationQuestion({
      applicationQuestionId: secondQuestionId,
      changes: { question: 'Question Two', answer: 'Answer Two' },
    })

    actions.reorderApplicationQuestions({
      jobId,
      orderedIds: [secondQuestionId, firstQuestionId],
    })

    const exported = actions.exportAppData()

    resetStore()
    useAppStore.getState().actions.importAppData(exported)

    const importedQuestions = Object.values(useAppStore.getState().data.applicationQuestions)
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedQuestions.map((item) => item.question)).toEqual(['Question Two', 'Question One'])
  })

  it('preserves resume settings through profile duplication and export/import', () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.setResumeSectionEnabled({ profileId, section: 'references', enabled: false })
    actions.reorderResumeSections({
      profileId,
      orderedSections: ['experience', 'summary', 'skills', 'education', 'certifications', 'references'],
    })

    const duplicatedProfileId = expectDefined(
      actions.duplicateProfile({ sourceProfileId: profileId }),
      'Expected duplicate profile id',
    )

    expect(getOrderedResumeSections(useAppStore.getState().data.profiles[duplicatedProfileId]!).map((section) => section.section)).toEqual([
      'experience',
      'summary',
      'skills',
      'education',
      'certifications',
      'references',
    ])
    expect(useAppStore.getState().data.profiles[duplicatedProfileId]?.resumeSettings.sections.references.enabled).toBe(false)

    const exported = actions.exportAppData()

    resetStore()
    useAppStore.getState().actions.importAppData(exported)

    const importedProfile = useAppStore.getState().data.profiles[duplicatedProfileId]
    expect(importedProfile?.resumeSettings.sections.references.enabled).toBe(false)
    expect(getOrderedResumeSections(importedProfile!).map((section) => section.section)).toEqual([
      'experience',
      'summary',
      'skills',
      'education',
      'certifications',
      'references',
    ])
  })
})

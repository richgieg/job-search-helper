import { beforeEach, describe, expect, it } from 'vitest'

import { getOrderedResumeSections, selectProfileDocumentData } from '../features/documents/document-data'
import { getJobComputedStatus } from '../features/jobs/job-status'
import { createDefaultUiState, createEmptyDataState } from './create-initial-state'
import { useAppStore } from './app-store'

const resetStore = () => {
  useAppStore.setState((state) => ({
    ...state,
    data: createEmptyDataState(),
    ui: createDefaultUiState('system'),
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

  it('reorders enabled profile links for a profile and preview data reflects the new order', async () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createProfileLink(profileId)
    actions.createProfileLink(profileId)

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

    actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })
    actions.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    })

    actions.reorderProfileLinks({
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

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createProfileLink(profileId)
    actions.createProfileLink(profileId)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')

    actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })
    actions.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    })

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { enabled: false },
    })

    expect(useAppStore.getState().data.profileLinks[firstProfileLinkId]?.enabled).toBe(false)
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
    expect(preview?.profileLinks.map((link) => link.name)).toEqual(['LinkedIn'])
    expect(preview?.profileLinks.map((link) => link.url)).toEqual(['https://linkedin.com/in/example'])
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

  it('clears and protects endDate when an experience entry is marked current', async () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createExperienceEntry(profileId)
    const experienceEntryId = expectDefined(
      Object.keys(useAppStore.getState().data.experienceEntries)[0],
      'Expected an experience entry id',
    )

    actions.updateExperienceEntry({
      experienceEntryId,
      changes: { endDate: '2024-06-01', isCurrent: false },
    })

    const updatedAtBefore = useAppStore.getState().data.profiles[profileId]?.updatedAt
    await waitForNextTick()

    actions.updateExperienceEntry({
      experienceEntryId,
      changes: { isCurrent: true },
    })

    expect(useAppStore.getState().data.experienceEntries[experienceEntryId]).toMatchObject({
      isCurrent: true,
      endDate: null,
    })
    expect(useAppStore.getState().data.profiles[profileId]?.updatedAt).not.toBe(updatedAtBefore)

    actions.updateExperienceEntry({
      experienceEntryId,
      changes: { endDate: '2025-01-01' },
    })

    expect(useAppStore.getState().data.experienceEntries[experienceEntryId]?.endDate).toBeNull()

    actions.updateExperienceEntry({
      experienceEntryId,
      changes: { isCurrent: false, endDate: '2025-01-01' },
    })

    expect(useAppStore.getState().data.experienceEntries[experienceEntryId]).toMatchObject({
      isCurrent: false,
      endDate: '2025-01-01',
    })
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

    const preview = selectProfileDocumentData(useAppStore.getState().data, profileId)
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

  it('creates a job with an optional initial link', () => {
    const { actions } = useAppStore.getState()

    const jobId = actions.createJob({
      companyName: 'Example Co',
      jobTitle: 'Engineer',
      initialLinkUrl: 'https://example.com/job',
    })

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

    const jobId = actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const updatedAtBefore = useAppStore.getState().data.jobs[jobId]?.updatedAt
    await waitForNextTick()

    actions.setJobAppliedAt({ jobId, appliedAt: '2026-03-09T12:00:00.000Z' })
    actions.setJobFinalOutcome({ jobId, status: 'offer_received', setAt: '2026-03-10T09:30:00.000Z' })

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: '2026-03-09T12:00:00.000Z',
      finalOutcome: {
        status: 'offer_received',
        setAt: '2026-03-10T09:30:00.000Z',
      },
    })
    expect(useAppStore.getState().data.jobs[jobId]?.updatedAt).not.toBe(updatedAtBefore)

    actions.clearJobAppliedAt(jobId)

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: null,
      finalOutcome: null,
    })
  })

  it('does not allow a final outcome when the job is not applied', () => {
    const { actions } = useAppStore.getState()

    const jobId = actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })

    actions.setJobFinalOutcome({ jobId, status: 'rejected', setAt: '2026-03-10T09:30:00.000Z' })

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: null,
      finalOutcome: null,
    })

    actions.setJobAppliedAt({ jobId, appliedAt: '2026-03-09T12:00:00.000Z' })
    actions.setJobFinalOutcome({ jobId, status: 'rejected', setAt: '2026-03-10T09:30:00.000Z' })

    expect(useAppStore.getState().data.jobs[jobId]).toMatchObject({
      appliedAt: '2026-03-09T12:00:00.000Z',
      finalOutcome: {
        status: 'rejected',
        setAt: '2026-03-10T09:30:00.000Z',
      },
    })
  })

  it('creates interviews, manages associated contacts, and preserves interview contact order through export/import', () => {
    const { actions } = useAppStore.getState()

    const jobId = actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })

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

    actions.updateJobContact({ jobContactId: firstContactId, changes: { name: 'Contact One' } })
    actions.updateJobContact({ jobContactId: secondContactId, changes: { name: 'Contact Two' } })

    const interviewId = expectDefined(actions.createInterview(jobId), 'Expected interview id')

    expect(useAppStore.getState().data.interviews[interviewId]).toMatchObject({
      startAt: null,
    })

    actions.updateInterview({
      interviewId,
      changes: {
        startAt: '2026-03-12T15:00:00.000Z',
        notes: 'Team screen',
      },
    })

    actions.addInterviewContact({ interviewId, jobContactId: firstContactId })
    actions.addInterviewContact({ interviewId, jobContactId: secondContactId })

    const interviewContactIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.interviewContacts)
          .filter((item) => item.interviewId === interviewId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstInterviewContactId = expectDefined(interviewContactIds[0], 'Expected first interview contact id')
    const secondInterviewContactId = expectDefined(interviewContactIds[1], 'Expected second interview contact id')

    actions.reorderInterviewContacts({
      interviewId,
      orderedIds: [secondInterviewContactId, firstInterviewContactId],
    })

    const exported = actions.exportAppData()

    resetStore()
    useAppStore.getState().actions.importAppData(exported)

    const importedInterviewContacts = Object.values(useAppStore.getState().data.interviewContacts)
      .filter((item) => item.interviewId === interviewId)
      .sort((left, right) => left.sortOrder - right.sortOrder)

    expect(importedInterviewContacts.map((item) => useAppStore.getState().data.jobContacts[item.jobContactId]?.name)).toEqual([
      'Contact Two',
      'Contact One',
    ])
  })

  it('allows an interview to remain unscheduled', () => {
    const { actions } = useAppStore.getState()

    const jobId = actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    const interviewId = expectDefined(actions.createInterview(jobId), 'Expected interview id')

    actions.updateInterview({
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

  it('cascades interview associations when deleting a contact, interview, or job', () => {
    const { actions } = useAppStore.getState()

    const jobId = actions.createJob({ companyName: 'Example Co', jobTitle: 'Engineer' })
    actions.createJobContact(jobId)
    const contactId = expectDefined(Object.keys(useAppStore.getState().data.jobContacts)[0], 'Expected contact id')
    const interviewId = expectDefined(actions.createInterview(jobId), 'Expected interview id')

    actions.addInterviewContact({ interviewId, jobContactId: contactId })
    const interviewContactId = expectDefined(Object.keys(useAppStore.getState().data.interviewContacts)[0], 'Expected interview contact id')

    actions.deleteJobContact(contactId)
    expect(useAppStore.getState().data.interviewContacts[interviewContactId]).toBeUndefined()

    actions.createJobContact(jobId)
    const replacementContactId = expectDefined(Object.keys(useAppStore.getState().data.jobContacts)[0], 'Expected replacement contact id')
    actions.addInterviewContact({ interviewId, jobContactId: replacementContactId })
    const replacementAssociationId = expectDefined(Object.keys(useAppStore.getState().data.interviewContacts)[0], 'Expected replacement interview contact id')

    actions.deleteInterview(interviewId)
    expect(useAppStore.getState().data.interviews[interviewId]).toBeUndefined()
    expect(useAppStore.getState().data.interviewContacts[replacementAssociationId]).toBeUndefined()

    const secondInterviewId = expectDefined(actions.createInterview(jobId), 'Expected second interview id')
    actions.addInterviewContact({ interviewId: secondInterviewId, jobContactId: replacementContactId })
    expect(Object.keys(useAppStore.getState().data.interviewContacts)).toHaveLength(1)

    actions.deleteJob(jobId)
    expect(useAppStore.getState().data.jobs[jobId]).toBeUndefined()
    expect(Object.keys(useAppStore.getState().data.interviews)).toHaveLength(0)
    expect(Object.keys(useAppStore.getState().data.interviewContacts)).toHaveLength(0)
  })

  it('computes job status from appliedAt, interviews, and finalOutcome', () => {
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

  it('duplicates and cascades deletes profile links with their parent profile', () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createProfileLink(profileId)
    const originalLinkId = expectDefined(Object.keys(useAppStore.getState().data.profileLinks)[0], 'Expected a profile link id')

    actions.updateProfileLink({
      profileLinkId: originalLinkId,
      changes: { name: 'Portfolio', url: 'https://example.com/portfolio' },
    })

    const duplicatedProfileId = expectDefined(actions.duplicateProfile({ sourceProfileId: profileId }), 'Expected duplicate profile id')

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

    actions.deleteProfile(profileId)

    expect(Object.values(useAppStore.getState().data.profileLinks).filter((item) => item.profileId === profileId)).toHaveLength(0)
    expect(Object.values(useAppStore.getState().data.profileLinks).filter((item) => item.profileId === duplicatedProfileId)).toHaveLength(1)

    actions.deleteProfile(duplicatedProfileId)

    expect(Object.keys(useAppStore.getState().data.profileLinks)).toHaveLength(0)
  })

  it('preserves profile link order through export and import', () => {
    const { actions } = useAppStore.getState()

    actions.createBaseProfile('General Profile')
    const profileId = expectDefined(Object.keys(useAppStore.getState().data.profiles)[0], 'Expected a profile id')

    actions.createProfileLink(profileId)
    actions.createProfileLink(profileId)

    const profileLinkIds = getOrderedIds(
      Object.fromEntries(
        Object.values(useAppStore.getState().data.profileLinks)
          .filter((item) => item.profileId === profileId)
          .map((item) => [item.id, item]),
      ),
    )
    const firstProfileLinkId = expectDefined(profileLinkIds[0], 'Expected first profile link id')
    const secondProfileLinkId = expectDefined(profileLinkIds[1], 'Expected second profile link id')

    actions.updateProfileLink({
      profileLinkId: firstProfileLinkId,
      changes: { name: 'GitHub', url: 'https://github.com/example', enabled: false },
    })
    actions.updateProfileLink({
      profileLinkId: secondProfileLinkId,
      changes: { name: 'Website', url: 'https://example.com' },
    })

    actions.reorderProfileLinks({
      profileId,
      orderedIds: [secondProfileLinkId, firstProfileLinkId],
    })

    const exported = actions.exportAppData()

    resetStore()
    useAppStore.getState().actions.importAppData(exported)

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

  it('updates the theme preference and preserves it when resetting ui state', () => {
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

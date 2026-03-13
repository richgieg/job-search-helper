import { describe, expect, it } from 'vitest'

import { createEmptyAppDataState } from '../domain/app-data-state'
import { createDefaultResumeSettings } from '../domain/profile-defaults'
import { MockAppBackend } from './mock-app-backend'

const createSeedData = () => {
  const data = createEmptyAppDataState()

  data.jobs.job_1 = {
    id: 'job_1',
    companyName: 'Example Co',
    jobTitle: 'Senior Engineer',
    description: 'Build systems',
    location: 'Remote',
    postedCompensation: '',
    desiredCompensation: '',
    compensationNotes: '',
    workArrangement: 'remote',
    employmentType: 'full_time',
    datePosted: '2026-03-01',
    appliedAt: '2026-03-05T12:00:00.000Z',
    finalOutcome: null,
    notes: 'Important role',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  data.profiles.profile_1 = {
    id: 'profile_1',
    name: 'Tailored Profile',
    summary: 'Summary',
    coverLetter: 'Cover letter',
    resumeSettings: createDefaultResumeSettings(),
    personalDetails: {
      fullName: 'Ada Example',
      email: 'ada@example.com',
      phone: '555-0100',
      addressLine1: '1 Main St',
      addressLine2: '',
      addressLine3: '',
      city: 'Exampletown',
      state: 'CA',
      postalCode: '90210',
    },
    jobId: 'job_1',
    clonedFromProfileId: null,
    createdAt: '2026-03-02T12:00:00.000Z',
    updatedAt: '2026-03-06T12:00:00.000Z',
  }

  data.profileLinks.profile_link_1 = {
    id: 'profile_link_1',
    profileId: 'profile_1',
    name: 'Portfolio',
    url: 'https://example.com',
    enabled: true,
    sortOrder: 1,
  }

  data.skillCategories.skill_category_1 = {
    id: 'skill_category_1',
    profileId: 'profile_1',
    name: 'Languages',
    enabled: true,
    sortOrder: 1,
  }

  data.skills.skill_1 = {
    id: 'skill_1',
    skillCategoryId: 'skill_category_1',
    name: 'TypeScript',
    enabled: true,
    sortOrder: 1,
  }

  data.achievements.achievement_1 = {
    id: 'achievement_1',
    profileId: 'profile_1',
    name: 'Reduced latency',
    description: 'Improved API performance by 30%',
    enabled: true,
    sortOrder: 1,
  }

  data.experienceEntries.experience_1 = {
    id: 'experience_1',
    profileId: 'profile_1',
    company: 'Example Co',
    title: 'Engineer',
    location: 'Remote',
    workArrangement: 'remote',
    employmentType: 'full_time',
    startDate: '2024-01-01',
    endDate: null,
    isCurrent: true,
    reasonForLeavingShort: '',
    reasonForLeavingDetails: '',
    supervisor: {
      name: '',
      title: '',
      phone: '',
      email: '',
    },
    enabled: true,
    sortOrder: 1,
  }

  data.experienceBullets.experience_bullet_1 = {
    id: 'experience_bullet_1',
    experienceEntryId: 'experience_1',
    content: 'Built feature flags',
    level: 1,
    enabled: true,
    sortOrder: 1,
  }

  data.jobLinks.job_link_1 = {
    id: 'job_link_1',
    jobId: 'job_1',
    url: 'https://jobs.example.com/1',
    sortOrder: 1,
    createdAt: '2026-03-01T12:00:00.000Z',
  }

  data.jobContacts.job_contact_1 = {
    id: 'job_contact_1',
    jobId: 'job_1',
    name: 'Hiring Manager',
    title: 'Director',
    company: 'Example Co',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    email: 'manager@example.com',
    phone: '555-0101',
    linkedinUrl: '',
    relationshipType: 'hiring_manager',
    notes: '',
    sortOrder: 1,
  }

  data.interviews.interview_1 = {
    id: 'interview_1',
    jobId: 'job_1',
    createdAt: '2026-03-08T09:00:00.000Z',
    startAt: '2026-03-10T15:00:00.000Z',
    notes: 'Panel interview',
  }

  data.interviewContacts.interview_contact_1 = {
    id: 'interview_contact_1',
    interviewId: 'interview_1',
    jobContactId: 'job_contact_1',
    sortOrder: 1,
  }

  data.applicationQuestions.application_question_1 = {
    id: 'application_question_1',
    jobId: 'job_1',
    question: 'Why this role?',
    answer: 'Great fit',
    sortOrder: 1,
  }

  return data
}

describe('mock app backend read models', () => {
  it('builds a job detail bundle', async () => {
    const backend = new MockAppBackend({ initialData: createSeedData() })

    const result = await backend.getJobDetail('job_1')

    expect(result?.job.id).toBe('job_1')
    expect(result?.computedStatus).toBe('interview')
    expect(result?.relatedProfiles.map((profile) => profile.id)).toEqual(['profile_1'])
    expect(result?.jobLinks.map((link) => link.id)).toEqual(['job_link_1'])
    expect(result?.jobContacts.map((contact) => contact.id)).toEqual(['job_contact_1'])
    expect(result?.interviews[0]?.contacts[0]?.jobContact?.id).toBe('job_contact_1')
    expect(result?.applicationQuestions.map((question) => question.id)).toEqual(['application_question_1'])
  })

  it('builds a profile detail bundle', async () => {
    const backend = new MockAppBackend({ initialData: createSeedData() })

    const result = await backend.getProfileDetail('profile_1')

    expect(result?.profile.id).toBe('profile_1')
    expect(result?.attachedJob?.id).toBe('job_1')
    expect(result?.profileLinks.map((link) => link.id)).toEqual(['profile_link_1'])
    expect(result?.skillCategories[0]?.skills.map((skill) => skill.id)).toEqual(['skill_1'])
    expect(result?.achievements.map((achievement) => achievement.id)).toEqual(['achievement_1'])
    expect(result?.experienceEntries[0]?.bullets.map((bullet) => bullet.id)).toEqual(['experience_bullet_1'])
  })

  it('builds profile document data from the focused document read', async () => {
    const backend = new MockAppBackend({ initialData: createSeedData() })

    const result = await backend.getProfileDocument('profile_1')

    expect(result?.profile.id).toBe('profile_1')
    expect(result?.job.id).toBe('job_1')
    expect(result?.primaryContact.id).toBe('job_contact_1')
    expect(result?.profileLinks.map((link) => link.id)).toEqual(['profile_link_1'])
    expect(result?.skillCategories[0]?.skills.map((skill) => skill.id)).toEqual(['skill_1'])
    expect(result?.computedStatus).toBe('interview')
  })
})
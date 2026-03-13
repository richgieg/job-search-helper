import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createDefaultResumeSettings } from '../../domain/profile-defaults'
import type { ProfileDocumentData } from './document-data'
import { ResumeDocument } from './ResumeDocument'

const createDocumentData = (): ProfileDocumentData => ({
  profile: {
    id: 'profile-1',
    name: 'General Engineer',
    summary: 'Experienced engineer',
    coverLetter: '',
    resumeSettings: createDefaultResumeSettings(),
    personalDetails: {
      fullName: 'Jordan Example',
      email: 'jordan@example.com',
      phone: '555-0100',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: 'Raleigh',
      state: 'NC',
      postalCode: '27601',
    },
    jobId: null,
    clonedFromProfileId: null,
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
  },
  profileLinks: [],
  job: {
    id: 'job-1',
    companyName: 'Example Co',
    jobTitle: 'Platform Engineer',
    description: '',
    location: '',
    postedCompensation: '',
    desiredCompensation: '',
    compensationNotes: '',
    workArrangement: 'remote',
    employmentType: 'full_time',
    datePosted: null,
    appliedAt: null,
    finalOutcome: null,
    notes: '',
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
  },
  primaryContact: {
    id: 'contact-1',
    jobId: 'job-1',
    name: 'Hiring Manager',
    title: '',
    company: 'Example Co',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    relationshipType: 'hiring_manager',
    notes: '',
    sortOrder: 1,
  },
  contacts: [],
  jobLinks: [],
  skillCategories: [],
  achievements: [],
  experienceEntries: [
    {
      entry: {
        id: 'experience-entry-1',
        profileId: 'profile-1',
        company: 'Example Co',
        title: 'Platform Engineer',
        location: 'Raleigh, NC',
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
      },
      bullets: [
        {
          id: 'experience-bullet-1',
          experienceEntryId: 'experience-entry-1',
          content: 'Level one impact bullet',
          level: 1,
          enabled: true,
          sortOrder: 1,
        },
        {
          id: 'experience-bullet-2',
          experienceEntryId: 'experience-entry-1',
          content: 'Level two detail bullet',
          level: 2,
          enabled: true,
          sortOrder: 2,
        },
        {
          id: 'experience-bullet-3',
          experienceEntryId: 'experience-entry-1',
          content: 'Level three nested detail bullet',
          level: 3,
          enabled: true,
          sortOrder: 3,
        },
      ],
    },
  ],
  educationEntries: [],
  projectEntries: [],
  additionalExperienceEntries: [],
  certifications: [],
  references: [],
  computedStatus: 'interested',
})

describe('ResumeDocument', () => {
  it('renders bullet indentation and marker classes based on bullet level', () => {
    const markup = renderToStaticMarkup(<ResumeDocument documentData={createDocumentData()} />)

    expect(markup).toContain('class="ml-0 list-item list-disc">Level one impact bullet</li>')
    expect(markup).toContain('class="ml-5 list-item list-[circle]">Level two detail bullet</li>')
    expect(markup).toContain('class="ml-10 list-item list-[square]">Level three nested detail bullet</li>')
  })
})
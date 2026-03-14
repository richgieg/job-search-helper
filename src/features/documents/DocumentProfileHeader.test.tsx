import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createDefaultResumeSettings } from '../../domain/profile-defaults'
import type { DocumentHeaderTemplate } from '../../types/state'
import type { ProfileDocumentData } from './document-data'
import { DocumentProfileHeader } from './DocumentProfileHeader'

const createDocumentData = (headerTemplate: DocumentHeaderTemplate): ProfileDocumentData => ({
  profile: {
    id: 'profile-1',
    name: 'General Engineer',
    summary: '',
    coverLetter: '',
    coverLetterContactId: null,
    resumeSettings: {
      ...createDefaultResumeSettings(),
      headerTemplate,
    },
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
  profileLinks: [
    {
      id: 'profile-link-1',
      profileId: 'profile-1',
      name: 'Portfolio',
      url: 'https://example.com/portfolio',
      enabled: true,
      sortOrder: 1,
    },
    {
      id: 'profile-link-2',
      profileId: 'profile-1',
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/example',
      enabled: true,
      sortOrder: 2,
    },
  ],
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
  experienceEntries: [],
  educationEntries: [],
  projectEntries: [],
  additionalExperienceEntries: [],
  certifications: [],
  references: [],
  computedStatus: 'interested',
})

describe('DocumentProfileHeader', () => {
  it('renders the classic header template', () => {
    const markup = renderToStaticMarkup(<DocumentProfileHeader documentData={createDocumentData('classic')} />)

    expect(markup).toContain('data-header-template="classic"')
    expect(markup).toContain('justify-between')
    expect(markup).toContain('text-right')
    expect(markup).not.toContain('border-b')
  })

  it('renders the stacked header template', () => {
    const markup = renderToStaticMarkup(<DocumentProfileHeader documentData={createDocumentData('stacked')} />)

    expect(markup).toContain('data-header-template="stacked"')
    expect(markup).toContain('text-center')
    expect(markup).not.toContain('border-b')
    expect(markup).toContain('text-2xl')
    expect(markup).not.toContain('uppercase')
    expect(markup).toContain('whitespace-nowrap')
    expect(markup).toContain('class="px-3"')
    expect(markup).toContain('|')
    expect(markup).toContain('Raleigh, NC')
    expect(markup).toContain('555-0100')
    expect(markup).toContain('jordan@example.com')
    expect(markup).toContain('https://example.com/portfolio')
    expect(markup).toContain('https://linkedin.com/in/example')
  })
})
import { getJobComputedStatus } from '../jobs/job-status'
import type {
  Achievement,
  AdditionalExperienceBullet,
  AdditionalExperienceEntry,
  AppDataState,
  Certification,
  EducationBullet,
  EducationEntry,
  ExperienceBullet,
  ExperienceEntry,
  Id,
  Job,
  JobContact,
  JobLink,
  Profile,
  ProfileLink,
  Project,
  ProjectBullet,
  Reference,
  ResumeSectionKey,
  Skill,
  SkillCategory,
} from '../../types/state'

export interface DocumentSkillCategory {
  category: SkillCategory
  skills: Skill[]
}

export interface DocumentExperienceEntry {
  entry: ExperienceEntry
  bullets: ExperienceBullet[]
}

export interface DocumentEducationEntry {
  entry: EducationEntry
  bullets: EducationBullet[]
}

export interface DocumentProjectEntry {
  entry: Project
  bullets: ProjectBullet[]
}

export interface DocumentAdditionalExperienceEntry {
  entry: AdditionalExperienceEntry
  bullets: AdditionalExperienceBullet[]
}

export interface ProfileDocumentData {
  profile: Profile
  profileLinks: ProfileLink[]
  job: Job
  primaryContact: JobContact
  contacts: JobContact[]
  jobLinks: JobLink[]
  skillCategories: DocumentSkillCategory[]
  achievements: Achievement[]
  experienceEntries: DocumentExperienceEntry[]
  educationEntries: DocumentEducationEntry[]
  projectEntries: DocumentProjectEntry[]
  additionalExperienceEntries: DocumentAdditionalExperienceEntry[]
  certifications: Certification[]
  references: Reference[]
  computedStatus: ReturnType<typeof getJobComputedStatus>
}

export interface OrderedResumeSection {
  section: ResumeSectionKey
  enabled: boolean
  sortOrder: number
  label: string
}

const compareSortOrder = <T extends { sortOrder: number }>(left: T, right: T) => left.sortOrder - right.sortOrder

const compact = (values: Array<string | null | undefined>) => values.map((value) => value?.trim() ?? '').filter(Boolean)

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const replaceTemplateToken = (value: string, token: string, replacement: string) => {
  const escapedToken = escapeRegExp(token)

  return value
    .replace(new RegExp(`${escapedToken}([.!?])`, 'g'), (_, punctuation: string) =>
      replacement.endsWith(punctuation) ? replacement : `${replacement}${punctuation}`,
    )
    .replaceAll(token, replacement)
}

const endSentence = (value: string) => (/[.!?]$/.test(value) ? value : `${value}.`)

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

export const selectPrimaryContact = ({
  contacts,
  preferredContactId,
  job,
}: {
  contacts: JobContact[]
  preferredContactId: Id | null | undefined
  job: Job
}) => {
  const preferredContact = preferredContactId ? contacts.find((contact) => contact.id === preferredContactId) ?? null : null

  return preferredContact ?? contacts[0] ?? buildFallbackContact(job)
}

export const formatAddressLines = (values: Array<string | null | undefined>) => compact(values)

export const formatLocationLine = (city: string, state: string, postalCode: string) => {
  const trimmedCity = city.trim()
  const trimmedState = state.trim()
  const trimmedPostalCode = postalCode.trim()

  const cityState = [trimmedCity, trimmedState].filter(Boolean).join(', ')
  const cityStatePostal = [cityState, trimmedPostalCode].filter(Boolean).join(' ')

  return compact([cityStatePostal]).join(' · ')
}

export const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent?: boolean) => {
  const format = (value: string | null) => {
    if (!value) {
      return ''
    }

    const date = new Date(`${value}T00:00:00`)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    })
  }

  const start = format(startDate)
  const end = isCurrent ? 'Present' : format(endDate)

  if (!start && !end) {
    return ''
  }

  if (!start) {
    return end
  }

  if (!end) {
    return start
  }

  return `${start} – ${end}`
}

export const getOrderedResumeSections = (profile: Profile): OrderedResumeSection[] =>
  Object.entries(profile.resumeSettings.sections)
    .map(([section, settings]) => ({
      section: section as ResumeSectionKey,
      label: settings.label,
      enabled: settings.enabled,
      sortOrder: settings.sortOrder,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder)

export const selectProfileDocumentData = (data: AppDataState, profileId: Id): ProfileDocumentData | null => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return null
  }

  const job = profile.jobId ? data.jobs[profile.jobId] ?? buildFallbackJob(profile) : buildFallbackJob(profile)

  const profileLinks = Object.values(data.profileLinks)
    .filter((link) => link.profileId === profileId && link.enabled)
    .sort(compareSortOrder)

  const contacts = Object.values(data.jobContacts)
    .filter((contact) => contact.jobId === profile.jobId)
    .sort(compareSortOrder)

  const jobLinks = Object.values(data.jobLinks)
    .filter((link) => link.jobId === profile.jobId)
    .sort(compareSortOrder)

  const interviews = Object.values(data.interviews).filter((interview) => interview.jobId === profile.jobId)

  const skillCategories = Object.values(data.skillCategories)
    .filter((category) => category.profileId === profileId && category.enabled)
    .sort(compareSortOrder)
    .map((category) => ({
      category,
      skills: Object.values(data.skills)
        .filter((skill) => skill.skillCategoryId === category.id && skill.enabled)
        .sort(compareSortOrder),
    }))
    .filter((item) => item.skills.length > 0 || item.category.name.trim())

  const experienceEntries = Object.values(data.experienceEntries)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)
    .map((entry) => ({
      entry,
      bullets: Object.values(data.experienceBullets)
        .filter((bullet) => bullet.experienceEntryId === entry.id && bullet.enabled && bullet.content.trim())
        .sort(compareSortOrder),
    }))

  const educationEntries = Object.values(data.educationEntries)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)
    .map((entry) => ({
      entry,
      bullets: Object.values(data.educationBullets)
        .filter((bullet) => bullet.educationEntryId === entry.id && bullet.enabled && bullet.content.trim())
        .sort(compareSortOrder),
    }))

  const achievements = Object.values(data.achievements)
    .filter((item) => item.profileId === profileId && item.enabled && (item.name.trim() || item.description.trim()))
    .sort(compareSortOrder)

  const projectEntries = Object.values(data.projects)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)
    .map((entry) => ({
      entry,
      bullets: Object.values(data.projectBullets)
        .filter((bullet) => bullet.projectId === entry.id && bullet.enabled && bullet.content.trim())
        .sort(compareSortOrder),
    }))
    .filter((item) => item.entry.name.trim() || item.entry.organization.trim() || item.bullets.length > 0 || item.entry.startDate || item.entry.endDate)

  const additionalExperienceEntries = Object.values(data.additionalExperienceEntries)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)
    .map((entry) => ({
      entry,
      bullets: Object.values(data.additionalExperienceBullets)
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

  const certifications = Object.values(data.certifications)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)

  const references = Object.values(data.references)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)

  return {
    profile,
    profileLinks,
    job,
    primaryContact: selectPrimaryContact({
      contacts,
      preferredContactId: profile.coverLetterContactId,
      job,
    }),
    contacts,
    jobLinks,
    skillCategories,
    achievements,
    experienceEntries,
    educationEntries,
    projectEntries,
    additionalExperienceEntries,
    certifications,
    references,
    computedStatus: getJobComputedStatus({
      appliedAt: job.appliedAt,
      finalOutcome: job.finalOutcome,
      interviewCount: interviews.length,
    }),
  }
}

export const buildCoverLetterParagraphs = (documentData: ProfileDocumentData) => {
  const role = documentData.job.jobTitle || 'Example Role'
  const company = documentData.job.companyName || 'Example Company'
  const replaceJobTokens = (value: string) =>
    replaceTemplateToken(replaceTemplateToken(value, '{{JOB.TITLE}}', role), '{{JOB.COMPANY}}', company)

  const trimmed = documentData.profile.coverLetter
    .split(/\n\s*\n/g)
    .map((paragraph) => replaceJobTokens(paragraph.trim()))
    .filter(Boolean)

  if (trimmed.length > 0) {
    return trimmed
  }

  const summary = documentData.profile.summary.trim()

  return [
    endSentence(`I am excited to submit my application for ${role} at ${company}`),
    summary || 'My background combines hands-on delivery, collaboration, and a strong focus on clear communication and measurable outcomes.',
    endSentence(`Thank you for considering my application. I would welcome the chance to discuss how I can contribute to ${company}`),
  ]
}

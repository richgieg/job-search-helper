import { getJobComputedStatus } from '../jobs/job-status'
import type {
  AppDataState,
  EducationEntry,
  ExperienceBullet,
  ExperienceEntry,
  Id,
  Job,
  JobContact,
  JobPostingSource,
  Profile,
  Reference,
  Skill,
  SkillCategory,
} from '../../types/state'

export interface PreviewSkillCategory {
  category: SkillCategory
  skills: Skill[]
}

export interface PreviewExperienceEntry {
  entry: ExperienceEntry
  bullets: ExperienceBullet[]
}

export interface ProfilePreviewData {
  profile: Profile
  job: Job | null
  primaryContact: JobContact | null
  contacts: JobContact[]
  postingSources: JobPostingSource[]
  skillCategories: PreviewSkillCategory[]
  experienceEntries: PreviewExperienceEntry[]
  educationEntries: EducationEntry[]
  certifications: AppDataState['certifications'][Id][]
  references: Reference[]
  computedStatus: ReturnType<typeof getJobComputedStatus>
}

const compareSortOrder = <T extends { sortOrder: number }>(left: T, right: T) => left.sortOrder - right.sortOrder

const compact = (values: Array<string | null | undefined>) => values.map((value) => value?.trim() ?? '').filter(Boolean)

export const formatAddressLines = (values: Array<string | null | undefined>) => compact(values)

export const formatLocationLine = (city: string, state: string, postalCode: string) => {
  const cityStatePostal = [city, state, postalCode].map((value) => value.trim()).filter(Boolean).join(', ')
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

export const selectProfilePreviewData = (data: AppDataState, profileId: Id): ProfilePreviewData | null => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return null
  }

  const job = profile.jobId ? data.jobs[profile.jobId] ?? null : null

  const contacts = Object.values(data.jobContacts)
    .filter((contact) => contact.jobId === profile.jobId)
    .sort(compareSortOrder)

  const postingSources = Object.values(data.jobPostingSources)
    .filter((source) => source.jobId === profile.jobId)
    .sort(compareSortOrder)

  const jobEvents = Object.values(data.jobEvents)
    .filter((event) => event.jobId === profile.jobId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

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
        .filter((bullet) => bullet.experienceEntryId === entry.id && bullet.content.trim())
        .sort(compareSortOrder),
    }))

  const educationEntries = Object.values(data.educationEntries)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)

  const certifications = Object.values(data.certifications)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)

  const references = Object.values(data.references)
    .filter((entry) => entry.profileId === profileId && entry.enabled)
    .sort(compareSortOrder)

  return {
    profile,
    job,
    primaryContact: contacts[0] ?? null,
    contacts,
    postingSources,
    skillCategories,
    experienceEntries,
    educationEntries,
    certifications,
    references,
    computedStatus: getJobComputedStatus(jobEvents.map((event) => event.eventType)),
  }
}

export const buildDefaultRecipient = (job: Job | null) => ({
  name: 'Hiring Team',
  title: job ? `${job.jobTitle} hiring team` : 'Hiring manager',
  company: job?.companyName ?? 'Example Company',
  addressLines: ['123 Example Street', 'Example City, EX 12345'],
})

export const buildCoverLetterParagraphs = (preview: ProfilePreviewData) => {
  const trimmed = preview.profile.coverLetter
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (trimmed.length > 0) {
    return trimmed
  }

  const summary = preview.profile.summary.trim()
  const role = preview.job?.jobTitle ?? 'the opportunity'
  const company = preview.job?.companyName ?? 'your team'

  return [
    `I am excited to submit my application for ${role} at ${company}.`,
    summary || 'My background combines hands-on delivery, collaboration, and a strong focus on clear communication and measurable outcomes.',
    `Thank you for considering my application. I would welcome the chance to discuss how I can contribute to ${company}.`,
  ]
}

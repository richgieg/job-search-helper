import type { ResumeSectionKey } from '../types/state'

export const defaultResumeSectionOrder: ResumeSectionKey[] = [
  'summary',
  'skills',
  'achievements',
  'experience',
  'education',
  'projects',
  'additional_experience',
  'certifications',
  'references',
]

export const defaultResumeSectionLabels: Record<ResumeSectionKey, string> = {
  summary: 'Summary',
  skills: 'Skills',
  achievements: 'Achievements',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  additional_experience: 'Additional Experience',
  certifications: 'Certifications',
  references: 'References',
}

export const getDefaultResumeSectionLabel = (section: ResumeSectionKey) => defaultResumeSectionLabels[section]

export const normalizeResumeSectionLabel = (section: ResumeSectionKey, label: string) => {
  const trimmed = label.trim()

  return trimmed || getDefaultResumeSectionLabel(section)
}
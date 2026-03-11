import type { ResumeSectionKey } from '../types/state'

export const defaultResumeSectionLabels: Record<ResumeSectionKey, string> = {
  summary: 'Summary',
  skills: 'Skills',
  achievements: 'Achievements',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  references: 'References',
}

export const getDefaultResumeSectionLabel = (section: ResumeSectionKey) => defaultResumeSectionLabels[section]

export const normalizeResumeSectionLabel = (section: ResumeSectionKey, label: string) => {
  const trimmed = label.trim()

  return trimmed || getDefaultResumeSectionLabel(section)
}
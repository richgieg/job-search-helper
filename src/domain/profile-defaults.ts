import type { PersonalDetails, ResumeSettings } from '../types/state'
import { defaultDocumentHeaderTemplate } from '../utils/document-header-templates'
import { defaultResumeSectionLabels, defaultResumeSectionOrder } from '../utils/resume-section-labels'

const createEmptyPersonalDetails = (): PersonalDetails => ({
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  city: '',
  state: '',
  postalCode: '',
})

export const createDefaultResumeSettings = (): ResumeSettings => ({
  headerTemplate: defaultDocumentHeaderTemplate,
  sections: defaultResumeSectionOrder.reduce<ResumeSettings['sections']>((sections, section, index) => {
    sections[section] = {
      enabled: true,
      sortOrder: index + 1,
      label: defaultResumeSectionLabels[section],
    }

    return sections
  }, {} as ResumeSettings['sections']),
})

export const emptyProfileDefaults = {
  summary: '',
  coverLetter: '',
  resumeSettings: createDefaultResumeSettings(),
  personalDetails: createEmptyPersonalDetails(),
}
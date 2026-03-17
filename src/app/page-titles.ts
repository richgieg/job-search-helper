import appMetadata from './app-metadata.json'

export const APP_NAME = appMetadata.appName

interface JobTitleContext {
  jobTitle?: string | null
  companyName?: string | null
  staffingAgencyName?: string | null
}

const normalizeTitlePart = (value?: string | null) => value?.trim() ?? ''

const joinTitleParts = (...parts: Array<string | null | undefined>) => parts.map(normalizeTitlePart).filter(Boolean).join(' | ')

const getOrganizationTitlePart = (job?: JobTitleContext | null) => normalizeTitlePart(job?.companyName) || normalizeTitlePart(job?.staffingAgencyName)

export const createJobSummaryTitlePart = (job?: JobTitleContext | null) => {
  const jobTitle = normalizeTitlePart(job?.jobTitle)
  const organizationName = getOrganizationTitlePart(job)

  if (jobTitle && organizationName) {
    return `${jobTitle} at ${organizationName}`
  }

  return jobTitle || organizationName
}

export const createStaticPageTitle = (pageName?: string | null) => joinTitleParts(pageName, APP_NAME)

export const createLandingPageTitle = () => APP_NAME

export const createJobPageTitle = (job?: JobTitleContext | null) => joinTitleParts('Job', createJobSummaryTitlePart(job), APP_NAME)

export const createProfilePageTitle = ({
  profileName,
  job,
}: {
  profileName?: string | null
  job?: JobTitleContext | null
}) => joinTitleParts('Profile', profileName, createJobSummaryTitlePart(job), APP_NAME)

export const createApplicationPageTitle = ({
  profileName,
  job,
}: {
  profileName?: string | null
  job?: JobTitleContext | null
}) => joinTitleParts('Application', profileName, createJobSummaryTitlePart(job), APP_NAME)
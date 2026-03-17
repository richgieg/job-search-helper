import { describe, expect, it } from 'vitest'

import appMetadata from './app-metadata.json'
import {
  APP_NAME,
  createApplicationPageTitle,
  createJobPageTitle,
  createLandingPageTitle,
  createProfilePageTitle,
  createStaticPageTitle,
} from './page-titles'

describe('page-titles', () => {
  it('builds the static page titles', () => {
    expect(APP_NAME).toBe(appMetadata.appName)
    expect(createLandingPageTitle()).toBe(APP_NAME)
    expect(createStaticPageTitle('Dashboard')).toBe('Dashboard | Job Search Helper')
    expect(createStaticPageTitle('Profiles')).toBe('Profiles | Job Search Helper')
    expect(createStaticPageTitle('Jobs')).toBe('Jobs | Job Search Helper')
    expect(createStaticPageTitle('Import / Export')).toBe('Import / Export | Job Search Helper')
  })

  it('builds job titles with exact fallbacks', () => {
    expect(createJobPageTitle({ jobTitle: 'Senior Engineer', companyName: 'Example Co' })).toBe('Job | Senior Engineer at Example Co | Job Search Helper')
    expect(createJobPageTitle({ jobTitle: 'Senior Engineer', companyName: '' })).toBe('Job | Senior Engineer | Job Search Helper')
    expect(createJobPageTitle({ jobTitle: '', staffingAgencyName: 'North Ridge Talent' })).toBe('Job | North Ridge Talent | Job Search Helper')
    expect(createJobPageTitle()).toBe('Job | Job Search Helper')
  })

  it('builds profile titles with exact fallbacks', () => {
    expect(createProfilePageTitle({ profileName: 'Tailored Profile', job: { jobTitle: 'Senior Engineer', companyName: 'Example Co' } })).toBe(
      'Profile | Tailored Profile | Senior Engineer at Example Co | Job Search Helper',
    )
    expect(createProfilePageTitle({ profileName: 'Base Profile' })).toBe('Profile | Base Profile | Job Search Helper')
    expect(createProfilePageTitle({ job: { jobTitle: 'Senior Engineer', companyName: 'Example Co' } })).toBe(
      'Profile | Senior Engineer at Example Co | Job Search Helper',
    )
    expect(createProfilePageTitle({})).toBe('Profile | Job Search Helper')
  })

  it('builds application titles with exact fallbacks', () => {
    expect(createApplicationPageTitle({ profileName: 'Tailored Profile', job: { jobTitle: 'Senior Engineer', companyName: 'Example Co' } })).toBe(
      'Application | Tailored Profile | Senior Engineer at Example Co | Job Search Helper',
    )
    expect(createApplicationPageTitle({ profileName: 'Base Profile' })).toBe('Application | Base Profile | Job Search Helper')
    expect(createApplicationPageTitle({ job: { jobTitle: 'Senior Engineer', companyName: 'Example Co' } })).toBe(
      'Application | Senior Engineer at Example Co | Job Search Helper',
    )
    expect(createApplicationPageTitle({})).toBe('Application | Job Search Helper')
  })
})
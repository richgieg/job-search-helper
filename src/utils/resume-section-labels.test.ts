import { describe, expect, it } from 'vitest'

import {
  getDefaultResumeSectionLabel,
  normalizeResumeSectionLabel,
} from './resume-section-labels'

describe('resume-section-labels', () => {
  it('returns the default label for a section', () => {
    expect(getDefaultResumeSectionLabel('additional_experience')).toBe('Additional Experience')
  })

  it('normalizes custom labels by trimming whitespace', () => {
    expect(normalizeResumeSectionLabel('skills', '  Core Skills  ')).toBe('Core Skills')
  })

  it('falls back to the default label when the provided label is blank', () => {
    expect(normalizeResumeSectionLabel('skills', '   ')).toBe('Skills')
  })
})
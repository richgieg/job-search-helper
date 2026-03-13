import { describe, expect, it } from 'vitest'

import {
  createCoverLetterDocumentTitle,
  createCoverLetterResumeDocumentTitle,
  createReferencesDocumentTitle,
  createResumeDocumentTitle,
} from './document-titles'

describe('document-titles', () => {
  it('prefers the full name and sanitizes whitespace in document titles', () => {
    expect(createResumeDocumentTitle('Ada Lovelace', 'Ignored Name')).toBe('Ada_Lovelace_Resume')
    expect(createCoverLetterDocumentTitle('Ada Lovelace', 'Ignored Name')).toBe('Ada_Lovelace_Cover_Letter')
    expect(createCoverLetterResumeDocumentTitle('Ada Lovelace', 'Ignored Name')).toBe('Ada_Lovelace_Cover_Letter_and_Resume')
    expect(createReferencesDocumentTitle('Ada Lovelace', 'Ignored Name')).toBe('Ada_Lovelace_References')
  })

  it('falls back to the profile name when the full name is blank', () => {
    expect(createResumeDocumentTitle('', 'Platform Profile')).toBe('Platform_Profile_Resume')
  })

  it('returns generic fallback titles when both names are blank', () => {
    expect(createResumeDocumentTitle('', '')).toBe('Resume')
    expect(createCoverLetterDocumentTitle('', '')).toBe('Cover_Letter')
    expect(createCoverLetterResumeDocumentTitle('', '')).toBe('Cover_Letter_and_Resume')
    expect(createReferencesDocumentTitle('', '')).toBe('References')
  })
})
import { describe, expect, it } from 'vitest'

import { normalizeDocumentHeaderTemplate } from './document-header-templates'

describe('document-header-templates', () => {
  it('keeps valid header template values', () => {
    expect(normalizeDocumentHeaderTemplate('stacked')).toBe('stacked')
  })

  it('falls back to the default header template for invalid or missing values', () => {
    expect(normalizeDocumentHeaderTemplate('unknown')).toBe('classic')
    expect(normalizeDocumentHeaderTemplate(undefined)).toBe('classic')
    expect(normalizeDocumentHeaderTemplate(null)).toBe('classic')
  })
})
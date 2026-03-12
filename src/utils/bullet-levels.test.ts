import { describe, expect, it } from 'vitest'

import { formatBulletCopyLine, getBulletIndentClassName, getResumeBulletMarkerClassName } from './bullet-levels'

describe('bullet-levels', () => {
  it('formats copy lines with indentation for deeper bullet levels', () => {
    expect(formatBulletCopyLine('Level one bullet', 1)).toBe('- Level one bullet')
    expect(formatBulletCopyLine('Level two bullet', 2)).toBe('  - Level two bullet')
    expect(formatBulletCopyLine('Level three bullet', 3)).toBe('    - Level three bullet')
  })

  it('maps bullet levels to indentation classes for resume rendering', () => {
    expect(getBulletIndentClassName(1)).toBe('ml-0')
    expect(getBulletIndentClassName(2)).toBe('ml-5')
    expect(getBulletIndentClassName(3)).toBe('ml-10')
  })

  it('maps bullet levels to resume marker styles', () => {
    expect(getResumeBulletMarkerClassName(1)).toBe('list-disc')
    expect(getResumeBulletMarkerClassName(2)).toBe('list-[circle]')
    expect(getResumeBulletMarkerClassName(3)).toBe('list-[square]')
  })
})
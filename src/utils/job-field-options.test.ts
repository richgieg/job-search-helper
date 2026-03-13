import { describe, expect, it } from 'vitest'

import {
  employmentTypeOptions,
  formatEmploymentType,
  formatWorkArrangement,
  workArrangementOptions,
} from './job-field-options'

describe('job-field-options', () => {
  it('formats work arrangements and employment types for display', () => {
    expect(formatWorkArrangement('onsite')).toBe('On-Site')
    expect(formatEmploymentType('contract')).toBe('Contract')
  })

  it('builds option arrays from the same labels used by the formatters', () => {
    expect(workArrangementOptions.map((option) => option.label)).toEqual(workArrangementOptions.map((option) => formatWorkArrangement(option.value)))
    expect(employmentTypeOptions.map((option) => option.label)).toEqual(employmentTypeOptions.map((option) => formatEmploymentType(option.value)))
  })
})
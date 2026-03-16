import { describe, expect, it } from 'vitest'

import { generateSampleAppExportFile } from './generate-sample-app-export-file'

describe('generateSampleAppExportFile', () => {
  it('shifts built-in sample dates relative to the requested now', () => {
    const generated = generateSampleAppExportFile(new Date('2026-03-16T15:30:00.000Z'))

    expect(generated.exportedAt).toBe('2026-03-16T15:30:00.000Z')
    expect(generated.data.profiles['profile-base-software-engineer']?.createdAt).toBe('2026-03-07T12:30:00.000Z')
    expect(generated.data.profiles['profile-base-software-engineer']?.updatedAt).toBe('2026-03-16T15:30:00.000Z')
    expect(generated.data.educationEntries['education-se-ncsu-bs']?.startDate).toBe('2012-08-07')
    expect(generated.data.jobs['job-atlas-health']?.datePosted).toBe('2026-02-24')
    expect(generated.data.jobs['job-atlas-health']?.appliedAt).toBe('2026-02-26T18:00:00.000Z')
    expect(generated.data.interviews['interview-atlas-screen']?.startAt).toBe('2026-03-03T18:30:00.000Z')
    expect(generated.data.profiles['profile-base-software-engineer']?.personalDetails.fullName).toBe('Rowan Mercer')
    expect(Object.keys(generated.data.profiles)).toHaveLength(3)
    expect(Object.keys(generated.data.jobs)).toHaveLength(17)
  })
})
import { describe, expect, it } from 'vitest'

import { generateSampleAppExportFile } from './generate-sample-app-export-file'

describe('generateSampleAppExportFile', () => {
  it('shifts built-in sample dates relative to the requested now', () => {
    const now = new Date('2026-03-16T15:30:00.000Z')
    const sourceSummitArchitectureStartAt = '2026-03-12T19:00:00.000Z'
    const targetSummitArchitectureStartAt = new Date(now)

    targetSummitArchitectureStartAt.setDate(now.getDate() + 3)
    targetSummitArchitectureStartAt.setHours(12, 0, 0, 0)

    const timestampShiftMilliseconds = Date.parse(targetSummitArchitectureStartAt.toISOString()) - Date.parse(sourceSummitArchitectureStartAt)
    const generated = generateSampleAppExportFile(now)

    expect(generated.exportedAt).toBe(new Date(Date.parse('2026-03-10T12:00:00.000Z') + timestampShiftMilliseconds).toISOString())
    expect(generated.data.profiles['profile-base-software-engineer']?.createdAt).toBe(
      new Date(Date.parse('2026-03-01T09:00:00.000Z') + timestampShiftMilliseconds).toISOString(),
    )
    expect(generated.data.profiles['profile-base-software-engineer']?.updatedAt).toBe(
      new Date(Date.parse('2026-03-08T12:00:00.000Z') + timestampShiftMilliseconds).toISOString(),
    )
    expect(generated.data.educationEntries['education-se-ncsu-bs']?.startDate).toBe('2012-08-08')
    expect(generated.data.jobs['job-atlas-health']?.datePosted).toBe('2026-02-25')
    expect(generated.data.jobs['job-atlas-health']?.appliedAt).toBe(
      new Date(Date.parse('2026-02-20T14:30:00.000Z') + timestampShiftMilliseconds).toISOString(),
    )
    expect(generated.data.interviews['interview-atlas-screen']?.startAt).toBe(
      new Date(Date.parse('2026-02-25T15:00:00.000Z') + timestampShiftMilliseconds).toISOString(),
    )
    const summitArchitectureGeneratedStartAt = generated.data.interviews['interview-summit-architecture']?.startAt

    expect(summitArchitectureGeneratedStartAt).toBe(targetSummitArchitectureStartAt.toISOString())
    expect(summitArchitectureGeneratedStartAt).not.toBeNull()
    expect(new Date(summitArchitectureGeneratedStartAt!).getHours()).toBe(12)
    expect(generated.data.profiles['profile-base-software-engineer']?.personalDetails.fullName).toBe('Rowan Mercer')
    expect(Object.keys(generated.data.profiles)).toHaveLength(3)
    expect(Object.keys(generated.data.jobs)).toHaveLength(17)
  })
})
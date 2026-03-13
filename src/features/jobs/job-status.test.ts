import { describe, expect, it } from 'vitest'

import { getJobComputedStatus } from './job-status'

describe('getJobComputedStatus', () => {
  it('derives status from appliedAt, interviews, and finalOutcome', () => {
    expect(getJobComputedStatus({ appliedAt: null, finalOutcome: null, interviewCount: 0 })).toBe('interested')
    expect(getJobComputedStatus({ appliedAt: '2026-03-09T12:00:00.000Z', finalOutcome: null, interviewCount: 0 })).toBe('applied')
    expect(getJobComputedStatus({ appliedAt: '2026-03-09T12:00:00.000Z', finalOutcome: null, interviewCount: 1 })).toBe('interview')
    expect(
      getJobComputedStatus({
        appliedAt: '2026-03-09T12:00:00.000Z',
        finalOutcome: { status: 'offer_received', setAt: '2026-03-10T12:00:00.000Z' },
        interviewCount: 1,
      }),
    ).toBe('offer_received')
    expect(
      getJobComputedStatus({
        appliedAt: '2026-03-09T12:00:00.000Z',
        finalOutcome: { status: 'offer_accepted', setAt: '2026-03-11T12:00:00.000Z' },
        interviewCount: 2,
      }),
    ).toBe('offer_accepted')
    expect(
      getJobComputedStatus({
        appliedAt: '2026-03-09T12:00:00.000Z',
        finalOutcome: { status: 'rejected', setAt: '2026-03-11T12:00:00.000Z' },
        interviewCount: 2,
      }),
    ).toBe('rejected')
  })
})
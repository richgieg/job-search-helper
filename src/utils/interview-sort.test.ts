import { describe, expect, it } from 'vitest'

import type { Interview } from '../types/state'
import { compareInterviewsBySchedule } from './interview-sort'

const createInterview = (overrides: Partial<Interview> & Pick<Interview, 'id' | 'jobId' | 'createdAt' | 'startAt'>): Interview => ({
  id: overrides.id,
  jobId: overrides.jobId,
  createdAt: overrides.createdAt,
  startAt: overrides.startAt,
  notes: overrides.notes ?? '',
})

describe('compareInterviewsBySchedule', () => {
  it('sorts scheduled interviews before unscheduled interviews', () => {
    const interviews = [
      createInterview({ id: 'unscheduled', jobId: 'job_1', createdAt: '2026-03-10T12:00:00.000Z', startAt: null }),
      createInterview({ id: 'scheduled', jobId: 'job_1', createdAt: '2026-03-09T12:00:00.000Z', startAt: '2026-03-20T15:00:00.000Z' }),
    ]

    expect(interviews.sort(compareInterviewsBySchedule).map((item) => item.id)).toEqual(['scheduled', 'unscheduled'])
  })

  it('sorts scheduled interviews by startAt', () => {
    const interviews = [
      createInterview({ id: 'later', jobId: 'job_1', createdAt: '2026-03-08T12:00:00.000Z', startAt: '2026-03-22T15:00:00.000Z' }),
      createInterview({ id: 'earlier', jobId: 'job_1', createdAt: '2026-03-09T12:00:00.000Z', startAt: '2026-03-20T15:00:00.000Z' }),
    ]

    expect(interviews.sort(compareInterviewsBySchedule).map((item) => item.id)).toEqual(['earlier', 'later'])
  })

  it('sorts unscheduled interviews by createdAt', () => {
    const interviews = [
      createInterview({ id: 'newer', jobId: 'job_1', createdAt: '2026-03-11T12:00:00.000Z', startAt: null }),
      createInterview({ id: 'older', jobId: 'job_1', createdAt: '2026-03-10T12:00:00.000Z', startAt: null }),
    ]

    expect(interviews.sort(compareInterviewsBySchedule).map((item) => item.id)).toEqual(['older', 'newer'])
  })
})
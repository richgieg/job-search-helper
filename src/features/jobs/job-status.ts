import type { FinalOutcome, JobComputedStatus } from '../../types/state'

export const getJobComputedStatus = (input: {
  appliedAt: string | null
  finalOutcome: FinalOutcome | null
  interviewCount: number
}): JobComputedStatus => {
  if (input.finalOutcome?.status === 'withdrew') {
    return 'withdrew'
  }
  if (input.finalOutcome?.status === 'rejected') {
    return 'rejected'
  }
  if (input.finalOutcome?.status === 'offer_received' || input.finalOutcome?.status === 'offer_accepted') {
    return 'offer'
  }
  if (input.interviewCount > 0) {
    return 'interview'
  }
  if (input.appliedAt) {
    return 'applied'
  }

  return 'interested'
}

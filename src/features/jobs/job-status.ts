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
  if (input.finalOutcome?.status === 'offer_received') {
    return 'offer_received'
  }
  if (input.finalOutcome?.status === 'offer_accepted') {
    return 'offer_accepted'
  }
  if (input.interviewCount > 0) {
    return 'interview'
  }
  if (input.appliedAt) {
    return 'applied'
  }

  return 'interested'
}

export const formatJobComputedStatus = (status: JobComputedStatus) => {
  switch (status) {
    case 'offer_received':
      return 'Offer Received'
    case 'offer_accepted':
      return 'Offer Accepted'
    case 'interested':
      return 'Interested'
    case 'applied':
      return 'Applied'
    case 'interview':
      return 'Interview'
    case 'rejected':
      return 'Rejected'
    case 'withdrew':
      return 'Withdrew'
    default:
      return status
  }
}

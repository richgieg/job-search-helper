import type { JobComputedStatus, JobEventType } from '../../types/state'

export const getJobComputedStatus = (eventTypes: JobEventType[]): JobComputedStatus => {
  if (eventTypes.includes('withdrew')) {
    return 'withdrew'
  }
  if (eventTypes.includes('rejected')) {
    return 'rejected'
  }
  if (eventTypes.includes('offer_received')) {
    return 'offer'
  }
  if (eventTypes.includes('interview_scheduled') || eventTypes.includes('interview_completed')) {
    return 'interview'
  }
  if (eventTypes.includes('applied')) {
    return 'applied'
  }

  return 'interested'
}

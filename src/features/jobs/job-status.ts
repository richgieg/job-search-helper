import type { FinalOutcome, FinalOutcomeStatus, JobComputedStatus } from '../../types/state'

const jobStatusColorClasses: Record<
  JobComputedStatus,
  {
    badge: string
    stripSelected: string
  }
> = {
  interested: {
    badge: 'bg-sky-50 text-sky-700',
    stripSelected: 'border-sky-300 bg-sky-100 text-sky-800',
  },
  applied: {
    badge: 'bg-indigo-50 text-indigo-700',
    stripSelected: 'border-indigo-300 bg-indigo-100 text-indigo-800',
  },
  interview: {
    badge: 'bg-violet-50 text-violet-700',
    stripSelected: 'border-violet-300 bg-violet-100 text-violet-800',
  },
  withdrew: {
    badge: 'bg-amber-50 text-amber-800',
    stripSelected: 'border-amber-300 bg-amber-100 text-amber-900',
  },
  rejected: {
    badge: 'bg-rose-50 text-rose-700',
    stripSelected: 'border-rose-300 bg-rose-100 text-rose-800',
  },
  offer_received: {
    badge: 'bg-emerald-50 text-emerald-700',
    stripSelected: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  },
  offer_accepted: {
    badge: 'bg-teal-50 text-teal-700',
    stripSelected: 'border-teal-300 bg-teal-100 text-teal-800',
  },
}

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

export const getJobComputedStatusBadgeClassName = (status: JobComputedStatus) => jobStatusColorClasses[status].badge

export const getFinalOutcomeSelectedClassName = (status: FinalOutcomeStatus) => {
  switch (status) {
    case 'withdrew':
      return jobStatusColorClasses.withdrew.stripSelected
    case 'rejected':
      return jobStatusColorClasses.rejected.stripSelected
    case 'offer_received':
      return jobStatusColorClasses.offer_received.stripSelected
    case 'offer_accepted':
      return jobStatusColorClasses.offer_accepted.stripSelected
    default:
      return jobStatusColorClasses.interested.stripSelected
  }
}

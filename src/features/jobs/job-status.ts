import type { FinalOutcome, FinalOutcomeStatus, JobComputedStatus } from '../../types/state'

const jobStatusColorClasses: Record<
  JobComputedStatus,
  {
    badge: string
    stripSelected: string
  }
> = {
  interested: {
    badge: 'bg-app-status-interested-soft text-app-status-interested',
    stripSelected: 'border-app-status-interested-muted bg-app-status-interested-muted text-app-status-interested-contrast',
  },
  applied: {
    badge: 'bg-app-status-applied-soft text-app-status-applied',
    stripSelected: 'border-app-status-applied-muted bg-app-status-applied-muted text-app-status-applied-contrast',
  },
  interview: {
    badge: 'bg-app-status-interview-soft text-app-status-interview',
    stripSelected: 'border-app-status-interview-muted bg-app-status-interview-muted text-app-status-interview-contrast',
  },
  withdrew: {
    badge: 'bg-app-status-withdrew-soft text-app-status-withdrew',
    stripSelected: 'border-app-border bg-app-status-withdrew-muted text-app-status-withdrew-contrast',
  },
  rejected: {
    badge: 'bg-app-status-rejected-soft text-app-status-rejected',
    stripSelected: 'border-app-border bg-app-status-rejected-muted text-app-status-rejected-contrast',
  },
  offer_received: {
    badge: 'bg-app-status-offer-soft text-app-status-offer',
    stripSelected: 'border-app-border bg-app-status-offer-muted text-app-status-offer-contrast',
  },
  offer_accepted: {
    badge: 'bg-app-status-accepted-soft text-app-status-accepted',
    stripSelected: 'border-app-status-accepted-border bg-app-status-accepted-muted text-app-status-accepted-contrast',
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

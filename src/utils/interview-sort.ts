import type { Interview } from '../types/state'

type SortableInterview = Pick<Interview, 'id' | 'createdAt' | 'startAt'>

export const compareInterviewsBySchedule = (left: SortableInterview, right: SortableInterview) => {
  if (left.startAt && right.startAt) {
    return left.startAt.localeCompare(right.startAt)
      || left.createdAt.localeCompare(right.createdAt)
      || left.id.localeCompare(right.id)
  }

  if (left.startAt) {
    return -1
  }

  if (right.startAt) {
    return 1
  }

  return left.createdAt.localeCompare(right.createdAt)
    || left.id.localeCompare(right.id)
}
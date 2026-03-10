import type { EmploymentType, WorkArrangement } from '../types/state'

type SelectOption<T extends string> = {
  value: T
  label: string
}

export const workArrangementLabels: Record<WorkArrangement, string> = {
  unknown: 'Unknown',
  onsite: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

export const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
  other: 'Other',
}

export const workArrangementOptions: SelectOption<WorkArrangement>[] = [
  { value: 'unknown', label: workArrangementLabels.unknown },
  { value: 'onsite', label: workArrangementLabels.onsite },
  { value: 'hybrid', label: workArrangementLabels.hybrid },
  { value: 'remote', label: workArrangementLabels.remote },
]

export const employmentTypeOptions: SelectOption<EmploymentType>[] = [
  { value: 'full_time', label: employmentTypeLabels.full_time },
  { value: 'part_time', label: employmentTypeLabels.part_time },
  { value: 'contract', label: employmentTypeLabels.contract },
  { value: 'internship', label: employmentTypeLabels.internship },
  { value: 'temporary', label: employmentTypeLabels.temporary },
  { value: 'other', label: employmentTypeLabels.other },
]

export const formatWorkArrangement = (value: WorkArrangement) => workArrangementLabels[value]

export const formatEmploymentType = (value: EmploymentType) => employmentTypeLabels[value]
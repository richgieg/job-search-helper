import type { JobComputedStatus } from '../types/state'

export interface JobsListLinkDto {
  id: string
  url: string
}

export interface JobsListItemDto {
  id: string
  companyName: string
  jobTitle: string
  computedStatus: JobComputedStatus
  interviewCount: number
  jobLinks: JobsListLinkDto[]
  createdAt: string
  updatedAt: string
}

export interface JobsListDto {
  items: JobsListItemDto[]
  updatedAt: string
}
import type { JobComputedStatus } from '../types/state'

export interface DashboardSummaryDto {
  profileCount: number
  baseProfileCount: number
  jobProfileCount: number
  jobCount: number
  activeInterviewCount: number
  contactCount: number
  updatedAt: string
}

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

export interface ProfilesListItemDto {
  id: string
  name: string
  kind: 'base' | 'job'
  jobId: string | null
  jobSummary: null | {
    id: string
    companyName: string
    jobTitle: string
  }
  createdAt: string
  updatedAt: string
}

export interface ProfilesListDto {
  items: ProfilesListItemDto[]
  updatedAt: string
}
export const queryKeys = {
  dashboardSummary: () => ['dashboardSummary'] as const,
  jobsList: () => ['jobs', 'list'] as const,
  jobsDetailRoot: () => ['jobs', 'detail'] as const,
  jobsDetail: (jobId: string) => ['jobs', 'detail', jobId] as const,
  profilesListRoot: () => ['profiles', 'list'] as const,
  profilesList: (kind: 'base' | 'job' | 'all') => ['profiles', 'list', { kind }] as const,
  profilesDetailRoot: () => ['profiles', 'detail'] as const,
  profilesDetail: (profileId: string) => ['profiles', 'detail', profileId] as const,
  profilesDocumentRoot: () => ['profiles', 'document'] as const,
  profilesDocument: (profileId: string) => ['profiles', 'document', profileId] as const,
}
export const queryKeys = {
  dashboardSummary: () => ['dashboardSummary'] as const,
  jobsList: () => ['jobs', 'list'] as const,
  profilesListRoot: () => ['profiles', 'list'] as const,
  profilesList: (kind: 'base' | 'job' | 'all') => ['profiles', 'list', { kind }] as const,
}
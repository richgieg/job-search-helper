# Page-Scoped Data Loading Plan

## Purpose

Define an incremental path from eager app-wide hydration to page-scoped loading with cached reads and background revalidation.

This plan is specific to the current runtime architecture:

- [src/app/App.tsx](../src/app/App.tsx) triggers a global hydrate on startup
- [src/store/app-store.ts](../src/store/app-store.ts) caches a full `AppDataState` snapshot plus UI state
- [src/api/app-data-service.ts](../src/api/app-data-service.ts) and [src/api/app-api-client.ts](../src/api/app-api-client.ts) only expose whole-app reads and whole-app mutation results
- most pages read normalized entities directly from `state.data.*`

## Current Constraints

The current implementation makes page-scoped loading difficult for three reasons:

1. App bootstrap always fetches the entire persisted dataset.
2. The read API is shaped around `getAppData()` rather than route-specific read models.
3. Mutations return a full `AppDataState` snapshot, so the store is updated by whole-world replacement instead of targeted cache updates or query invalidation.

The important conclusion is that the unit of loading must change before the route layer changes.

## Recommended Target Architecture

Use three runtime layers with clearer responsibilities.

### 1. UI State in Zustand

Zustand should continue to own transient client state:

- list filter controls
- selected ids
- dialog state
- local form draft state when it is intentionally decoupled from server state
- mutation progress if a given screen needs local save indicators

### 2. Server Read State in a Query Cache

Introduce a dedicated query cache for persisted reads. The recommended choice is TanStack Query via `@tanstack/react-query`.

Responsibilities:

- page-scoped data fetching
- stale-while-revalidate behavior
- cached reads on revisit
- deduped in-flight requests
- query invalidation after mutation
- route-local loading and error state

### 3. API Read Models at the Service Boundary

The API boundary should expose page-oriented read models instead of only a full `AppDataState` snapshot.

The point is not to fetch individual tables. The point is to fetch the data bundle each route actually needs.

## Query Inventory

The first stable query set should be:

```ts
type AppQueryKey =
  | ['dashboardSummary']
  | ['jobs', 'list']
  | ['jobs', 'detail', string]
  | ['profiles', 'list', { kind: 'base' | 'job' | 'all' }]
  | ['profiles', 'detail', string]
  | ['profiles', 'document', string]
```

Notes:

- Keep list filters in UI state at first. The initial query keys do not need to include client-side search and sort settings.
- If list filtering later moves server-side, extend the list query keys to include a serializable filter object.

## Read DTOs

The DTOs below are the recommended first read contracts.

### Dashboard Summary

```ts
interface DashboardSummaryDto {
  profileCount: number
  baseProfileCount: number
  jobProfileCount: number
  jobCount: number
  activeInterviewCount: number
  contactCount: number
  updatedAt: string
}
```

This replaces counting raw entity maps inside [src/pages/DashboardPage.tsx](../src/pages/DashboardPage.tsx).

### Jobs List

```ts
interface JobsListItemDto {
  id: string
  companyName: string
  jobTitle: string
  computedStatus: import('../src/types/state').JobComputedStatus
  interviewCount: number
  jobLinks: Array<{
    id: string
    url: string
  }>
  createdAt: string
  updatedAt: string
}

interface JobsListDto {
  items: JobsListItemDto[]
  updatedAt: string
}
```

This lets [src/pages/JobsPage.tsx](../src/pages/JobsPage.tsx) render without separately loading every job link and interview.

### Job Detail

```ts
interface JobDetailDto {
  job: import('../src/types/state').Job
  computedStatus: import('../src/types/state').JobComputedStatus
  relatedProfiles: import('../src/types/state').Profile[]
  jobLinks: import('../src/types/state').JobLink[]
  jobContacts: import('../src/types/state').JobContact[]
  interviews: Array<{
    interview: import('../src/types/state').Interview
    contacts: Array<{
      interviewContact: import('../src/types/state').InterviewContact
      jobContact: import('../src/types/state').JobContact | null
    }>
  }>
  applicationQuestions: import('../src/types/state').ApplicationQuestion[]
  cacheData: Partial<import('../src/types/state').AppDataState>
}
```

This is the read model for [src/pages/JobPage/JobPage.tsx](../src/pages/JobPage/JobPage.tsx) and [src/pages/JobPage/JobChildEditors.tsx](../src/pages/JobPage/JobChildEditors.tsx).

### Profiles List

```ts
interface ProfilesListItemDto {
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

interface ProfilesListDto {
  items: ProfilesListItemDto[]
  updatedAt: string
}
```

This supports [src/pages/ProfilesPage.tsx](../src/pages/ProfilesPage.tsx) without requiring a full profile graph.

### Profile Detail

```ts
interface ProfileDetailDto {
  profile: import('../src/types/state').Profile
  attachedJob: import('../src/types/state').Job | null
  profileLinks: import('../src/types/state').ProfileLink[]
  skillCategories: Array<{
    category: import('../src/types/state').SkillCategory
    skills: import('../src/types/state').Skill[]
  }>
  achievements: import('../src/types/state').Achievement[]
  experienceEntries: Array<{
    entry: import('../src/types/state').ExperienceEntry
    bullets: import('../src/types/state').ExperienceBullet[]
  }>
  educationEntries: Array<{
    entry: import('../src/types/state').EducationEntry
    bullets: import('../src/types/state').EducationBullet[]
  }>
  projectEntries: Array<{
    entry: import('../src/types/state').Project
    bullets: import('../src/types/state').ProjectBullet[]
  }>
  additionalExperienceEntries: Array<{
    entry: import('../src/types/state').AdditionalExperienceEntry
    bullets: import('../src/types/state').AdditionalExperienceBullet[]
  }>
  certifications: import('../src/types/state').Certification[]
  references: import('../src/types/state').Reference[]
  cacheData: Partial<import('../src/types/state').AppDataState>
}
```

This is the route bundle for [src/pages/ProfilePage/ProfilePage.tsx](../src/pages/ProfilePage/ProfilePage.tsx) and [src/pages/ProfilePage/ProfileChildEditors.tsx](../src/pages/ProfilePage/ProfileChildEditors.tsx).

### Profile Document

The existing selector in [src/features/documents/document-data.ts](../src/features/documents/document-data.ts) is already the right read-model boundary.

```ts
type ProfileDocumentDto = import('../src/features/documents/document-data').ProfileDocumentData
```

This should become the backing read for:

- [src/pages/ResumePage.tsx](../src/pages/ResumePage.tsx)
- [src/pages/CoverLetterPage.tsx](../src/pages/CoverLetterPage.tsx)
- [src/pages/ReferencesPage.tsx](../src/pages/ReferencesPage.tsx)
- [src/pages/CoverLetterResumePage.tsx](../src/pages/CoverLetterResumePage.tsx)

## API Additions

Add focused read methods without removing `getAppData()` yet.

```ts
interface AppDataService {
  getAppData(): Promise<AppDataState>

  getDashboardSummary(): Promise<DashboardSummaryDto>
  getJobsList(): Promise<JobsListDto>
  getJobDetail(jobId: string): Promise<JobDetailDto | null>
  getProfilesList(kind?: 'base' | 'job' | 'all'): Promise<ProfilesListDto>
  getProfileDetail(profileId: string): Promise<ProfileDetailDto | null>
  getProfileDocument(profileId: string): Promise<ProfileDocumentDto | null>
}
```

Mirror those methods in [src/api/app-api-client.ts](../src/api/app-api-client.ts).

The mock backend in [src/api/mock-app-backend.ts](../src/api/mock-app-backend.ts) should implement these first by deriving DTOs from its in-memory data. That gives the app a real contract before a future IndexedDB-backed backend exists.

## Bridge Phase: Preserve Existing Selectors

During migration, keep most existing component selectors working by merging query results into the normalized `state.data` cache.

That bridge lets the app move screen-by-screen instead of rewriting every component at once.

### Selectors to Preserve First

These areas can keep reading `state.data.*` during the bridge:

1. [src/pages/JobsPage.tsx](../src/pages/JobsPage.tsx)
2. [src/pages/ProfilesPage.tsx](../src/pages/ProfilesPage.tsx)
3. [src/pages/JobPage/JobPage.tsx](../src/pages/JobPage/JobPage.tsx)
4. [src/pages/JobPage/JobChildEditors.tsx](../src/pages/JobPage/JobChildEditors.tsx)
5. [src/pages/ProfilePage/ProfilePage.tsx](../src/pages/ProfilePage/ProfilePage.tsx)
6. [src/pages/ProfilePage/ProfileChildEditors.tsx](../src/pages/ProfilePage/ProfileChildEditors.tsx)
7. [src/features/documents/document-data.ts](../src/features/documents/document-data.ts)

### Bridge Mechanism

Add a small set of cache merge actions to the store.

```ts
interface AppStoreActions {
  mergeDataSnapshot(snapshot: Partial<AppDataState>): void
}
```

Rules:

1. Query reads should merge only the entities returned by that query.
2. Queries should not clear unrelated entity maps.
3. Import should still replace the full persisted cache.
4. The old `hydrate()` path should remain only until enough routes are migrated.

This keeps `state.data.jobs[jobId]` and similar selectors working even while the source of truth is gradually moving to query hooks.

The current job-detail and profile-detail implementations use this bridge directly: each query returns a `cacheData` partial snapshot, and the route merges that snapshot into Zustand so existing child editors and document selectors can keep reading normalized entities while the page itself is driven by TanStack Query.

## Query Hook Shape

The initial hook layer should look like this:

```ts
function useDashboardSummaryQuery()
function useJobsListQuery()
function useJobDetailQuery(jobId: string)
function useProfilesListQuery(kind: 'base' | 'job' | 'all')
function useProfileDetailQuery(profileId: string)
function useProfileDocumentQuery(profileId: string)
```

Recommended defaults:

```ts
const DEFAULT_STALE_TIME_MS = 30_000
const DEFAULT_GC_TIME_MS = 5 * 60_000
```

Behavior:

1. If cached data exists, render immediately.
2. If cached data is stale, refetch in the background.
3. If no cached data exists, show route-local loading UI.
4. If a request fails but cached data exists, continue showing stale data with an error notice.

## Route Migration Order

The least disruptive order is:

1. Dashboard
2. Profiles list
3. Jobs list
4. Job detail
5. Profile detail
6. Profile document routes
7. Import/export and any remaining app-wide operations

Reasoning:

- the first three routes need narrow read models
- detail pages need more involved bundles and mutation invalidation
- document routes can reuse the `ProfileDocumentData` boundary once profile loading is stable

## Mutation Invalidation Matrix

Mutations should stop relying on whole-app snapshot replacement once read queries exist.

Recommended invalidation rules:

### Job mutations

- `createJob`, `deleteJob`, `updateJob`: invalidate `['jobs', 'list']`, `['dashboardSummary']`, and `['jobs', 'detail', jobId]` when applicable
- job link, contact, interview, interview-contact, and application-question mutations: invalidate `['jobs', 'detail', jobId]`, `['jobs', 'list']`, and `['dashboardSummary']` if counts or computed status may change
- profile creation from a job flow: also invalidate `['profiles', 'list', { kind: 'job' }]`

### Profile mutations

- `createBaseProfile`, `deleteProfile`, `duplicateProfile`, `updateProfile`: invalidate `['profiles', 'list', { kind: 'all' }]`, `['profiles', 'detail', profileId]`, and `['profiles', 'document', profileId]` when applicable
- profile child entity mutations: invalidate `['profiles', 'detail', profileId]` and `['profiles', 'document', profileId]`
- if the profile is attached to a job, also invalidate `['jobs', 'detail', jobId]`

### Import/export

- import should clear all query caches and rebuild from the imported result
- export does not require invalidation

## Concrete Bridge Implementation

### Phase 1

Add TanStack Query and set up a root `QueryClientProvider` in [src/main.tsx](../src/main.tsx).

### Phase 2

Add focused read methods to the API and mock backend.

### Phase 3

Create route query hooks under a new `src/queries/` folder.

Suggested files:

- `src/queries/query-client.ts`
- `src/queries/query-keys.ts`
- `src/queries/use-dashboard-summary-query.ts`
- `src/queries/use-jobs-list-query.ts`
- `src/queries/use-job-detail-query.ts`
- `src/queries/use-profiles-list-query.ts`
- `src/queries/use-profile-detail-query.ts`
- `src/queries/use-profile-document-query.ts`

### Phase 4

Update the first converted page to read from a query hook instead of `status.hydration` and startup hydration.

### Phase 5

For each converted query, optionally merge the returned DTO into `state.data` so existing child components can continue using current selectors.

### Phase 6

Once the last route no longer depends on global preload, delete the bootstrap hydrate from [src/app/App.tsx](../src/app/App.tsx) and remove `status.hydration` from the store.

## What Not To Do

Avoid these paths during the migration:

1. Do not build a custom stale-query cache in Zustand. That duplicates mature query-library behavior.
2. Do not switch directly from whole-app hydration to table-by-table lazy loading. This app's route needs are graph-shaped, so page bundles are the right first read unit.
3. Do not try to remove the normalized cache immediately. Use it as a compatibility bridge while route hooks are introduced.

## First Implementation Slice

The best first slice is the jobs list route.

Work items:

1. Add `getJobsList()` to the service boundary.
2. Add `useJobsListQuery()`.
3. Convert [src/pages/JobsPage.tsx](../src/pages/JobsPage.tsx) to render from `JobsListDto`.
4. Keep job creation and deletion invalidating `['jobs', 'list']`.
5. Leave [src/pages/JobPage/JobPage.tsx](../src/pages/JobPage/JobPage.tsx) unchanged for the moment.

That slice proves the new contract without forcing detail-page rewrites.
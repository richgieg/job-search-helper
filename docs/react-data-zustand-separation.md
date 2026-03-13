# React Data / Zustand Separation Plan

## Purpose

Define an incremental path for removing persisted app data from React components' direct Zustand usage while keeping `AppUiState` in Zustand.

This document builds on the current page-scoped query work in [page-scoped-data-loading.md](./page-scoped-data-loading.md).

The goal is not just to stop reading `state.data.*` in a few pages. The goal is to make the runtime boundary explicit:

- TanStack Query owns persisted read state and cache lifecycle
- React components consume route- or feature-level read models
- Zustand owns only UI state and UI-oriented actions

## Current State

The app has already moved to query-backed route reads for:

- dashboard summary
- jobs list
- profiles list
- job detail
- profile detail
- profile document routes

But React components still depend on Zustand-owned persisted data in two ways.

### 1. Route Fallbacks Still Read `state.data.*`

These pages still read normalized store data as a fallback or bridge:

- [src/pages/JobPage/JobPage.tsx](../src/pages/JobPage/JobPage.tsx)
- [src/pages/ProfilePage/ProfilePage.tsx](../src/pages/ProfilePage/ProfilePage.tsx)
- [src/pages/ResumePage.tsx](../src/pages/ResumePage.tsx)
- [src/pages/CoverLetterPage.tsx](../src/pages/CoverLetterPage.tsx)
- [src/pages/ReferencesPage.tsx](../src/pages/ReferencesPage.tsx)
- [src/pages/CoverLetterResumePage.tsx](../src/pages/CoverLetterResumePage.tsx)
- [src/pages/ApplicationPage.tsx](../src/pages/ApplicationPage.tsx)

### 2. Editor Subtrees Still Select Normalized Entities From Zustand

The largest remaining coupling lives in:

- [src/pages/JobPage/JobChildEditors.tsx](../src/pages/JobPage/JobChildEditors.tsx)
- [src/pages/ProfilePage/ProfileChildEditors.tsx](../src/pages/ProfilePage/ProfileChildEditors.tsx)

Those files still treat Zustand as the source of persisted entities and reconstruct feature views from normalized maps.

## Target Architecture

The desired runtime split is:

### 1. Query Cache Owns Persisted Reads

TanStack Query should own:

- route-level fetching
- cache reuse and background revalidation
- loading and error state for persisted data
- invalidation after mutation

React components should read persisted data through query hooks and derived editor-model hooks, not through Zustand selectors over `AppDataState`.

### 2. Zustand Owns UI State Only

Zustand should remain responsible for:

- theme preference
- selected ids if they are UI concerns
- panel expansion state
- sort/filter controls that are purely client-side UI state
- dialog state
- non-persisted drafts only when they must outlive a single component subtree

`AppUiState` stays. `AppDataState` leaves.

### 3. Components Consume Feature Models, Not Normalized Maps

React should consume shapes like:

```ts
interface JobEditorModel {
  job: Job
  computedStatus: JobComputedStatus
  relatedProfiles: Profile[]
  jobLinks: JobLink[]
  jobContacts: JobContact[]
  interviews: Array<{
    interview: Interview
    contacts: Array<{
      interviewContact: InterviewContact
      jobContact: JobContact | null
    }>
  }>
  applicationQuestions: ApplicationQuestion[]
}
```

and:

```ts
interface ProfileEditorModel {
  profile: Profile
  attachedJob: Job | null
  profileLinks: ProfileLink[]
  skillCategories: Array<{
    category: SkillCategory
    skills: Skill[]
  }>
  achievements: Achievement[]
  experienceEntries: Array<{
    entry: ExperienceEntry
    bullets: ExperienceBullet[]
  }>
  educationEntries: Array<{
    entry: EducationEntry
    bullets: EducationBullet[]
  }>
  projectEntries: Array<{
    entry: Project
    bullets: ProjectBullet[]
  }>
  additionalExperienceEntries: Array<{
    entry: AdditionalExperienceEntry
    bullets: AdditionalExperienceBullet[]
  }>
  certifications: Certification[]
  references: Reference[]
}
```

The important rule is that React should stop depending on the normalized store shape.

## Design Principles

### React Must Not Know About `AppDataState`

`AppDataState` is a storage/cache shape, not a component contract. New feature code should not accept normalized maps and should not reconstruct screen models inside presentation components.

### Route Pages Own Read Boundaries

Each route should load one focused read model and pass smaller section props downward.

### Mutations Should Not Require Zustand

Persisted data mutations should eventually move into query-based feature hooks rather than living under store actions.

### The Bridge Is Temporary

`mergeDataSnapshot()` and `cacheData` exist to preserve momentum, not as the final architecture.

## Migration Strategy

The safest path is four layers of change.

### Layer 1: Stop Expanding Store-Data Usage

Effective immediately:

1. No new component should read `useAppStore((state) => state.data...)`.
2. No new feature should depend on normalized entity maps in React.
3. New reads should be added as query-backed DTOs or feature-model hooks.

### Layer 2: Introduce Feature Editor Model Hooks

Add focused hooks that adapt route queries into prop-friendly shapes.

Recommended additions:

- [src/features/jobs/use-job-editor-model.ts](../src/features/jobs/use-job-editor-model.ts)
- [src/features/profiles/use-profile-editor-model.ts](../src/features/profiles/use-profile-editor-model.ts)

Responsibilities:

- call the existing route query hook
- produce arrays and grouped structures already sorted for rendering
- hide normalized cache and selector concerns from the component tree
- expose route-friendly loading and error state

The route page becomes the boundary between query data and presentation.

### Layer 3: Convert Child Editors From Store Selectors To Props

This is the highest-value refactor.

#### Job Editor Tree

Refactor [src/pages/JobPage/JobChildEditors.tsx](../src/pages/JobPage/JobChildEditors.tsx) section-by-section.

Suggested extraction order:

1. job links section
2. job contacts section
3. interviews section
4. application questions section
5. related profiles section

For each section:

1. define a prop contract using already-shaped arrays and objects
2. move sorting/filtering/grouping out of the component body
3. remove `useAppStore((state) => state.data...)` selectors from the section

#### Profile Editor Tree

Refactor [src/pages/ProfilePage/ProfileChildEditors.tsx](../src/pages/ProfilePage/ProfileChildEditors.tsx) in the same way.

Suggested extraction order:

1. profile links
2. skills/categories
3. achievements
4. experience
5. education
6. projects
7. additional experience
8. certifications
9. references

The end state is that each section receives explicit data props and mutation callbacks, not store selectors.

### Layer 4: Move Persisted Mutations Out Of The Store

Today, persisted mutations are still routed through [src/store/app-store.ts](../src/store/app-store.ts).

That is a transitional convenience, but not the end state.

Add feature mutation hooks such as:

- [src/features/jobs/use-job-mutations.ts](../src/features/jobs/use-job-mutations.ts)
- [src/features/profiles/use-profile-mutations.ts](../src/features/profiles/use-profile-mutations.ts)

These hooks should:

- call the API client directly
- invalidate the relevant query keys directly
- expose mutation state to components

Once components depend on query hooks plus mutation hooks, Zustand is no longer part of the persisted-data path.

## Concrete Refactor Stages

### Stage 1: Split UI Store From Mixed Store

Create a dedicated UI-only store, likely in:

- [src/store/app-ui-store.ts](../src/store/app-ui-store.ts)

Move or mirror these concerns there first:

- `ui`
- `status` if you still want app-level save/error banners there
- `resetUiState`
- `setThemePreference`
- `selectJob`
- `selectProfile`

Do not move persisted data into the new store.

Initial goal: React code that needs only UI state can stop importing the mixed store.

### Stage 2: Make JobPage Query-Owned

Change [src/pages/JobPage/JobPage.tsx](../src/pages/JobPage/JobPage.tsx) to stop reading:

- cached job fallback from `state.data.jobs`
- interview fallback counts from `state.data.interviews`

Instead:

1. rely on `useJobDetailQuery()` data only
2. shape the editor model in a hook
3. pass all child-editor input through props

At the end of this stage, `JobPage` should not need `mergeDataSnapshot()`.

### Stage 3: Make ProfilePage Query-Owned

Change [src/pages/ProfilePage/ProfilePage.tsx](../src/pages/ProfilePage/ProfilePage.tsx) to stop reading:

- `state.data`
- cached profile fallback
- jobs fallback from normalized store

Instead:

1. rely on `useProfileDetailQuery()` data only
2. derive document preview input from the query payload rather than from `selectProfileDocumentData(state.data, ...)`
3. pass prop-driven section models to `ProfileChildEditors`

At the end of this stage, `ProfilePage` should not need `mergeDataSnapshot()`.

### Stage 4: Remove Document Fallbacks To Zustand Data

Change these pages to rely only on `useProfileDocumentQuery()`:

- [src/pages/ResumePage.tsx](../src/pages/ResumePage.tsx)
- [src/pages/CoverLetterPage.tsx](../src/pages/CoverLetterPage.tsx)
- [src/pages/ReferencesPage.tsx](../src/pages/ReferencesPage.tsx)
- [src/pages/CoverLetterResumePage.tsx](../src/pages/CoverLetterResumePage.tsx)
- [src/pages/ApplicationPage.tsx](../src/pages/ApplicationPage.tsx)

This requires query-backed loading, stale-data, and error behavior to be sufficient on their own.

### Stage 5: Delete Persisted Data From Zustand

Only after route pages and editor trees are query-owned:

1. remove `data` from the store
2. remove `mergeDataSnapshot()`
3. remove persisted mutation actions from the store
4. keep only UI state and UI actions in Zustand

## Query and Mutation Boundary Plan

### Reads

Keep the current query hooks, but add editor-model hooks above them.

Example:

```ts
function useJobEditorModel(jobId: string) {
  const jobDetailQuery = useJobDetailQuery(jobId)

  return {
    isLoading: jobDetailQuery.isLoading,
    error: jobDetailQuery.error,
    model: jobDetailQuery.data
      ? {
          job: jobDetailQuery.data.job,
          computedStatus: jobDetailQuery.data.computedStatus,
          relatedProfiles: jobDetailQuery.data.relatedProfiles,
          jobLinks: jobDetailQuery.data.jobLinks,
          jobContacts: jobDetailQuery.data.jobContacts,
          interviews: jobDetailQuery.data.interviews,
          applicationQuestions: jobDetailQuery.data.applicationQuestions,
        }
      : null,
  }
}
```

The same pattern should be used for profile detail.

### Mutations

Move from store actions to mutation hooks over time.

Example responsibilities for `useJobMutations()`:

- `updateJob`
- `createJobLink`
- `updateJobLink`
- `deleteJobLink`
- `createJobContact`
- `updateJobContact`
- `deleteJobContact`
- `createInterview`
- `updateInterview`
- `deleteInterview`
- `createApplicationQuestion`
- `updateApplicationQuestion`
- `deleteApplicationQuestion`

Each mutation should invalidate only the smallest necessary query families when enough identity information exists.

## Testing Strategy

The test suite should evolve along with the architecture.

### Route Tests

Route-level tests should remain the main integration safety net.

Add coverage for:

- query-owned editor routes with no store-data fallback
- stale-data rendering after failed refresh
- mutation-triggered refetch while a route is mounted

### Component Tests

As sections are extracted from the editor trees, prefer prop-driven component tests over store-backed tests.

That is a useful forcing function: if a component is hard to test without the store, it is probably still too coupled to the store.

### Store Tests

As persisted mutations move out of Zustand, [src/store/app-store.test.ts](../src/store/app-store.test.ts) should shrink and focus on UI-state behavior only.

## Risks

### Risk: Temporary Duplication

For a while, both store actions and mutation hooks may coexist.

That is acceptable if the migration is staged and the old path is deleted as each feature moves.

### Risk: Editor Refactors Become Too Large

The child editor files are large enough that a full rewrite would be high-risk.

Avoid that by extracting one section at a time behind prop contracts.

### Risk: DTO Drift

If route DTOs are too close to the normalized entity model, React will remain coupled to storage shape.

Bias toward feature-shaped arrays and grouped structures instead of raw maps.

## Recommended Next Implementation Step

The best next step is:

1. create a UI-only store module
2. add `useJobEditorModel()`
3. refactor one `JobChildEditors` section to props

That is the smallest meaningful slice that proves the architecture without requiring a full rewrite.
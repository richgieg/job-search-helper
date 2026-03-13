# IndexedDB Migration Plan

## Purpose

Define the target architecture and incremental migration plan for replacing the current in-memory backend with an IndexedDB-backed persistence layer.

This document complements:

- [docs/mvp-plan.md](docs/mvp-plan.md) for product scope
- [docs/state-shape.md](docs/state-shape.md) for the normalized persisted data model
- [docs/state-actions.md](docs/state-actions.md) for domain action semantics

## Current state

Today, the persisted data boundary is represented by `AppDataService` and implemented by `MockAppBackend`.

Current characteristics:

- persisted data is modeled as one normalized `AppDataState`
- `MockAppBackend` keeps that state in memory as a private field
- reads are served from the in-memory snapshot
- mutations apply pure domain logic and then replace the in-memory snapshot
- JSON import/export operates on the full `AppDataState`
- TanStack Query acts as the app-facing async cache

This is a good transitional architecture, but it is not the desired end state for long-lived persistence.

## End goal

The end goal is to make IndexedDB the persisted source of truth while keeping the app-facing service boundary stable.

Desired properties:

1. IndexedDB is the canonical persisted data store.
2. The backend does not keep a long-lived canonical in-memory `AppDataState` snapshot.
3. Reads assemble DTOs from IndexedDB on demand.
4. Mutations use narrow IndexedDB transactions and touch only the stores required by the domain operation.
5. JSON import fully rebuilds persisted data by clearing all object stores and repopulating them from the imported file.
6. TanStack Query remains the UI cache and handles refetching when cached data may be stale.
7. The domain mutation layer remains deterministic and easy to test.

## Non-goals

This migration does not require:

- a server
- multi-user support
- realtime collaboration
- an IndexedDB-specific event bus or cross-tab sync mechanism

For multi-tab correctness, the current plan is to rely on query invalidation and active-query refetch on window refocus rather than introducing a database-coupled notification channel.

## Architectural direction

### Service boundary

`AppDataService` should remain the app-facing contract during the migration.

That means:

- components do not become IndexedDB-aware
- query hooks do not become IndexedDB-aware
- the API client continues delegating to the service boundary

This allows the backend implementation to change without forcing immediate changes across the UI.

### IndexedDB storage model

IndexedDB should store normalized entities directly rather than one giant serialized blob.

Recommended object stores:

- `profiles`
- `profileLinks`
- `skillCategories`
- `skills`
- `achievements`
- `experienceEntries`
- `experienceBullets`
- `educationEntries`
- `educationBullets`
- `projects`
- `projectBullets`
- `additionalExperienceEntries`
- `additionalExperienceBullets`
- `certifications`
- `references`
- `jobs`
- `jobLinks`
- `jobContacts`
- `interviews`
- `interviewContacts`
- `applicationQuestions`
- `metadata`

The `metadata` store can hold data such as persisted schema version if needed.

### Query and read-model responsibility

The backend should continue producing read models such as:

- dashboard summary
- jobs list
- job detail
- profiles list
- profile detail
- profile document
- full export snapshot

Those read models should be assembled from IndexedDB reads, preferably using indexes for foreign-key access patterns.

### Mutation responsibility

Mutations should stop thinking in terms of replacing one whole persisted snapshot.

The final mutation model should:

- read only the records needed to evaluate the domain operation
- run deterministic domain logic
- write only changed records
- delete only records that must be cascade-deleted
- keep parent `updatedAt` timestamps consistent where required

## Import and export behavior

### Export

Export should continue to produce a full versioned `AppExportFile` by reading all stores and assembling one normalized `AppDataState` object.

`exportedAt` should be generated at export time and should not be persisted in IndexedDB metadata.

### Import

Import should be treated as a full logical rebuild of persisted data.

Required behavior:

1. validate the imported payload
2. open one broad readwrite IndexedDB transaction
3. clear every persisted object store
4. repopulate every store from the imported `AppDataState`
5. commit the transaction
6. return the rebuilt snapshot if the service contract still requires it

This should be implemented as a clear-and-rebuild flow, not as a merge.

The app already handles the query-layer side correctly after import:

- reset transient UI state
- invalidate active queries
- remove inactive cached query results

## Multi-tab strategy

The migration should not add a dedicated IndexedDB-coupled cross-tab notification system.

Current decision:

- rely on TanStack Query cache invalidation behavior
- refetch active queries when the window regains focus
- continue invalidating relevant queries after mutations and import operations

Tradeoff:

- this is simpler and less coupled to persistence internals
- it does not provide immediate push-based freshness across tabs
- it is acceptable for the current product scope if refocus behavior is sufficient

If that proves insufficient later, a more explicit cross-tab invalidation mechanism can be added as a separate concern.

## Key migration constraint

The current pure domain mutation functions return full `AppDataState` snapshots.

That is useful for correctness and tests, but it is not the final persistence contract we want for IndexedDB. The migration therefore needs an intermediate step that preserves the existing domain rules while moving the backend toward minimal-store writes.

## Incremental migration plan

### Phase 1: Define IndexedDB schema and helpers

Deliverables:

- a dedicated IndexedDB module
- database open and upgrade logic
- object store creation
- indexes for foreign keys and common list/detail access patterns
- typed helpers for transactions and record operations

Goal:

Create a storage foundation without changing app behavior.

### Phase 2: Add an IndexedDB-backed service implementation

Deliverables:

- `IndexedDbAppBackend` or equivalent implementation of `AppDataService`
- no UI-level API changes
- backend selection still controlled in one place

Goal:

Introduce the new persistence backend behind the existing service interface.

### Phase 3: Move read paths to IndexedDB

Deliverables:

- `getAppData()` from IndexedDB
- `exportAppData()` from IndexedDB
- `getJobsList()` from IndexedDB
- `getJobDetail()` from IndexedDB
- `getProfilesList()` from IndexedDB
- `getProfileDetail()` from IndexedDB
- `getProfileDocument()` from IndexedDB
- `getDashboardSummary()` from IndexedDB

Goal:

Make IndexedDB the source for all reads before changing mutation internals.

Notes:

- assembling a full snapshot on demand is acceptable for export and compatibility flows
- detail and list queries should prefer targeted store access over full snapshot hydration

### Phase 4: Implement full-rebuild import in IndexedDB

Deliverables:

- import validation at the service boundary
- clear-all-stores transaction
- bulk repopulation from imported data
- integration coverage for clear-and-rebuild behavior

Goal:

Satisfy the requirement that importing JSON completely replaces persisted data.

### Phase 5: Add a transitional mutation compatibility layer

Deliverables:

- write paths that still reuse current pure mutation functions
- backend logic that computes which entity collections changed
- IndexedDB writes limited to changed stores instead of rewriting the entire database

Goal:

Get onto IndexedDB without rewriting all mutation semantics at once.

Notes:

- this phase is transitional, not the final design
- the backend may temporarily compare pre-mutation and post-mutation snapshots to determine changed stores
- even in this phase, avoid clearing and rewriting all stores for ordinary mutations

### Phase 6: Introduce patch-oriented mutation planning

Deliverables:

- planner-style mutation results for selected mutation families
- explicit create, update, delete, and reorder operations per entity type
- parity tests that compare planner-driven results against existing snapshot-driven mutations

Goal:

Move from whole-snapshot mutation results to persistence-friendly write plans.

Recommended order:

1. simple single-record create and update operations
2. simple reorder operations
3. child-record create and delete operations
4. cascade delete operations
5. duplicate-profile and other complex fan-out mutations

### Phase 7: Migrate write paths vertically by domain slice

Recommended order:

1. jobs
2. job links and job contacts
3. application questions and interviews
4. profile root operations
5. profile child collections one family at a time
6. profile duplication and large cascade deletes

Goal:

Each migrated slice should have a clear transaction boundary and minimal-store write behavior.

### Phase 8: Remove dependence on a canonical in-memory snapshot

Deliverables:

- no private persisted-state cache in the production backend
- reads served from IndexedDB
- writes committed directly to IndexedDB transactions

Goal:

Finish the move away from the current in-memory backend model.

## What “minimum stores necessary” means

This should be defined per mutation, not with one blanket rule.

Examples:

- update job: touch `jobs`
- update profile: touch `profiles`
- reorder job links: touch `jobLinks`, and `jobs` if the parent `updatedAt` must change
- delete interview: touch `interviews`, `interviewContacts`, and `jobs` if the parent timestamp changes
- delete job: touch `jobs` plus all directly or transitively dependent stores affected by the cascade

The correct rule is:

- touch every store required by domain consistency
- touch no unrelated stores

## Initial implementation recommendation

The first concrete milestone should be:

1. create the IndexedDB schema and helper layer
2. implement all read methods and import/export against IndexedDB
3. keep mutation behavior compatible while introducing narrower write planning
4. then migrate mutation slices one vertical area at a time

This sequence gets persistence in place early, keeps risk manageable, and avoids a large all-at-once rewrite of the domain mutation layer.

## Open design questions

These should be resolved as implementation starts:

1. which indexes are required for each list and detail read model
2. whether any metadata beyond persisted schema version is needed at all
3. whether transitional diffing should happen at the collection level only or at the individual-record level
4. which mutation family should serve as the first patch-oriented pilot

## Success criteria

The migration is complete when:

1. app data survives reloads through IndexedDB
2. import fully clears and rebuilds persisted data
3. reads no longer depend on a canonical in-memory `AppDataState`
4. ordinary mutations write only the stores required by the mutation
5. the app remains compatible with the existing query and API-client architecture
6. multi-tab use is acceptable through query invalidation and refetch-on-focus behavior
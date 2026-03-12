# State Actions

## Purpose

Define the recommended reducer/store actions for the browser-only MVP.

This document describes how application state should change in response to user actions. It complements:

- [docs/mvp-plan.md](docs/mvp-plan.md) for product behavior
- [docs/state-shape.md](docs/state-shape.md) for structure and relationships

## Goals

The action layer should be:

- predictable
- type-safe
- easy to test
- compatible with JSON import/export
- explicit about cascade and duplication behavior

## Recommended approach

Use a small set of explicit domain actions instead of generic patch-style updates.

Good:

- `createJob()`
- `updateProfile()`
- `duplicateProfile()`
- `deleteJob()`
- `importAppData()`

Avoid for core domain behavior:

- `setField(path, value)`
- generic deep mutation helpers as the primary API

## Action design principles

1. Prefer intent-revealing action names.
2. Keep each action responsible for a single domain operation.
3. Validate payloads before mutating state.
4. Enforce relationship rules inside the action layer.
5. Handle cascade deletion and duplication in one place.
6. Recompute derived UI from source data instead of storing it.

## Suggested store shape

The implementation could use a reducer, Zustand store, or another client-side store, but the action surface should remain similar.

```ts
interface AppStore {
  state: AppState;
  actions: AppActions;
}
```

## Shared utility inputs

```ts
type Id = string;
type IsoTimestamp = string;
type IsoDate = string;

interface ActionContext {
  now(): IsoTimestamp;
  createId(): Id;
}
```

## Recommended action groups

- app/import-export actions
- profile actions
- profile child record actions
- job actions
- job child record actions
- job progress actions
- interview actions
- interview-contact actions
- selection and UI actions

## App/import-export actions

### `exportAppData()`

Creates an exportable JSON-safe object from `state.data`.

```ts
interface ExportAppDataResult {
  file: AppExportFile;
}
```

Behavior:

1. Read `state.data`.
2. Stamp `exportedAt`.
3. Return a versioned export object.

### `importAppData(file)`

Replaces the current persisted state with validated imported data.

```ts
interface ImportAppDataInput {
  file: unknown;
}
```

Behavior:

1. Parse and validate the import payload.
2. Validate relationships and foreign keys.
3. Replace `state.data` completely.
4. Reset `state.ui` to safe defaults.

Important:

- import overwrites current in-memory state
- no merge behavior in MVP

### `resetAppUiState()`

Resets transient UI state without changing persisted data.

## Profile actions

### `createBaseProfile(input)`

Creates a new base profile.

```ts
interface CreateBaseProfileInput {
  name: string;
  summary?: string;
  coverLetter?: string;
  personalDetails?: Partial<PersonalDetails>;
}
```

Behavior:

- create a `Profile` with `jobId = null`
- set `clonedFromProfileId = null`
- initialize default `resumeSettings.sections` values
- initialize missing nested objects with defaults
- stamp `createdAt` and `updatedAt`

### `updateProfile(input)`

Updates editable fields on a profile.

```ts
interface UpdateProfileInput {
  profileId: Id;
  changes: Partial<Pick<Profile, 'name' | 'summary' | 'coverLetter'>>;
  personalDetails?: Partial<PersonalDetails>;
}
```

Behavior:

- require an existing profile
- apply validated changes
- update `updatedAt`

### Resume settings actions

Resume settings should be updated through explicit actions rather than bundled into generic profile field updates.

### `setResumeSectionEnabled(input)`

Enables or disables a single resume section for a profile.

```ts
interface SetResumeSectionEnabledInput {
  profileId: Id;
  section: ResumeSectionKey;
  enabled: boolean;
}
```

Behavior:

- require an existing profile
- require a valid `ResumeSectionKey`
- update `profile.resumeSettings.sections[section].enabled`
- update `updatedAt`

### `setResumeSectionLabel(input)`

Updates the displayed label for a single resume section for a profile.

```ts
interface SetResumeSectionLabelInput {
  profileId: Id;
  section: ResumeSectionKey;
  label: string;
}
```

Behavior:

- require an existing profile
- require a valid `ResumeSectionKey`
- trim the provided label
- if the trimmed value is empty, fall back to the default label for that section
- update `profile.resumeSettings.sections[section].label`
- update `updatedAt`

### `reorderResumeSections(input)`

Reorders resume sections for a profile.

```ts
interface ReorderResumeSectionsInput {
  profileId: Id;
  orderedSections: ResumeSectionKey[];
}
```

Behavior:

- require an existing profile
- require every `ResumeSectionKey` exactly once in `orderedSections`
- rewrite each section's `sortOrder`
- preserve each section's existing `enabled` flag and `label`
- update `updatedAt`

### `duplicateProfile(input)`

Duplicates either a base profile or a job profile.

```ts
interface DuplicateProfileInput {
  sourceProfileId: Id;
  targetJobId?: Id | null;
  name?: string;
}
```

Behavior:

1. Find source profile.
2. Create a new profile.
3. Set:
   - `clonedFromProfileId = sourceProfileId`
   - `jobId = targetJobId ?? sourceProfile.jobId`
4. Duplicate all profile-owned child records.
5. Preserve enabled flags and sort order.
6. Refresh timestamps.

Notes:

- duplicating a base profile into a job profile sets `targetJobId` to that job id
- duplicating a base profile into another base profile uses `targetJobId = null`
- duplicating a job profile into another job profile may target the same job or a different job
- duplicating a profile should also duplicate its `resumeSettings`
- duplicated resume settings should preserve section labels
- duplicating a profile should also duplicate its `Achievement` records
- duplicating a profile should also duplicate its `Project` and `ProjectBullet` records
- duplicating a profile should also duplicate its `AdditionalExperienceEntry` and `AdditionalExperienceBullet` records

### `deleteProfile(input)`

Hard deletes a profile with cascade behavior.

```ts
interface DeleteProfileInput {
  profileId: Id;
}
```

Behavior:

1. Delete all child records owned by the profile.
2. Delete the profile.
3. For any remaining profiles whose `clonedFromProfileId` points to the deleted profile, set `clonedFromProfileId = null`.
4. Clear related UI selection if needed.

## Profile child record actions

These actions should all:

- validate parent existence
- create ids through shared utilities
- update parent `Profile.updatedAt`
- preserve normalized state shape

### Skill category actions

- `createSkillCategory(input)`
- `updateSkillCategory(input)`
- `deleteSkillCategory(input)`
- `reorderSkillCategories(input)`

`deleteSkillCategory()` must also delete all child `Skill` records for that category.

### Skill actions

- `createSkill(input)`
- `updateSkill(input)`
- `deleteSkill(input)`
- `reorderSkills(input)`

### Achievement actions

- `createAchievement(input)`
- `updateAchievement(input)`
- `deleteAchievement(input)`
- `reorderAchievements(input)`

These actions should:

- support enable/disable behavior through the record's `enabled` field
- preserve explicit per-profile ordering through `sortOrder`

### Experience actions

- `createExperienceEntry(input)`
- `updateExperienceEntry(input)`
- `deleteExperienceEntry(input)`
- `reorderExperienceEntries(input)`

These actions should:

- clear `endDate` whenever `isCurrent` is set to `true`
- reject or ignore attempts to set `endDate` while `isCurrent` is `true`

`deleteExperienceEntry()` must also delete all child `ExperienceBullet` records for that experience entry.

### Experience bullet actions

- `createExperienceBullet(input)`
- `updateExperienceBullet(input)`
- `deleteExperienceBullet(input)`
- `reorderExperienceBullets(input)`

### Education actions

- `createEducationEntry(input)`
- `updateEducationEntry(input)`
- `deleteEducationEntry(input)`
- `reorderEducationEntries(input)`

These actions should:

- initialize or preserve `degree` as the primary first-line education label
- store `startDate`, `endDate`, and `status` instead of a single graduation date
- clear `endDate` whenever `status` is set to `in_progress`
- reject or ignore invalid date ranges where both `startDate` and `endDate` are present and `startDate > endDate`
- treat `endDate` as a completion date when `status === 'graduated'`
- treat `endDate` as a last-attended date when `status === 'attended'`

`deleteEducationEntry()` must also delete all child `EducationBullet` records for that education entry.

### Education bullet actions

- `createEducationBullet(input)`
- `updateEducationBullet(input)`
- `deleteEducationBullet(input)`
- `reorderEducationBullets(input)`

### Project actions

- `createProject(input)`
- `updateProject(input)`
- `deleteProject(input)`
- `reorderProjects(input)`

These actions should:

- support enable/disable behavior through the record's `enabled` field
- allow `organization` to be blank for personal or unaffiliated projects
- store `startDate` and `endDate` as nullable date fields
- reject or ignore invalid date ranges where both `startDate` and `endDate` are present and `startDate > endDate`

`deleteProject()` must also delete all child `ProjectBullet` records for that project.

### Project bullet actions

- `createProjectBullet(input)`
- `updateProjectBullet(input)`
- `deleteProjectBullet(input)`
- `reorderProjectBullets(input)`

### Additional experience actions

- `createAdditionalExperienceEntry(input)`
- `updateAdditionalExperienceEntry(input)`
- `deleteAdditionalExperienceEntry(input)`
- `reorderAdditionalExperienceEntries(input)`

These actions should:

- support enable/disable behavior through the record's `enabled` field
- allow `organization` to be blank for more general or relabeled section use cases
- store `startDate` and `endDate` as nullable date fields
- reject or ignore invalid date ranges where both `startDate` and `endDate` are present and `startDate > endDate`

`deleteAdditionalExperienceEntry()` must also delete all child `AdditionalExperienceBullet` records for that entry.

### Additional experience bullet actions

- `createAdditionalExperienceBullet(input)`
- `updateAdditionalExperienceBullet(input)`
- `deleteAdditionalExperienceBullet(input)`
- `reorderAdditionalExperienceBullets(input)`

### Certification actions

- `createCertification(input)`
- `updateCertification(input)`
- `deleteCertification(input)`
- `reorderCertifications(input)`

### Reference actions

- `createReference(input)`
- `updateReference(input)`
- `deleteReference(input)`
- `reorderReferences(input)`

### Profile link actions

- `createProfileLink(input)`
- `updateProfileLink(input)`
- `deleteProfileLink(input)`
- `reorderProfileLinks(input)`

### Common child action shape

A typical create action could look like:

```ts
interface CreateChildRecordInput<ParentId, Values> {
  parentId: ParentId;
  values: Values;
}
```

And a reorder action could look like:

```ts
interface ReorderEntitiesInput {
  orderedIds: Id[];
}
```

## Job actions

### `createJob(input)`

Creates a new job without automatically creating a profile.

```ts
interface CreateJobInput {
  companyName: string;
  jobTitle: string;
  description?: string;
  location?: string;
  postedCompensation?: string;
  desiredCompensation?: string;
  compensationNotes?: string;
  workArrangement?: WorkArrangement;
  employmentType?: EmploymentType;
  datePosted?: IsoDate | null;
  notes?: string;
}
```

Behavior:

- create the job
- initialize `appliedAt = null`
- initialize `finalOutcome = null`
- stamp timestamps
- do not create a profile automatically

### `updateJob(input)`

Updates editable job fields.

This action should update only core editable `Job` fields such as company, title, description, compensation, location, and notes.

It should not be responsible for updating `appliedAt` or `finalOutcome`.

### `deleteJob(input)`

Hard deletes a job with full cascade behavior.

```ts
interface DeleteJobInput {
  jobId: Id;
}
```

Behavior:

1. Find all job profiles where `profile.jobId === jobId`.
2. Delete each job profile using `deleteProfile()`.
3. Delete all `JobLink`, `JobContact`, `Interview`, `InterviewContact`, and `ApplicationQuestion` records for the job.
4. Delete the job.
5. Clear related UI selection if needed.

## Job link actions

- `createJobLink(input)`
- `updateJobLink(input)`
- `deleteJobLink(input)`
- `reorderJobLinks(input)`

## Job contact actions

- `createJobContact(input)`
- `updateJobContact(input)`
- `deleteJobContact(input)`
- `reorderJobContacts(input)`

`deleteJobContact()` must also delete any `InterviewContact` association records that point to that job contact.

## Job progress actions

### `setJobAppliedAt(input)`

Sets or updates the timestamp indicating when the user applied to a job.

```ts
interface SetJobAppliedAtInput {
  jobId: Id;
  appliedAt: IsoTimestamp;
}
```

Behavior:

- require an existing job
- validate `appliedAt`
- set `Job.appliedAt`
- update `Job.updatedAt`

### `clearJobAppliedAt(input)`

Clears the application timestamp for a job.

```ts
interface ClearJobAppliedAtInput {
  jobId: Id;
}
```

Behavior:

- require an existing job
- set `Job.appliedAt = null`
- update `Job.updatedAt`

### `setJobFinalOutcome(input)`

Sets the final outcome for a job.

```ts
interface SetJobFinalOutcomeInput {
  jobId: Id;
  status: FinalOutcomeStatus;
  setAt: IsoTimestamp;
}
```

Behavior:

- require an existing job
- validate `status`
- validate `setAt`
- set `Job.finalOutcome = { status, setAt }`
- update `Job.updatedAt`

### `clearJobFinalOutcome(input)`

Clears the final outcome for a job.

```ts
interface ClearJobFinalOutcomeInput {
  jobId: Id;
}
```

Behavior:

- require an existing job
- set `Job.finalOutcome = null`
- update `Job.updatedAt`

## Interview actions

- `createInterview(input)`
- `updateInterview(input)`
- `deleteInterview(input)`

These actions should:

- require an existing job
- allow `startAt = null`
- update `Job.updatedAt`

`deleteInterview()` must also delete all child `InterviewContact` records for that interview.

Interviews should not support manual reordering in the MVP. Display order should be derived from `startAt` ascending.

## Interview-contact actions

- `addInterviewContact(input)`
- `removeInterviewContact(input)`
- `reorderInterviewContacts(input)`

These actions should:

- require an existing `Interview`
- require an existing `JobContact`
- require the `Interview.jobId` and `JobContact.jobId` to match
- prevent duplicate interview-contact associations for the same interview and contact
- maintain unique sequential `sortOrder` values where ordering applies
- update `Job.updatedAt`

## Application question actions

- `createApplicationQuestion(input)`
- `updateApplicationQuestion(input)`
- `deleteApplicationQuestion(input)`
- `reorderApplicationQuestions(input)`

These actions should:

- require an existing job
- maintain `sortOrder`
- update `Job.updatedAt`
- preserve the question/answer text exactly as entered by the user

## UI actions

These actions should mutate only `state.ui`.

- `selectJob(jobId)`
- `selectProfile(profileId)`
- `setJobsListSearchText(value)`
- `setJobsListStatusFilter(value)`
- `setJobsListSort(input)`
- `setProfilesListSearchText(value)`
- `setProfilesListKindFilter(value)`
- `setProfilesListSort(input)`
- `openDialog(name)`
- `closeDialog(name)`

UI actions are not exported in JSON.

## Validation responsibilities

Each action should validate:

- target entity existence
- foreign-key validity
- enum values
- required fields
- basic shape constraints

Profile link actions should additionally validate:

- non-empty `name`
- valid `url` shape
- boolean `enabled`
- unique ordered ids during reordering

Resume settings actions should additionally validate:

- valid `ResumeSectionKey` values
- uniqueness and completeness of section keys during reordering
- unique `sortOrder` values after reordering

Import validation should additionally verify:

- all ids are unique within each entity collection
- referenced entities exist
- no dangling relationships remain
- every profile has a complete and valid `resumeSettings.sections` object
- every `InterviewContact` references an existing `Interview` and `JobContact`
- every `InterviewContact` connects records belonging to the same job

## Timestamp rules

Recommended timestamp rules:

- new records set both `createdAt` and `updatedAt`
- updates change `updatedAt`
- child record changes should also update parent `Profile.updatedAt` or `Job.updatedAt` where appropriate
- resume settings changes should update `Profile.updatedAt`
- import preserves timestamps from imported data

## Derived data rules

Actions should not store computed status directly on `Job`.

Instead:

- write `Job.appliedAt`, `Job.finalOutcome`, and `Interview` records
- derive current job status through selectors

Actions also should not persist generated outputs.

Instead:

- generate resume, cover letter, and application page views on demand from current state
- generate resume sections in the profile's configured visible order from `resumeSettings.sections`
- generate profile link output from enabled profile links in `sortOrder`

## Suggested implementation order

1. `createBaseProfile()`
2. `updateProfile()`
3. `setResumeSectionEnabled()`
4. `reorderResumeSections()`
5. `createJob()`
6. `updateJob()`
7. child CRUD for profile records
8. `duplicateProfile()`
9. job contact, job link, and application question actions
10. job progress actions
11. interview and interview-contact actions
12. `deleteProfile()`
13. `deleteJob()`
14. `exportAppData()`
15. `importAppData()`

## Testing recommendations

Each action should have focused tests.

High-priority tests:

- duplicate profile copies all child records with new ids
- duplicate profile copies `resumeSettings`
- deleting a profile cascades child deletion
- deleting a profile clears descendant `clonedFromProfileId`
- toggling profile link visibility updates the correct record and parent `Profile.updatedAt`
- reordering profile links produces unique sequential `sortOrder` values
- previews and generated outputs exclude disabled profile links
- resume section visibility toggles update the correct section only
- resume section reordering produces unique sequential `sortOrder` values
- deleting a job deletes attached job profiles and job-owned records
- setting and clearing `appliedAt` updates the correct job and timestamp
- setting and clearing `finalOutcome` updates the correct job and timestamp
- creating or updating an interview allows `startAt` to be unset
- deleting an interview deletes its `InterviewContact` associations
- interview-contact associations reject cross-job links
- reordering interview contacts produces unique sequential `sortOrder` values
- importing valid JSON replaces state
- importing invalid JSON is rejected without mutating state
- duplicating a profile copies projects and project bullets with new ids and preserved ordering
- deleting a project cascades to its project bullets
- computed status changes correctly as `appliedAt`, interviews, and `finalOutcome` change

## Recommended next step

Use this document to define:

1. exact action TypeScript signatures
2. reducers or store methods
3. import/export validators
4. unit tests for mutation behavior

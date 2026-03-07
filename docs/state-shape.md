# State Shape

## Purpose

Define the recommended in-memory TypeScript state shape for the browser-only MVP.

This document turns the higher-level model in [docs/mvp-plan.md](docs/mvp-plan.md) into a concrete state structure that is:

- easy to edit in React
- easy to serialize to JSON
- easy to validate on import
- strongly typed

## Design principles

1. Keep all persisted domain data in a single serializable object.
2. Normalize entities by `id` to avoid deep nested updates.
3. Use foreign keys plus `sort_order` to express relationships and ordering.
4. Store only source-of-truth data; compute derived values such as job status.
5. Keep transient UI state separate from exported/imported data.
6. Prefer typed nested objects over raw `*_json` blobs in application code.

## Recommended split

Use two top-level state buckets in the app runtime:

- `data`: persisted domain state that is exported/imported
- `ui`: transient browser state that should not be exported

## Type aliases

```ts
type Id = string;
type IsoTimestamp = string; // 2026-03-06T12:34:56.000Z
type IsoDate = string; // 2026-03-06
```

## Root state

```ts
interface AppState {
  data: AppDataState;
  ui: AppUiState;
}

interface AppDataState {
  version: 1;
  exportedAt?: IsoTimestamp;
  profiles: Record<Id, Profile>;
  skillCategories: Record<Id, SkillCategory>;
  skills: Record<Id, Skill>;
  experienceEntries: Record<Id, ExperienceEntry>;
  experienceBullets: Record<Id, ExperienceBullet>;
  educationEntries: Record<Id, EducationEntry>;
  certifications: Record<Id, Certification>;
  references: Record<Id, Reference>;
  jobs: Record<Id, Job>;
  jobPostingSources: Record<Id, JobPostingSource>;
  jobContacts: Record<Id, JobContact>;
  jobEvents: Record<Id, JobEvent>;
}

interface AppUiState {
  selectedJobId: Id | null;
  selectedProfileId: Id | null;
  jobsList: JobsListUiState;
  profilesList: ProfilesListUiState;
  dialogs: DialogUiState;
}

interface JobsListUiState {
  searchText: string;
  statusFilter: JobStatusFilter | null;
  sortBy: 'updated_at' | 'created_at' | 'company_name' | 'job_title';
  sortDirection: 'asc' | 'desc';
}

interface ProfilesListUiState {
  searchText: string;
  kindFilter: 'base' | 'job' | null;
  sortBy: 'updated_at' | 'created_at' | 'name';
  sortDirection: 'asc' | 'desc';
}

interface DialogUiState {
  importExportOpen: boolean;
  duplicateProfileOpen: boolean;
  createJobProfileOpen: boolean;
}
```

## Export/import file shape

The exported JSON file should contain `AppDataState`, not `AppUiState`.

```ts
interface AppExportFile {
  version: 1;
  exportedAt: IsoTimestamp;
  data: Omit<AppDataState, 'version' | 'exportedAt'>;
}
```

Recommended import behavior:

1. Parse JSON.
2. Validate `version`.
3. Validate entity shapes and foreign-key relationships.
4. Replace `state.data` completely.
5. Reset or reinitialize `state.ui`.

## Enums and unions

```ts
type WorkArrangement = 'onsite' | 'hybrid' | 'remote' | 'unknown';

type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'
  | 'other';

type JobPostingSourceType =
  | 'linkedin'
  | 'workday'
  | 'greenhouse'
  | 'indeed'
  | 'company_site'
  | 'other';

type ContactRelationshipType =
  | 'recruiter'
  | 'hiring_manager'
  | 'referral'
  | 'interviewer'
  | 'other';

type ReferenceType = 'professional' | 'personal';

type JobEventType =
  | 'job_saved'
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected'
  | 'withdrew';

type JobComputedStatus =
  | 'interested'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrew';

type JobStatusFilter = JobComputedStatus | 'all';
```

## Core entity types

### Profile

`Profile` is used for both base profiles and job profiles.

- Base profile: `jobId === null`
- Job profile: `jobId !== null`
- Duplicated profile lineage: `clonedFromProfileId`

```ts
interface Profile {
  id: Id;
  name: string;
  summary: string;
  coverLetter: string;
  personalDetails: PersonalDetails;
  links: ProfileLinks;
  jobId: Id | null;
  clonedFromProfileId: Id | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

interface PersonalDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  state: string;
  postalCode: string;
}

interface ProfileLinks {
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
}
```

### SkillCategory

```ts
interface SkillCategory {
  id: Id;
  profileId: Id;
  name: string;
  enabled: boolean;
  sortOrder: number;
}
```

### Skill

```ts
interface Skill {
  id: Id;
  skillCategoryId: Id;
  name: string;
  enabled: boolean;
  sortOrder: number;
}
```

### ExperienceEntry

```ts
interface ExperienceEntry {
  id: Id;
  profileId: Id;
  company: string;
  title: string;
  location: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  isCurrent: boolean;
  reasonForLeavingShort: string;
  reasonForLeavingDetails: string;
  supervisor: ExperienceSupervisor;
  enabled: boolean;
  sortOrder: number;
}

interface ExperienceBullet {
  id: Id;
  experienceEntryId: Id;
  content: string;
  enabled: boolean;
  sortOrder: number;
}

interface ExperienceSupervisor {
  name: string;
  title: string;
  phone: string;
  email: string;
}
```

### EducationEntry

```ts
interface EducationEntry {
  id: Id;
  profileId: Id;
  school: string;
  degree: string;
  graduationDate: IsoDate | null;
  enabled: boolean;
  sortOrder: number;
}
```

### Certification

```ts
interface Certification {
  id: Id;
  profileId: Id;
  name: string;
  issuer: string;
  issueDate: IsoDate | null;
  expiryDate: IsoDate | null;
  credentialId: string;
  credentialUrl: string;
  enabled: boolean;
  sortOrder: number;
}
```

### Reference

```ts
interface Reference {
  id: Id;
  profileId: Id;
  type: ReferenceType;
  name: string;
  relationship: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  notes: string;
  enabled: boolean;
  sortOrder: number;
}
```

### Job

```ts
interface Job {
  id: Id;
  companyName: string;
  jobTitle: string;
  description: string;
  location: string;
  postedCompensation: string;
  desiredCompensation: string;
  compensationNotes: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  datePosted: IsoDate | null;
  notes: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
```

### JobPostingSource

```ts
interface JobPostingSource {
  id: Id;
  jobId: Id;
  sourceType: JobPostingSourceType;
  url: string;
  label: string;
  sortOrder: number;
  createdAt: IsoTimestamp;
}
```

### JobContact

```ts
interface JobContact {
  id: Id;
  jobId: Id;
  name: string;
  title: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  relationshipType: ContactRelationshipType;
  notes: string;
  sortOrder: number;
}
```

### JobEvent

```ts
interface JobEvent {
  id: Id;
  jobId: Id;
  eventType: JobEventType;
  occurredAt: IsoTimestamp | null;
  scheduledFor: IsoTimestamp | null;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
```

## Relationship rules

The following relationships should be enforced during normal app operations and import validation.

### Profile relationships

- `Profile.jobId` is either `null` or points to an existing `Job`.
- `Profile.clonedFromProfileId` is either `null` or points to an existing `Profile`.
- If `Profile.jobId === null`, the profile is a base profile.
- If `Profile.jobId !== null`, the profile is a job profile.

### Child entity relationships

- `SkillCategory.profileId` points to an existing `Profile`.
- `Skill.skillCategoryId` points to an existing `SkillCategory`.
- `ExperienceEntry.profileId` points to an existing `Profile`.
- `ExperienceBullet.experienceEntryId` points to an existing `ExperienceEntry`.
- `EducationEntry.profileId` points to an existing `Profile`.
- `Certification.profileId` points to an existing `Profile`.
- `Reference.profileId` points to an existing `Profile`.

### Job relationships

- `JobPostingSource.jobId` points to an existing `Job`.
- `JobContact.jobId` points to an existing `Job`.
- `JobEvent.jobId` points to an existing `Job`.

## Duplication rules

When duplicating a profile, create a new `Profile` and duplicate all profile-owned child records:

- `SkillCategory`
- `Skill`
- `ExperienceEntry`
- `ExperienceBullet`
- `EducationEntry`
- `Certification`
- `Reference`

Rules:

1. The new profile gets a new `id`.
2. The new profile keeps a pointer to the source profile in `clonedFromProfileId`.
3. All duplicated child records get new ids.
4. All duplicated child records point to the new profile or newly duplicated parent records.
5. `createdAt` and `updatedAt` should be refreshed for the new records.

Additional duplication rule for experience bullets:

- when duplicating an `ExperienceEntry`, duplicate all of its `ExperienceBullet` records and re-point them to the new experience entry

## Deletion rules

For the MVP, prefer hard deletion rather than soft deletion or archiving.

Reasons:

- the app is single-user and browser-only
- persistence is handled through JSON export/import
- hard deletion keeps the state model simpler

Deletion should still be explicit and safe. The app should use confirmation dialogs and clearly explain cascade effects before applying destructive actions.

### Profile deletion

Deleting a profile should permanently remove that `Profile` and all profile-owned child records.

Cascade delete these records:

- `SkillCategory`
- `Skill`
- `ExperienceEntry`
- `ExperienceBullet`
- `EducationEntry`
- `Certification`
- `Reference`

Rules:

1. Deleting a base profile does not delete any jobs.
2. Deleting a job profile does not delete its parent job.
3. Deleting a profile does not automatically delete profiles that were cloned from it.
4. If other profiles have `clonedFromProfileId` pointing to the deleted profile, set their `clonedFromProfileId` to `null`.

This keeps surviving duplicated profiles valid even if their source profile is removed.

### Job deletion

Deleting a job should permanently remove the `Job` and all job-owned records.

Cascade delete these records:

- job profiles where `Profile.jobId === job.id`
- all profile-owned child records of those job profiles
- `JobPostingSource`
- `JobContact`
- `JobEvent`

Rules:

1. Find all job profiles attached to the job.
2. Delete each job profile using the normal profile deletion rules.
3. Delete all job-owned posting sources, contacts, and events.
4. Delete the job last.

### Child record deletion

The following records can be hard deleted directly:

- `ExperienceEntry`
- `ExperienceBullet`
- `EducationEntry`
- `Certification`
- `Reference`
- `JobPostingSource`
- `JobContact`
- `JobEvent`

Additional rule:

- deleting a `SkillCategory` should also delete all `Skill` records that belong to that category
- deleting an `ExperienceEntry` should also delete all `ExperienceBullet` records that belong to that entry

### Generated outputs and deletion

Generated outputs are derived from current state and should not be persisted separately in the MVP.

Implication:

- once a source profile, job, contact, or related record is deleted, any preview depending on it can no longer be generated

### Recommended deletion UX

The UI should require confirmation before deleting:

- a `Job`
- a `Profile`

Confirmation dialogs should summarize cascade impact.

Examples:

- deleting a job removes its job profiles, posting sources, contacts, and events
- deleting a profile removes its skill categories, skills, experience entries, education entries, certifications, and references

Recommended improvement for the MVP:

- show dependency counts in the confirmation message before deletion is confirmed

Example:

> Delete profile? This will also remove 3 skill categories, 12 skills, 4 experience entries, 2 education entries, 1 certification, and 3 references.

## Derived selectors

These values should be computed, not stored.

### Profile selectors

- `getBaseProfiles()`
- `getJobProfiles(jobId)`
- `getProfileKind(profile)`
- `getOrderedSkillCategories(profileId)`
- `getOrderedSkills(skillCategoryId)`
- `getOrderedExperienceEntries(profileId)`
- `getOrderedExperienceBullets(experienceEntryId)`
- `getOrderedEducationEntries(profileId)`
- `getOrderedCertifications(profileId)`
- `getOrderedReferences(profileId)`

### Job selectors

- `getJobPostingSources(jobId)`
- `getOrderedJobContacts(jobId)`
- `getJobEvents(jobId)`
- `getCurrentJobStatus(jobId)`
- `getMostRecentJobEvent(jobId)`

### Status computation

Recommended precedence for computed status:

1. `withdrew`
2. `rejected`
3. `offer_received`
4. `interview_scheduled` or `interview_completed`
5. `applied`
6. otherwise `interested`

## Notes on naming

The MVP plan used names like `personal_details_json`, `links_json`, and `metadata_json` to communicate structured data.

In TypeScript application state, prefer typed objects and arrays instead:

- `personalDetails` instead of `personal_details_json`
- `links` instead of `links_json`
- `ExperienceBullet.content` instead of embedding `bullets_json` on `ExperienceEntry`
- `metadata: Record<string, unknown>` instead of `metadata_json`

This provides stronger type-safety and simpler component code.

## Recommended next step

Use this document to define:

1. exact TypeScript types in the app
2. import/export validation rules
3. reducer or store actions for CRUD, duplication, and event updates

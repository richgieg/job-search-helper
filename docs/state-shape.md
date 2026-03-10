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
3. Use foreign keys plus explicit ordering fields where needed to express relationships and ordering.
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
  profileLinks: Record<Id, ProfileLink>;
  skillCategories: Record<Id, SkillCategory>;
  skills: Record<Id, Skill>;
  experienceEntries: Record<Id, ExperienceEntry>;
  experienceBullets: Record<Id, ExperienceBullet>;
  educationEntries: Record<Id, EducationEntry>;
  certifications: Record<Id, Certification>;
  references: Record<Id, Reference>;
  jobs: Record<Id, Job>;
  jobLinks: Record<Id, JobLink>;
  jobContacts: Record<Id, JobContact>;
  interviews: Record<Id, Interview>;
  interviewContacts: Record<Id, InterviewContact>;
  applicationQuestions: Record<Id, ApplicationQuestion>;
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

type ContactRelationshipType =
  | 'recruiter'
  | 'hiring_manager'
  | 'referral'
  | 'interviewer'
  | 'other';

type ReferenceType = 'professional' | 'personal';

type FinalOutcomeStatus =
  | 'withdrew'
  | 'rejected'
  | 'offer_received'
  | 'offer_accepted';

type JobComputedStatus =
  | 'interested'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrew';

type JobStatusFilter = JobComputedStatus | 'all';

type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'references';
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
  resumeSettings: ResumeSettings;
  personalDetails: PersonalDetails;
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

interface ResumeSettings {
  sections: Record<ResumeSectionKey, ResumeSectionSettings>;
}

interface ResumeSectionSettings {
  enabled: boolean;
  sortOrder: number;
}
```

### ProfileLink

```ts
interface ProfileLink {
  id: Id;
  profileId: Id;
  name: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
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

If `ExperienceEntry.isCurrent === true`, then `endDate` must be `null`.

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
  appliedAt: IsoTimestamp | null;
  finalOutcome: FinalOutcome | null;
  notes: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

interface FinalOutcome {
  status: FinalOutcomeStatus;
  setAt: IsoTimestamp;
}
```

### JobLink

```ts
interface JobLink {
  id: Id;
  jobId: Id;
  url: string;
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

### Interview

```ts
interface Interview {
  id: Id;
  jobId: Id;
  startAt: IsoTimestamp | null;
  notes: string;
}
```

`Interview` records should be displayed sorted by `startAt` ascending.

### InterviewContact

```ts
interface InterviewContact {
  id: Id;
  interviewId: Id;
  jobContactId: Id;
  sortOrder: number;
}
```

### ApplicationQuestion

```ts
interface ApplicationQuestion {
  id: Id;
  jobId: Id;
  question: string;
  answer: string;
  sortOrder: number;
}
```

## Relationship rules

The following relationships should be enforced during normal app operations and import validation.

### Profile relationships

- `Profile.jobId` is either `null` or points to an existing `Job`.
- `Profile.clonedFromProfileId` is either `null` or points to an existing `Profile`.
- `Profile.resumeSettings.sections` contains exactly one settings object for each `ResumeSectionKey`.
- If `Profile.jobId === null`, the profile is a base profile.
- If `Profile.jobId !== null`, the profile is a job profile.

### Child entity relationships

- `ProfileLink.profileId` points to an existing `Profile`.
- `SkillCategory.profileId` points to an existing `Profile`.
- `Skill.skillCategoryId` points to an existing `SkillCategory`.
- `ExperienceEntry.profileId` points to an existing `Profile`.
- If `ExperienceEntry.isCurrent === true`, then `ExperienceEntry.endDate` must be `null`.
- `ExperienceBullet.experienceEntryId` points to an existing `ExperienceEntry`.
- `EducationEntry.profileId` points to an existing `Profile`.
- `Certification.profileId` points to an existing `Profile`.
- `Reference.profileId` points to an existing `Profile`.

### Job relationships

- `JobLink.jobId` points to an existing `Job`.
- `JobContact.jobId` points to an existing `Job`.
- `Interview.jobId` points to an existing `Job`.
- `InterviewContact.interviewId` points to an existing `Interview`.
- `InterviewContact.jobContactId` points to an existing `JobContact`.
- `ApplicationQuestion.jobId` points to an existing `Job`.
- `Job.appliedAt` is either `null` or a valid `IsoTimestamp`.
- `Job.finalOutcome` is either `null` or an object containing a valid `FinalOutcomeStatus` and `setAt` timestamp.

## Duplication rules

When duplicating a profile, create a new `Profile` and duplicate all profile-owned child records:

- `ProfileLink`
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

- `ProfileLink`
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
- `JobLink`
- `JobContact`
- `Interview`
- `InterviewContact`
- `ApplicationQuestion`

Rules:

1. Find all job profiles attached to the job.
2. Delete each job profile using the normal profile deletion rules.
3. Delete all job-owned links, contacts, interviews, interview-contact associations, and application questions.
4. Delete the job last.

### Child record deletion

The following records can be hard deleted directly:

- `ProfileLink`
- `ExperienceEntry`
- `ExperienceBullet`
- `EducationEntry`
- `Certification`
- `Reference`
- `JobLink`
- `JobContact`
- `Interview`
- `InterviewContact`
- `ApplicationQuestion`

Additional rule:

- deleting a `SkillCategory` should also delete all `Skill` records that belong to that category
- deleting an `ExperienceEntry` should also delete all `ExperienceBullet` records that belong to that entry
- deleting an `Interview` should also delete all `InterviewContact` records that belong to that interview

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

- deleting a job removes its job profiles, links, contacts, interviews, and interview-contact associations
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
- `getOrderedProfileLinks(profileId)`
- `getOrderedResumeSections(profileId)`
- `getOrderedSkillCategories(profileId)`
- `getOrderedSkills(skillCategoryId)`
- `getOrderedExperienceEntries(profileId)`
- `getOrderedExperienceBullets(experienceEntryId)`
- `getOrderedEducationEntries(profileId)`
- `getOrderedCertifications(profileId)`
- `getOrderedReferences(profileId)`

### Job selectors

- `getJobLinks(jobId)`
- `getOrderedJobContacts(jobId)`
- `getOrderedInterviews(jobId)`
- `getInterviewContacts(interviewId)`
- `getCurrentJobStatus(jobId)`

### Status computation

Recommended precedence for computed status:

1. `Job.finalOutcome.status === 'withdrew'`
2. `Job.finalOutcome.status === 'rejected'`
3. `Job.finalOutcome.status === 'offer_received'` or `Job.finalOutcome.status === 'offer_accepted'`
4. the job has one or more `Interview` records
5. `Job.appliedAt !== null`
6. otherwise `interested`

## Notes on naming

The MVP plan used names like `personal_details_json` and `links_json` to communicate structured data.

In TypeScript application state, prefer typed objects and arrays instead:

- `personalDetails` instead of `personal_details_json`
- `links` instead of `links_json`
- `ExperienceBullet.content` instead of embedding `bullets_json` on `ExperienceEntry`
This provides stronger type-safety and simpler component code.

## Resume settings notes

Resume settings should stay embedded on `Profile` for the MVP.

Reasons:

- the generated resume is part of how a specific base profile or job profile is presented
- duplicating a profile should duplicate its resume settings automatically
- keeping one resume settings object per profile keeps the model simple while still allowing tailored section order and visibility

Recommended validation rules for `resumeSettings.sections`:

- every `ResumeSectionKey` must be present exactly once as an object key
- every section must have a boolean `enabled` flag
- every section must have a numeric `sortOrder`
- `sortOrder` values should be unique within the profile's resume settings

## Recommended next step

Use this document to define:

1. exact TypeScript types in the app
2. import/export validation rules
3. reducer or store actions for CRUD, duplication, and job progress updates

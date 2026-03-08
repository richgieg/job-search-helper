# MVP Plan

## Product goal

Build a simple web app that helps a job seeker organize job targets and quickly produce tailored application materials from reusable profile data.

## Core MVP outcomes

The first version should let a user:

1. Create one or more reusable profiles.
2. Save jobs they want to pursue.
3. Add one or more job-specific profiles to a job later, only when needed.
4. Duplicate base profiles and job profiles.
5. Track job application status and key dates.
6. Store contacts related to each job.
7. Configure resume section visibility and section order per profile.
8. Generate a cover letter, resume, and copy-friendly application page from either a base profile or a selected job-specific profile.
9. Export the app state to JSON and import it later to restore the app state.

## Recommended MVP boundaries

Keep the MVP focused on a single primary user: an individual job seeker, with no multi-user support or authentication in the first release.

### In scope

- Single-user local application workflow
- CRUD for profiles (base and job-specific)
- CRUD for jobs
- CRUD for job contacts
- Profile duplication workflows
- Job status tracking
- Resume generation from structured profile data
- Per-profile resume section visibility and ordering
- Cover letter generation from structured profile data
- Copy-to-clipboard application page
- JSON export/import for full app backup and restore
- Basic search, sort, and filtering for jobs

### Out of scope for MVP

- Authentication
- Multi-user collaboration
- Public profile sharing
- Automatic job scraping/browser extension
- Email sync/calendar sync
- AI-heavy rewriting workflows
- Complex resume designer with drag-and-drop layout editing
- Mobile app
- Analytics dashboards beyond simple counts

## Key product decision

Use a single `Profile` model for both base profiles and job-specific profiles.

Jobs do not automatically create profiles. Instead, the user can later create one or more job-specific profiles for a job by duplicating a base profile or by duplicating an existing job profile.

This keeps job creation lightweight while still enabling tailored resumes, cover letters, and application answers per job.

## Primary user flow

1. User creates a base profile.
2. User adds a job.
3. User decides whether the job is worth tailoring.
4. User creates one or more job-specific profiles for that job by duplicating a base profile or an existing job profile.
5. User tailors summary, experience bullets, skills, references, and letter content for that job.
6. User adds recruiter/hiring manager contacts.
7. User selects one of the job's profiles and generates:
   - a resume
   - a cover letter
   - an application page for easy copy/paste
8. User updates job status over time: interested, applied, interview, offer, rejected, withdrew.

## MVP features by area

### 1. Profiles

Each reusable profile should support:

- Profile name
- Professional summary
- Cover letter content
- Resume settings
   - control whether each resume section is shown or hidden
   - control the order of resume sections
   - stored per profile so base profiles and job profiles can differ
- Skill categories and skills
- Professional experience entries
- Education entries
- Certifications
- References (professional and personal)
- Optional links: LinkedIn, portfolio, GitHub, website
- Personal details used in applications

Profiles can be either base profiles or job profiles:

- A base profile is not attached to a job and acts as a reusable starting point.
- A job profile is attached to a specific job through `Profile.job_id`.
- A job profile can be created by duplicating a base profile or by duplicating another job profile.
- A single job can have multiple job profiles.
- Generated materials should use the selected job profile together with the job title from the related job.
- The app should also support previewing generated materials directly from a base profile.

`Profile name` remains an internal label for the user, such as "General Software Engineer" or "Python Backend Engineer".

### 2. Jobs

Each job should support:

- Company name
- Job title
- One or more job posting URLs
- Job description
- Location
- Posted compensation
- Desired compensation
- Compensation notes
- Work arrangement: onsite, hybrid, remote
- Employment type: full-time, part-time, contract, internship, temporary, other
- Date posted
- Notes
- Zero or more linked job-specific profiles
- Zero or more saved application questions and answers

Recommendation: model job progress from events instead of storing a standalone status field.

Examples:

- `job_saved`
- `applied`
- `interview_scheduled`
- `interview_completed`
- `offer_received`
- `rejected`
- `withdrew`

The UI can still show a computed current status such as Interested, Applied, Interview, Offer, Rejected, or Withdrew based on the most relevant event.

### 3. Contacts

Each job can have multiple contacts:

- Name
- Role/title
- Company
- Address line 1
- Address line 2
- Address line 3
- Address line 4
- Email
- Phone
- LinkedIn/URL
- Relationship type: recruiter, hiring manager, referral, interviewer, other
- Notes

### 4. Application questions

Each job can have zero or more saved application questions:

- Question
- Answer
- Sort order

This allows the user to keep track of custom questions asked during online application forms and the answers they submitted.

### 5. Generated outputs

#### Resume

- Generated from either a base profile or a selected job-specific profile
- Respects the profile's resume settings for section visibility and section order
- Exportable as printable HTML in MVP
- Optional PDF in phase 2
- Simple templates only in MVP
- No freeform template designer in MVP; resume settings control section visibility and ordering only

#### Cover letter

- Generated from job data + selected contact + a selected job-specific profile
- Also previewable from a base profile by using a dummy contact in MVP
- Built from a single `cover_letter` field split on trimmed newline-separated paragraphs
- Editable before finalizing
- Exportable as printable HTML in MVP

#### Application page

- Shows the selected profile fields in a structured layout
- Every answer/value can be clicked to copy to clipboard
- Includes common sections used in application forms

### 6. Data portability

- Export the full app state as a JSON file
- Import a previously exported JSON file to restore the app state
- Validate imported JSON before applying it
- Clearly warn the user that import overwrites the current in-memory app state

## Suggested MVP screens

1. Dashboard
   - Job pipeline summary
   - Recently updated jobs
   - Quick actions

2. Profiles list
   - lightweight overview of reusable base profiles
3. Profile editor
   - full profile editing and child records
4. Jobs list
   - lightweight overview of all jobs
5. Job create/edit
6. Job detail
   - full job editing and child records
   - includes access to job-specific profiles
7. Job contacts editor
8. Job profiles list/editor
9. Resume preview
10. Cover letter preview
11. Application page
12. Import/export page or settings section

## Minimal state model

### Profile
- id
- name
- summary
- cover_letter
- resume_settings_json
- personal_details_json
- links_json
- job_id
- cloned_from_profile_id
- created_at
- updated_at

If `job_id` is null, the profile is a base profile. If `job_id` is not null, the profile is a job-specific profile.

`resume_settings_json` stores the profile's single resume settings configuration for the MVP, including whether each resume section is shown and the order in which sections should appear.

`cloned_from_profile_id` is null for profiles created from scratch and points to the profile that was duplicated when a profile is copied.

When a profile is duplicated, the system should duplicate the source `Profile` and all related records so the new profile can be edited independently.

The copied related records include:

- `SkillCategory`
- `Skill`
- `ExperienceEntry`
- `ExperienceBullet`
- `EducationEntry`
- `Certification`
- `Reference`

### SkillCategory
- id
- profile_id
- name
- enabled
- sort_order

### Skill
- id
- skill_category_id
- name
- enabled
- sort_order

### ExperienceEntry
- id
- profile_id
- company
- title
- location
- work_arrangement
- employment_type
- start_date
- end_date
- is_current
- reason_for_leaving_short
- reason_for_leaving_details
- supervisor_name
- supervisor_title
- supervisor_phone
- supervisor_email
- enabled
- sort_order

### ExperienceBullet
- id
- experience_entry_id
- content
- enabled
- sort_order

### EducationEntry
- id
- profile_id
- school
- degree
- graduation_date
- enabled
- sort_order

### Certification
- id
- profile_id
- name
- issuer
- issue_date
- expiry_date
- credential_id
- credential_url
- enabled
- sort_order

### Reference
- id
- profile_id
- type
- name
- relationship
- company
- title
- email
- phone
- notes
- enabled
- sort_order

### Job
- id
- company_name
- job_title
- description
- location
- posted_compensation
- desired_compensation
- compensation_notes
- work_arrangement
- employment_type
- date_posted
- notes
- created_at
- updated_at

### JobLink
- id
- job_id
- name
- url
- sort_order
- created_at

`name` is a short user-defined label such as LinkedIn, Workday, Company Site, or Official.

### JobContact
- id
- job_id
- name
- title
- address_line_1
- address_line_2
- address_line_3
- address_line_4
- email
- phone
- linkedin_url
- relationship_type
- notes
- sort_order

### ApplicationQuestion
- id
- job_id
- question
- answer
- sort_order

### JobEvent
- id
- job_id
- event_type
- occurred_at
- scheduled_for
- notes
- metadata_json
- created_at

Examples for `event_type`: `job_saved`, `applied`, `interview_scheduled`, `interview_completed`, `offer_received`, `rejected`, `withdrew`.

## Recommended technical approach

For fastest delivery:

- Frontend: React SPA with Vite + TypeScript
- UI: React + TypeScript + Tailwind CSS + component library
- State management: in-memory application state
- Persistence: JSON export/import
- Document rendering: browser-rendered printable HTML views

## Why this approach

- Fast to build and run locally in the browser
- Good support for forms and simple CRUD workflows
- Reduces setup complexity during the MVP phase
- Easy path to printable resume/cover letter pages
- Strong type-safety for complex nested state and import/export validation
- Clean upgrade path for AI-assisted generation later

## Generation strategy for MVP

Avoid relying on AI for the first version.

Use deterministic templating:

- Resume: map selected profile sections into a clean template, respecting the profile's configured section visibility and section order, including ordered `ExperienceBullet` records under each experience entry
- Cover letter: combine contact/job/company data with a user-authored `cover_letter` text block, split into paragraphs by trimmed newlines; use a dummy contact when previewing from a base profile
- Application page: render profile fields into copyable cards or rows

This reduces cost, risk, and unpredictability.

## Acceptance criteria

The MVP is successful if a user can:

1. Create at least one reusable profile.
2. Add a job without being forced to create a profile.
3. Create one or more job-specific profiles for a job by duplicating a base profile.
4. Add at least one contact to the job.
5. Add job events and see the current job status inferred from them.
6. Duplicate an existing base profile or job profile.
7. Open a generated resume from either a base profile or a selected job-specific profile.
8. Open a generated cover letter from either a base profile or a selected job-specific profile.
9. Open an application page from either a base profile or a selected job-specific profile and click any field to copy it.
10. Save one or more job-specific application questions and answers for a job.
11. Export the full app state to JSON and import it later to restore the app state.

## Delivery phases

### Phase 1: Foundation
- In-memory state model
- Profile CRUD
- Job CRUD
- Status tracking
- JSON export/import design

### Phase 2: Tailoring workflow
- Profile duplication
- Add profile to existing job
- Support multiple profiles per job
- Job profile editor
- Contacts

### Phase 3: Outputs
- Resume generation
- Cover letter generation
- Application copy page

### Phase 4: Polish
- Search/filter/sort
- Better templates
- UX cleanup
- Import/export UX safeguards

## Notable risks

- Over-modeling resume data too early
- Building PDF export too soon
- Adding AI generation before the structured workflow is stable
- Making job-specific profile editing too complex in the first release
- Making multi-profile job workflows confusing in the UI

## Recommended next step

Translate this MVP plan into:

1. a concrete in-memory state shape
2. page-by-page wireframes
3. an implementation backlog ordered by dependency

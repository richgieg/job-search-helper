import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ActionToggle, AddIconButton, DeleteIconButton, IconActionButton, getActionIconButtonClassName } from '../components/CompactActionControls'
import { FinalOutcomeStrip, type FinalOutcomeDraftStatus } from '../features/jobs/FinalOutcomeStrip'
import { CollapsiblePanel } from '../components/CollapsiblePanel'
import { JobChildEditors } from '../features/jobs/JobChildEditors'
import { formatJobComputedStatus, getJobComputedStatus, getJobComputedStatusBadgeClassName } from '../features/jobs/job-status'
import { useAppStore } from '../store/app-store'
import type { EmploymentType, Job, Profile, WorkArrangement } from '../types/state'
import { employmentTypeOptions, workArrangementOptions } from '../utils/job-field-options'

const TextField = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  type?: 'text' | 'date'
}) => (
  <label className="flex flex-col gap-2 text-sm text-app-text-muted">
    <span className="font-medium">{label}</span>
    <input
      className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
      placeholder={placeholder}
      type={type}
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const TextAreaField = ({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}) => (
  <label className="flex flex-col gap-2 text-sm text-app-text-muted">
    <span className="font-medium">{label}</span>
    <textarea
      className="min-h-24 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const SelectField = <T extends string>({
  label,
  value,
  onChange,
  onBlur,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  options: Array<{ value: T; label: string }>
}) => (
  <label className="flex flex-col gap-2 text-sm text-app-text-muted">
    <span className="font-medium">{label}</span>
    <select
      className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

interface JobDraftState {
  companyName: string
  jobTitle: string
  description: string
  location: string
  postedCompensation: string
  desiredCompensation: string
  compensationNotes: string
  workArrangement: WorkArrangement
  employmentType: EmploymentType
  datePosted: string
  notes: string
}

const createJobDraft = (job: Job): JobDraftState => ({
  companyName: job.companyName,
  jobTitle: job.jobTitle,
  description: job.description,
  location: job.location,
  postedCompensation: job.postedCompensation,
  desiredCompensation: job.desiredCompensation,
  compensationNotes: job.compensationNotes,
  workArrangement: job.workArrangement,
  employmentType: job.employmentType,
  datePosted: job.datePosted ?? '',
  notes: job.notes,
})

const NEW_ATTACHED_PROFILE_SCROLL_MARGIN_BOTTOM_PX = 96

const scrollIntoViewIfNeeded = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const isFullyVisible = rect.top >= 0 && rect.bottom + NEW_ATTACHED_PROFILE_SCROLL_MARGIN_BOTTOM_PX <= window.innerHeight

  if (isFullyVisible) {
    return
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

const AttachedProfileRow = ({
  profile,
  onDelete,
  onDuplicate,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  profile: Profile
  onDelete: () => void
  onDuplicate: () => void
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!scrollIntoViewOnMount || !rowRef.current) {
      return
    }

    scrollIntoViewIfNeeded(rowRef.current)
    onScrollIntoViewComplete?.()
  }, [onScrollIntoViewComplete, scrollIntoViewOnMount])

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-app-border-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      ref={rowRef}
      style={{ scrollMarginBottom: `${NEW_ATTACHED_PROFILE_SCROLL_MARGIN_BOTTOM_PX}px` }}
    >
      <div>
        <p className="font-medium text-app-text">{profile.name}</p>
        <p className="mt-1 text-sm text-app-text-subtle">Updated {new Date(profile.updatedAt).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link aria-label={`Open profile ${profile.name}`} className={getActionIconButtonClassName()} to={`/profiles/${profile.id}`}>
          <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </Link>
        <IconActionButton label={`Duplicate profile ${profile.name}`} onClick={onDuplicate}>
          <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="10" rx="2" width="10" x="9" y="9" />
            <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          </svg>
        </IconActionButton>
        <DeleteIconButton label={`Delete profile ${profile.name}`} onDelete={onDelete} />
      </div>
    </div>
  )
}

export const JobPage = () => {
  const { jobId = '' } = useParams()
  const job = useAppStore((state) => state.data.jobs[jobId])
  const profilesById = useAppStore((state) => state.data.profiles)
  const interviewsById = useAppStore((state) => state.data.interviews)
  const setJobAppliedAt = useAppStore((state) => state.actions.setJobAppliedAt)
  const clearJobAppliedAt = useAppStore((state) => state.actions.clearJobAppliedAt)
  const setJobFinalOutcome = useAppStore((state) => state.actions.setJobFinalOutcome)
  const clearJobFinalOutcome = useAppStore((state) => state.actions.clearJobFinalOutcome)
  const updateJob = useAppStore((state) => state.actions.updateJob)
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const deleteProfile = useAppStore((state) => state.actions.deleteProfile)
  const [draft, setDraft] = useState<JobDraftState | null>(null)
  const [selectedBaseProfileId, setSelectedBaseProfileId] = useState('')
  const [newAttachedProfileId, setNewAttachedProfileId] = useState<string | null>(null)

  const profiles = useMemo(() => Object.values(profilesById), [profilesById])
  const baseProfiles = useMemo(() => profiles.filter((profile) => profile.jobId === null), [profiles])
  const attachedProfiles = useMemo(
    () =>
      profiles
        .filter((profile) => profile.jobId === jobId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    [jobId, profiles],
  )
  const hasAttachedProfiles = attachedProfiles.length > 0
  const interviewCount = useMemo(
    () => Object.values(interviewsById).filter((interview) => interview.jobId === jobId).length,
    [interviewsById, jobId],
  )
  const computedStatus = useMemo(
    () =>
      getJobComputedStatus({
        appliedAt: job?.appliedAt ?? null,
        finalOutcome: job?.finalOutcome ?? null,
        interviewCount,
      }),
    [interviewCount, job?.appliedAt, job?.finalOutcome],
  )

  useEffect(() => {
    if (!job) {
      setDraft(null)
      return
    }

    setDraft(createJobDraft(job))
  }, [job])

  useEffect(() => {
    setSelectedBaseProfileId((current) => {
      if (current && baseProfiles.some((profile) => profile.id === current)) {
        return current
      }

      return baseProfiles[0]?.id ?? ''
    })
  }, [baseProfiles])

  if (!job || !draft) {
    return (
      <div className="rounded-2xl border border-app-border-muted bg-app-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-app-heading">Job not found</h1>
        <p className="mt-3 text-sm text-app-text-subtle">The selected job could not be found.</p>
        <Link className="mt-5 inline-flex rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to="/jobs">
          Back to jobs
        </Link>
      </div>
    )
  }

  const commitRequiredField = (field: 'companyName' | 'jobTitle', value: string) => {
    const trimmed = value.trim()

    if (!trimmed) {
      setDraft((current) => (current ? { ...current, [field]: job[field] } : current))
      return
    }

    if (trimmed === job[field]) {
      if (value !== trimmed) {
        setDraft((current) => (current ? { ...current, [field]: trimmed } : current))
      }
      return
    }

    updateJob({
      jobId: job.id,
      changes: {
        [field]: trimmed,
      },
    })

    if (value !== trimmed) {
      setDraft((current) => (current ? { ...current, [field]: trimmed } : current))
    }
  }

  const commitTextField = (
    field: 'description' | 'location' | 'postedCompensation' | 'desiredCompensation' | 'compensationNotes' | 'notes',
    value: string,
  ) => {
    if (value === job[field]) {
      return
    }

    updateJob({
      jobId: job.id,
      changes: {
        [field]: value,
      },
    })
  }

  const commitSelectField = (field: 'workArrangement' | 'employmentType', value: WorkArrangement | EmploymentType) => {
    if (value === job[field]) {
      return
    }

    updateJob({
      jobId: job.id,
      changes: {
        [field]: value,
      },
    })
  }

  const commitDatePosted = (value: string) => {
    const nextValue = value || null

    if (nextValue === (job.datePosted ?? null)) {
      return
    }

    updateJob({
      jobId: job.id,
      changes: {
        datePosted: nextValue,
      },
    })
  }

  const handleAddJobProfile = () => {
    if (!selectedBaseProfileId) {
      return
    }

    const createdId = duplicateProfile({
      sourceProfileId: selectedBaseProfileId,
      targetJobId: job.id,
    })

    if (createdId) {
      setNewAttachedProfileId(createdId)
    }
  }

  const handleAppliedToggle = (checked: boolean) => {
    if (checked) {
      setJobAppliedAt({
        jobId: job.id,
        appliedAt: new Date().toISOString(),
      })
      return
    }

    clearJobAppliedAt(job.id)
  }

  const handleFinalOutcomeChange = (value: FinalOutcomeDraftStatus) => {
    if (!value) {
      clearJobFinalOutcome(job.id)
      return
    }

    setJobFinalOutcome({
      jobId: job.id,
      status: value,
      setAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-app-primary">Job editor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-heading">{job.jobTitle || 'Untitled role'}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-app-text-subtle">
            <span>{job.companyName || 'Unknown company'}</span>
            <span className={['rounded-full px-3 py-1 text-xs font-medium', getJobComputedStatusBadgeClassName(computedStatus)].join(' ')}>{formatJobComputedStatus(computedStatus)}</span>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-app-border-muted bg-app-surface p-9 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex justify-start lg:shrink-0">
            <ActionToggle checked={job.appliedAt !== null} label="Applied" showLabel onChange={handleAppliedToggle} />
          </div>
          <div className="min-w-0 flex-1">
            <FinalOutcomeStrip
              disabled={job.appliedAt === null}
              name={`job-${job.id}-final-outcome`}
              value={job.appliedAt ? (job.finalOutcome?.status ?? '') : ''}
              onChange={handleFinalOutcomeChange}
            />
          </div>
        </div>
      </section>

      <CollapsiblePanel description="Capture the core job details used across the app." title="Job details">
        <div className="grid gap-4 xl:grid-cols-2">
          <TextField label="Job title" value={draft.jobTitle} onBlur={() => commitRequiredField('jobTitle', draft.jobTitle)} onChange={(value) => setDraft({ ...draft, jobTitle: value })} />
          <TextField label="Company name" value={draft.companyName} onBlur={() => commitRequiredField('companyName', draft.companyName)} onChange={(value) => setDraft({ ...draft, companyName: value })} />
          <TextField label="Location" value={draft.location} onBlur={() => commitTextField('location', draft.location)} onChange={(value) => setDraft({ ...draft, location: value })} />
          <TextField label="Date posted" type="date" value={draft.datePosted} onBlur={() => commitDatePosted(draft.datePosted)} onChange={(value) => setDraft({ ...draft, datePosted: value })} />
          <SelectField label="Work arrangement" options={workArrangementOptions} value={draft.workArrangement} onBlur={() => commitSelectField('workArrangement', draft.workArrangement)} onChange={(value) => setDraft({ ...draft, workArrangement: value })} />
          <SelectField label="Employment type" options={employmentTypeOptions} value={draft.employmentType} onBlur={() => commitSelectField('employmentType', draft.employmentType)} onChange={(value) => setDraft({ ...draft, employmentType: value })} />
          <TextField label="Posted compensation" value={draft.postedCompensation} onBlur={() => commitTextField('postedCompensation', draft.postedCompensation)} onChange={(value) => setDraft({ ...draft, postedCompensation: value })} />
          <TextField label="Desired compensation" value={draft.desiredCompensation} onBlur={() => commitTextField('desiredCompensation', draft.desiredCompensation)} onChange={(value) => setDraft({ ...draft, desiredCompensation: value })} />
          <div className="xl:col-span-2">
            <TextAreaField label="Compensation notes" value={draft.compensationNotes} onBlur={() => commitTextField('compensationNotes', draft.compensationNotes)} onChange={(value) => setDraft({ ...draft, compensationNotes: value })} />
          </div>
          <div className="xl:col-span-2">
            <TextAreaField label="Description" value={draft.description} onBlur={() => commitTextField('description', draft.description)} onChange={(value) => setDraft({ ...draft, description: value })} />
          </div>
          <div className="xl:col-span-2">
            <TextAreaField label="Notes" value={draft.notes} onBlur={() => commitTextField('notes', draft.notes)} onChange={(value) => setDraft({ ...draft, notes: value })} />
          </div>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        collapsible={hasAttachedProfiles}
        description="Create job-specific profiles from base profiles and manage the profiles already attached to this job."
        headerActionContent={({ triggerAction }) =>
          baseProfiles.length === 0 ? (
            <p className="text-sm text-app-text-subtle">Create a base profile first.</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="min-w-0 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring sm:w-64"
                value={selectedBaseProfileId}
                onChange={(event) => setSelectedBaseProfileId(event.target.value)}
              >
                {baseProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <AddIconButton label="Add profile" onAdd={triggerAction} />
            </div>
          )
        }
        onAction={handleAddJobProfile}
        title="Profiles"
      >
        {hasAttachedProfiles ? (
          <div className="space-y-3">
            {attachedProfiles.map((profile) => (
              <AttachedProfileRow
                key={profile.id}
                onDelete={() => {
                  const confirmed = window.confirm(`Delete profile "${profile.name}"? This cannot be undone.`)
                  if (!confirmed) {
                    return
                  }

                  deleteProfile(profile.id)
                }}
                onDuplicate={() => {
                  const createdId = duplicateProfile({ sourceProfileId: profile.id })

                  if (createdId) {
                    setNewAttachedProfileId(createdId)
                  }
                }}
                profile={profile}
                scrollIntoViewOnMount={profile.id === newAttachedProfileId}
                {...(profile.id === newAttachedProfileId
                  ? { onScrollIntoViewComplete: () => setNewAttachedProfileId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <JobChildEditors jobId={job.id} />
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AddIconButton, DeleteIconButton, IconActionButton, getActionIconButtonClassName } from '../components/CompactActionControls'
import { CollapsiblePanel } from '../components/CollapsiblePanel'
import { JobChildEditors } from '../features/jobs/JobChildEditors'
import { getJobComputedStatus } from '../features/jobs/job-status'
import { useAppStore } from '../store/app-store'
import type { EmploymentType, Job, WorkArrangement } from '../types/state'

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
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <input
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
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
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <textarea
      className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
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
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <select
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
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

const workArrangementOptions: Array<{ value: WorkArrangement; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]

const employmentTypeOptions: Array<{ value: EmploymentType; label: string }> = [
  { value: 'other', label: 'Other' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
]

export const JobPage = () => {
  const { jobId = '' } = useParams()
  const job = useAppStore((state) => state.data.jobs[jobId])
  const profilesById = useAppStore((state) => state.data.profiles)
  const jobEventsById = useAppStore((state) => state.data.jobEvents)
  const updateJob = useAppStore((state) => state.actions.updateJob)
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const deleteProfile = useAppStore((state) => state.actions.deleteProfile)
  const [draft, setDraft] = useState<JobDraftState | null>(null)
  const [selectedBaseProfileId, setSelectedBaseProfileId] = useState('')

  const profiles = useMemo(() => Object.values(profilesById), [profilesById])
  const baseProfiles = useMemo(() => profiles.filter((profile) => profile.jobId === null), [profiles])
  const attachedProfiles = useMemo(
    () =>
      profiles
        .filter((profile) => profile.jobId === jobId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [jobId, profiles],
  )
  const hasAttachedProfiles = attachedProfiles.length > 0
  const jobEvents = useMemo(() => Object.values(jobEventsById).filter((event) => event.jobId === jobId), [jobEventsById, jobId])
  const computedStatus = useMemo(() => getJobComputedStatus(jobEvents.map((event) => event.eventType)), [jobEvents])

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
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Job not found</h1>
        <p className="mt-3 text-sm text-slate-600">The selected job could not be found.</p>
        <Link className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/jobs">
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

    duplicateProfile({
      sourceProfileId: selectedBaseProfileId,
      targetJobId: job.id,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Job editor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{job.jobTitle || 'Untitled role'}</h1>
          <p className="mt-2 text-sm text-slate-600">{job.companyName || 'Unknown company'}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium capitalize text-sky-700">{computedStatus}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Created {new Date(job.createdAt).toLocaleString()}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Updated {new Date(job.updatedAt).toLocaleString()}</span>
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
        headerActionContent={
          baseProfiles.length === 0 ? (
            <p className="text-sm text-slate-500">Create a base profile first.</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 sm:w-64"
                value={selectedBaseProfileId}
                onChange={(event) => setSelectedBaseProfileId(event.target.value)}
              >
                {baseProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <AddIconButton label="Add profile" onAdd={handleAddJobProfile} />
            </div>
          )
        }
        title="Profiles"
      >
        {hasAttachedProfiles ? (
          <div className="space-y-3">
            {attachedProfiles.map((profile) => (
                <div key={profile.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{profile.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Updated {new Date(profile.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link aria-label={`Open profile ${profile.name}`} className={getActionIconButtonClassName()} to={`/profiles/${profile.id}`}>
                      <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
                        <path d="M7 17 17 7" />
                        <path d="M9 7h8v8" />
                      </svg>
                    </Link>
                    <IconActionButton label={`Duplicate profile ${profile.name}`} onClick={() => duplicateProfile({ sourceProfileId: profile.id })}>
                      <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="10" rx="2" width="10" x="9" y="9" />
                        <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                      </svg>
                    </IconActionButton>
                    <DeleteIconButton
                      label={`Delete profile ${profile.name}`}
                      onDelete={() => {
                        const confirmed = window.confirm(`Delete profile "${profile.name}"? This cannot be undone.`)
                        if (!confirmed) {
                          return
                        }

                        deleteProfile(profile.id)
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <JobChildEditors jobId={job.id} />
    </div>
  )
}
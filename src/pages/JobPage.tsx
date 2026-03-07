import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { JobChildEditors } from '../features/jobs/JobChildEditors'
import { getJobComputedStatus } from '../features/jobs/job-status'
import { useAppStore } from '../store/app-store'
import type { EmploymentType, WorkArrangement } from '../types/state'

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
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
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const TextAreaField = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) => (
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <textarea
      className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
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

export const JobPage = () => {
  const { jobId = '' } = useParams()
  const navigate = useNavigate()
  const job = useAppStore((state) => state.data.jobs[jobId])
  const profilesById = useAppStore((state) => state.data.profiles)
  const jobEventsById = useAppStore((state) => state.data.jobEvents)
  const updateJob = useAppStore((state) => state.actions.updateJob)
  const deleteJob = useAppStore((state) => state.actions.deleteJob)
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const [draft, setDraft] = useState<JobDraftState | null>(null)
  const [selectedBaseProfileId, setSelectedBaseProfileId] = useState('')

  const profiles = useMemo(() => Object.values(profilesById), [profilesById])
  const baseProfiles = useMemo(() => profiles.filter((profile) => profile.jobId === null), [profiles])
  const attachedProfiles = useMemo(() => profiles.filter((profile) => profile.jobId === jobId), [jobId, profiles])
  const firstAttachedProfileId = attachedProfiles[0]?.id ?? null
  const jobEvents = useMemo(() => Object.values(jobEventsById).filter((event) => event.jobId === jobId), [jobEventsById, jobId])
  const computedStatus = useMemo(() => getJobComputedStatus(jobEvents.map((event) => event.eventType)), [jobEvents])

  useEffect(() => {
    if (!job) {
      setDraft(null)
      return
    }

    setDraft({
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

  const handleSave = () => {
    const trimmedCompany = draft.companyName.trim()
    const trimmedTitle = draft.jobTitle.trim()

    if (!trimmedCompany || !trimmedTitle) {
      setDraft({
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
      return
    }

    updateJob({
      jobId: job.id,
      changes: {
        companyName: trimmedCompany,
        jobTitle: trimmedTitle,
        description: draft.description,
        location: draft.location,
        postedCompensation: draft.postedCompensation,
        desiredCompensation: draft.desiredCompensation,
        compensationNotes: draft.compensationNotes,
        workArrangement: draft.workArrangement,
        employmentType: draft.employmentType,
        datePosted: draft.datePosted || null,
        notes: draft.notes,
      },
    })
  }

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete job "${job.jobTitle}" at "${job.companyName}"? This removes attached job profiles too.`)
    if (!confirmed) {
      return
    }

    deleteJob(job.id)
    navigate('/jobs')
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
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Job detail</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{job.jobTitle || 'Untitled role'}</h1>
          <p className="mt-2 text-sm text-slate-600">{job.companyName || 'Unknown company'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/jobs">
            Back to jobs
          </Link>
          {firstAttachedProfileId ? (
            <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/previews/resume/${firstAttachedProfileId}`}>
              Open preview
            </Link>
          ) : null}
          <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={handleSave} type="button">
            Save job
          </button>
          <button className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={handleDelete} type="button">
            Delete
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium capitalize text-sky-700">{computedStatus}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Created {new Date(job.createdAt).toLocaleString()}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Updated {new Date(job.updatedAt).toLocaleString()}</span>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <TextField label="Job title" value={draft.jobTitle} onChange={(value) => setDraft({ ...draft, jobTitle: value })} />
          <TextField label="Company name" value={draft.companyName} onChange={(value) => setDraft({ ...draft, companyName: value })} />
          <TextField label="Location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} />
          <TextField label="Date posted" type="date" value={draft.datePosted} onChange={(value) => setDraft({ ...draft, datePosted: value })} />
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-medium">Work arrangement</span>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              value={draft.workArrangement}
              onChange={(event) => setDraft({ ...draft, workArrangement: event.target.value as WorkArrangement })}
            >
              <option value="unknown">Unknown</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-medium">Employment type</span>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              value={draft.employmentType}
              onChange={(event) => setDraft({ ...draft, employmentType: event.target.value as EmploymentType })}
            >
              <option value="other">Other</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="temporary">Temporary</option>
            </select>
          </label>
          <TextField label="Posted compensation" value={draft.postedCompensation} onChange={(value) => setDraft({ ...draft, postedCompensation: value })} />
          <TextField label="Desired compensation" value={draft.desiredCompensation} onChange={(value) => setDraft({ ...draft, desiredCompensation: value })} />
          <div className="xl:col-span-2">
            <TextAreaField label="Compensation notes" value={draft.compensationNotes} onChange={(value) => setDraft({ ...draft, compensationNotes: value })} />
          </div>
          <div className="xl:col-span-2">
            <TextAreaField label="Description" value={draft.description} onChange={(value) => setDraft({ ...draft, description: value })} />
          </div>
          <div className="xl:col-span-2">
            <TextAreaField label="Notes" value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create job profile from base profile</h2>
        {baseProfiles.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Create a base profile first.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              value={selectedBaseProfileId}
              onChange={(event) => setSelectedBaseProfileId(event.target.value)}
            >
              {baseProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700" onClick={handleAddJobProfile} type="button">
              Add profile
            </button>
          </div>
        )}
      </section>

      <JobChildEditors jobId={job.id} />
    </div>
  )
}
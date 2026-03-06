import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { JobChildEditors } from '../features/jobs/JobChildEditors'
import { getJobComputedStatus } from '../features/jobs/job-status'
import { useAppStore } from '../store/app-store'

const JobListItem = ({ jobId }: { jobId: string }) => {
  const job = useAppStore((state) => state.data.jobs[jobId])
  const profilesById = useAppStore((state) => state.data.profiles)
  const jobEventsById = useAppStore((state) => state.data.jobEvents)
  const updateJob = useAppStore((state) => state.actions.updateJob)
  const deleteJob = useAppStore((state) => state.actions.deleteJob)
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const [companyName, setCompanyName] = useState(job?.companyName ?? '')
  const [jobTitle, setJobTitle] = useState(job?.jobTitle ?? '')
  const profiles = useMemo(() => Object.values(profilesById), [profilesById])
  const jobEvents = useMemo(() => Object.values(jobEventsById).filter((event) => event.jobId === jobId), [jobEventsById, jobId])
  const baseProfiles = useMemo(() => profiles.filter((profile) => profile.jobId === null), [profiles])
  const jobProfileCount = useMemo(() => profiles.filter((profile) => profile.jobId === jobId).length, [jobId, profiles])
  const [selectedBaseProfileId, setSelectedBaseProfileId] = useState(baseProfiles[0]?.id ?? '')
  const computedStatus = useMemo(() => getJobComputedStatus(jobEvents.map((event) => event.eventType)), [jobEvents])

  useEffect(() => {
    if (!job) {
      return
    }

    setCompanyName(job.companyName)
    setJobTitle(job.jobTitle)
  }, [job])

  useEffect(() => {
    setSelectedBaseProfileId((current) => {
      if (current && baseProfiles.some((profile) => profile.id === current)) {
        return current
      }

      return baseProfiles[0]?.id ?? ''
    })
  }, [baseProfiles])

  if (!job) {
    return null
  }

  const saveChanges = () => {
    const trimmedCompany = companyName.trim()
    const trimmedTitle = jobTitle.trim()

    if (!trimmedCompany || !trimmedTitle) {
      setCompanyName(job.companyName)
      setJobTitle(job.jobTitle)
      return
    }

    if (trimmedCompany === job.companyName && trimmedTitle === job.jobTitle) {
      return
    }

    updateJob({
      jobId: job.id,
      changes: {
        companyName: trimmedCompany,
        jobTitle: trimmedTitle,
      },
    })
  }

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete job "${job.jobTitle}" at "${job.companyName}"? This removes attached job profiles too.`)
    if (!confirmed) {
      return
    }

    deleteJob(job.id)
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
    <li className="rounded-xl border border-slate-200 px-4 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              value={jobTitle}
              onBlur={saveChanges}
              onChange={(event) => setJobTitle(event.target.value)}
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              value={companyName}
              onBlur={saveChanges}
              onChange={(event) => setCompanyName(event.target.value)}
            />
            <p className="text-xs text-slate-400 md:col-span-2">Created {new Date(job.createdAt).toLocaleString()}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {jobProfileCount > 0 ? (
              <Link
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                to={`/previews/resume/${profiles.find((profile) => profile.jobId === job.id)?.id}`}
              >
                Open a preview
              </Link>
            ) : null}
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium capitalize text-sky-700">
              {computedStatus}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {jobProfileCount} attached profiles
            </span>
            <button
              className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              onClick={handleDelete}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Create job profile from base profile</p>
          {baseProfiles.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Create a base profile first.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
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
              <button
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                onClick={handleAddJobProfile}
                type="button"
              >
                Add profile copy
              </button>
            </div>
          )}
        </div>

        <JobChildEditors jobId={job.id} />
      </div>
    </li>
  )
}

export const JobsPage = () => {
  const jobsById = useAppStore((state) => state.data.jobs)
  const createJob = useAppStore((state) => state.actions.createJob)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  const jobs = useMemo(() => Object.values(jobsById), [jobsById])

  const sortedJobs = useMemo(
    () => [...jobs].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [jobs],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedCompany = companyName.trim()
    const trimmedTitle = jobTitle.trim()

    if (!trimmedCompany || !trimmedTitle) {
      return
    }

    createJob({ companyName: trimmedCompany, jobTitle: trimmedTitle })
    setCompanyName('')
    setJobTitle('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Jobs</h1>
        <p className="mt-2 text-sm text-slate-600">Jobs are lightweight at creation time. Profiles can be attached later through duplication workflows.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quick add job</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
          <input
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            placeholder="Company name"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            placeholder="Job title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
          />
          <button className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700" type="submit">
            Add job
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Job list</h2>
          <span className="text-sm text-slate-500">{sortedJobs.length} total</span>
        </div>

        {sortedJobs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No jobs yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedJobs.map((job) => (
              <JobListItem key={job.id} jobId={job.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

import { SubmitEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getJobComputedStatus } from '../features/jobs/job-status'
import { useAppStore } from '../store/app-store'

const JobListItem = ({ jobId }: { jobId: string }) => {
  const job = useAppStore((state) => state.data.jobs[jobId])
  const jobEventsById = useAppStore((state) => state.data.jobEvents)
  const deleteJob = useAppStore((state) => state.actions.deleteJob)

  const jobEvents = useMemo(() => Object.values(jobEventsById).filter((event) => event.jobId === jobId), [jobEventsById, jobId])

  if (!job) {
    return null
  }

  const computedStatus = getJobComputedStatus(jobEvents.map((event) => event.eventType))

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete job "${job.jobTitle}" at "${job.companyName}"? This removes attached job profiles too.`)
    if (!confirmed) {
      return
    }

    deleteJob(job.id)
  }

  return (
    <tr className="border-t border-slate-200 first:border-t-0">
      <td className="px-4 py-4 align-top">
        <Link className="group inline-block" to={`/jobs/${job.id}`}>
          <p className="font-medium text-slate-900 group-hover:text-sky-700">{job.jobTitle}</p>
          <p className="mt-1 text-sm text-slate-500 group-hover:text-sky-600">{job.companyName}</p>
        </Link>
      </td>
      <td className="px-4 py-4 align-top">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium capitalize text-sky-700">{computedStatus}</span>
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-600">{new Date(job.updatedAt).toLocaleString()}</td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap justify-end gap-2">
          <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/jobs/${job.id}`}>
            Open
          </Link>
          <button className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={handleDelete} type="button">
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

const JobsTable = ({ jobIds }: { jobIds: string[] }) => {
  if (jobIds.length === 0) {
    return <p className="text-sm text-slate-500">No jobs yet.</p>
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <th className="px-4 py-3">Job</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobIds.map((jobId) => (
            <JobListItem key={jobId} jobId={jobId} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const JobsPage = () => {
  const jobsById = useAppStore((state) => state.data.jobs)
  const createJob = useAppStore((state) => state.actions.createJob)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [initialLinkUrl, setInitialLinkUrl] = useState('')

  const jobs = useMemo(() => Object.values(jobsById), [jobsById])
  const sortedJobIds = useMemo(() => [...jobs].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).map((job) => job.id), [jobs])

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedCompany = companyName.trim()
    const trimmedTitle = jobTitle.trim()
    const trimmedInitialLinkUrl = initialLinkUrl.trim()

    if (!trimmedCompany || !trimmedTitle) {
      return
    }

    createJob({
      companyName: trimmedCompany,
      jobTitle: trimmedTitle,
      ...(trimmedInitialLinkUrl ? { initialLinkUrl: trimmedInitialLinkUrl } : {}),
    })
    setCompanyName('')
    setJobTitle('')
    setInitialLinkUrl('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Jobs</h1>
        <p className="mt-2 text-sm text-slate-600">Use this page as a lightweight overview. Open any job to edit its details, profiles, contacts, questions, sources, and events.</p>
      </div>

      <section className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            placeholder="Job title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            placeholder="Company name"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 md:col-span-2 md:row-start-2"
            placeholder="https://example.com/job (optional)"
            spellCheck={false}
            type="url"
            value={initialLinkUrl}
            onChange={(event) => setInitialLinkUrl(event.target.value)}
          />
          <button className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 md:col-start-3 md:row-start-1" type="submit">
            Add job
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <JobsTable jobIds={sortedJobIds} />
      </section>
    </div>
  )
}

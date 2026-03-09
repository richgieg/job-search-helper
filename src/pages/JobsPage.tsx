import { SubmitEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { getJobComputedStatus } from '../features/jobs/job-status'
import { useAppStore } from '../store/app-store'

const JobListItem = ({ jobId }: { jobId: string }) => {
  const job = useAppStore((state) => state.data.jobs[jobId])
  const jobLinksById = useAppStore((state) => state.data.jobLinks)
  const jobEventsById = useAppStore((state) => state.data.jobEvents)
  const deleteJob = useAppStore((state) => state.actions.deleteJob)

  const jobLinks = useMemo(
    () =>
      Object.values(jobLinksById)
        .filter((link) => link.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [jobId, jobLinksById],
  )
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
    <tr className="border-t border-slate-200 first:border-t-0 hover:bg-sky-50/40">
      <td className="border-r border-slate-200 px-4 py-3 align-middle last:border-r-0">
        <Link className="group inline-block" to={`/jobs/${job.id}`}>
          <p className="font-medium text-slate-900 group-hover:text-sky-700">{job.jobTitle}</p>
        </Link>
      </td>
      <td className="border-r border-slate-200 px-4 py-3 align-middle last:border-r-0">
        <span className="text-sm text-slate-600">{job.companyName}</span>
      </td>
      <td className="border-r border-slate-200 px-4 py-3 align-middle last:border-r-0">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium capitalize text-sky-700">{computedStatus}</span>
      </td>
      <td className="border-r border-slate-200 px-4 py-3 align-middle last:border-r-0">
        {jobLinks.length === 0 ? (
          <span className="text-sm text-slate-400">—</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {jobLinks.map((jobLink, index) => (
              <a
                key={jobLink.id}
                className="text-sm font-medium text-sky-700 underline-offset-2 hover:text-sky-800 hover:underline"
                href={jobLink.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {`link ${index + 1}`}
              </a>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
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
    return <p className="p-6 text-sm text-slate-500">No jobs yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse table-fixed text-sm">
        <colgroup>
          <col className="w-[31%]" />
          <col className="w-[23%]" />
          <col className="w-[12%]" />
          <col className="w-[18%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-300 bg-slate-100 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <th className="border-r border-slate-300 px-4 py-3 last:border-r-0">Job title</th>
            <th className="border-r border-slate-300 px-4 py-3 last:border-r-0">Company</th>
            <th className="border-r border-slate-300 px-4 py-3 last:border-r-0">Status</th>
            <th className="border-r border-slate-300 px-4 py-3 last:border-r-0">Links</th>
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
  const jobTitleInputRef = useRef<HTMLInputElement | null>(null)

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
    jobTitleInputRef.current?.focus()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Jobs</h1>
        <p className="mt-2 text-sm text-slate-600">Use this page as a lightweight overview. Open any job to edit its details, profiles, contacts, questions, sources, and events.</p>
      </div>

      <section className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">Job title</span>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                ref={jobTitleInputRef}
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">Company name</span>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </label>
          </div>

          <label className="flex min-w-0 flex-col gap-2 text-sm text-slate-700">
            <span className="font-medium">URL (optional)</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              spellCheck={false}
              type="url"
              value={initialLinkUrl}
              onChange={(event) => setInitialLinkUrl(event.target.value)}
            />
          </label>

          <div className="flex justify-end">
            <button className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700" type="submit">
              Add job
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <JobsTable jobIds={sortedJobIds} />
      </section>
    </div>
  )
}

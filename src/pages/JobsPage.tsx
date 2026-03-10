import { SubmitEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { DeleteIconButton, getActionIconButtonClassName } from '../components/CompactActionControls'
import { formatJobComputedStatus, getJobComputedStatus, getJobComputedStatusBadgeClassName } from '../features/jobs/job-status'
import { useAppStore } from '../store/app-store'

const JobListItem = ({ jobId }: { jobId: string }) => {
  const job = useAppStore((state) => state.data.jobs[jobId])
  const jobLinksById = useAppStore((state) => state.data.jobLinks)
  const interviewsById = useAppStore((state) => state.data.interviews)
  const deleteJob = useAppStore((state) => state.actions.deleteJob)

  const jobLinks = useMemo(
    () =>
      Object.values(jobLinksById)
        .filter((link) => link.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [jobId, jobLinksById],
  )
  const interviewCount = useMemo(
    () => Object.values(interviewsById).filter((interview) => interview.jobId === jobId).length,
    [interviewsById, jobId],
  )

  if (!job) {
    return null
  }

  const computedStatus = getJobComputedStatus({
    appliedAt: job.appliedAt,
    finalOutcome: job.finalOutcome,
    interviewCount,
  })

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete job "${job.jobTitle}" at "${job.companyName}"? This removes attached job profiles too.`)
    if (!confirmed) {
      return
    }

    deleteJob(job.id)
  }

  return (
    <tr className="border-t border-app-border-muted first:border-t-0">
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <Link className="group inline-block" to={`/jobs/${job.id}`}>
          <p className="font-medium text-app-text group-hover:text-app-primary-hover">{job.jobTitle}</p>
        </Link>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <span className="text-sm text-app-text-subtle">{job.companyName}</span>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <span className={['rounded-full px-3 py-1 text-xs font-medium', getJobComputedStatusBadgeClassName(computedStatus)].join(' ')}>{formatJobComputedStatus(computedStatus)}</span>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        {jobLinks.length === 0 ? (
          <span className="text-sm text-app-text-disabled">—</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {jobLinks.map((jobLink, index) => (
              <a
                key={jobLink.id}
                className="text-sm font-medium text-app-primary-hover underline-offset-2 hover:text-app-primary-hover hover:underline"
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
          <Link aria-label={`Open job ${job.jobTitle} at ${job.companyName}`} className={getActionIconButtonClassName()} to={`/jobs/${job.id}`}>
            <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
              <path d="M7 17 17 7" />
              <path d="M9 7h8v8" />
            </svg>
          </Link>
          <DeleteIconButton label={`Delete job ${job.jobTitle} at ${job.companyName}`} onDelete={handleDelete} />
        </div>
      </td>
    </tr>
  )
}

const JobsTable = ({ jobIds }: { jobIds: string[] }) => {
  if (jobIds.length === 0) {
    return <p className="p-6 text-sm text-app-text-subtle">No jobs yet.</p>
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
          <tr className="border-b border-app-border bg-app-surface-subtle text-left text-xs font-semibold uppercase tracking-[0.18em] text-app-text-subtle">
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Job title</th>
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Company</th>
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Status</th>
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Links</th>
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
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Jobs</h1>
        <p className="mt-2 text-sm text-app-text-subtle">Keep track of the roles you're pursuing and everything connected to each one.</p>
      </div>

      <section className="max-w-4xl rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-2 text-sm text-app-text-muted">
              <span className="font-medium">Job title</span>
              <input
                className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
                ref={jobTitleInputRef}
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm text-app-text-muted">
              <span className="font-medium">Company name</span>
              <input
                className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </label>
          </div>

          <label className="flex min-w-0 flex-col gap-2 text-sm text-app-text-muted">
            <span className="font-medium">URL (optional)</span>
            <input
              className="w-full rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
              spellCheck={false}
              type="url"
              value={initialLinkUrl}
              onChange={(event) => setInitialLinkUrl(event.target.value)}
            />
          </label>

          <div className="flex justify-end">
            <button className="rounded-xl bg-app-primary px-3 py-2 text-sm font-medium text-app-primary-contrast hover:bg-app-primary-hover" type="submit">
              Add job
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        <JobsTable jobIds={sortedJobIds} />
      </section>
    </div>
  )
}

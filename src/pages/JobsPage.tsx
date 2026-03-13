import { SubmitEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import type { JobsListItemDto } from '../api/read-models'
import { DeleteIconButton, getActionIconButtonClassName } from '../components/CompactActionControls'
import { formatJobComputedStatus, getJobComputedStatusBadgeClassName } from '../features/jobs/job-status'
import { useJobMutations } from '../features/jobs/use-job-mutations'
import { useJobsListQuery } from '../queries/use-jobs-list-query'

const JobListItem = ({ job }: { job: JobsListItemDto }) => {
  const { deleteJob } = useJobMutations()

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete job "${job.jobTitle}" at "${job.companyName}"? This removes attached job profiles too.`)
    if (!confirmed) {
      return
    }

    await deleteJob(job.id)
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
        <span className={['rounded-full px-3 py-1 text-xs font-medium', getJobComputedStatusBadgeClassName(job.computedStatus)].join(' ')}>{formatJobComputedStatus(job.computedStatus)}</span>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        {job.jobLinks.length === 0 ? (
          <span className="text-sm text-app-text-disabled">—</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {job.jobLinks.map((jobLink, index) => (
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

const JobsTable = ({ jobs }: { jobs: JobsListItemDto[] }) => {
  if (jobs.length === 0) {
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
          {jobs.map((job) => (
            <JobListItem key={job.id} job={job} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const JobsPage = () => {
  const { createJob } = useJobMutations()
  const { data, error, isLoading } = useJobsListQuery()
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [initialLinkUrl, setInitialLinkUrl] = useState('')
  const jobTitleInputRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedCompany = companyName.trim()
    const trimmedTitle = jobTitle.trim()
    const trimmedInitialLinkUrl = initialLinkUrl.trim()

    if (!trimmedCompany || !trimmedTitle) {
      return
    }

    await createJob({
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

      {error ? (
        <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft px-4 py-3 text-sm text-app-status-rejected">
          Unable to refresh jobs right now. Showing the most recently cached result if available.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        {isLoading && !data ? <p className="p-6 text-sm text-app-text-subtle">Loading jobs...</p> : <JobsTable jobs={data?.items ?? []} />}
      </section>
    </div>
  )
}

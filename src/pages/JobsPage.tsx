import { SubmitEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { createStaticPageTitle } from '../app/page-titles'
import { usePageTitle } from '../app/use-page-title'
import type { JobsListItemDto } from '../api/read-models'
import { DeleteIconButton, getActionIconButtonClassName } from '../components/CompactActionControls'
import { formatJobComputedStatus, getJobComputedStatusBadgeClassName } from '../features/jobs/job-status'
import { useJobMutations } from '../features/jobs/use-job-mutations'
import { useJobsListQuery } from '../queries/use-jobs-list-query'
import type { CreateJobInput } from '../domain/job-data'

const getJobOrganizationName = (job: { companyName: string; staffingAgencyName?: string }) => job.companyName || job.staffingAgencyName || 'Unknown organization'

const getJobCompanyDisplayName = (job: { companyName: string }) => job.companyName || '—'

const getJobAgencyDisplayName = (job: { staffingAgencyName?: string }) => job.staffingAgencyName || '—'

const JobListItem = ({ job, onDeleteJob }: { job: JobsListItemDto; onDeleteJob: (jobId: string) => Promise<void> }) => {
  const organizationName = getJobOrganizationName(job)
  const companyDisplayName = getJobCompanyDisplayName(job)
  const agencyDisplayName = getJobAgencyDisplayName(job)

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete job "${job.jobTitle}" at "${organizationName}"? This removes attached job profiles too.`)
    if (!confirmed) {
      return
    }

    await onDeleteJob(job.id)
  }

  return (
    <tr className="border-t border-app-border-muted first:border-t-0">
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <Link className="group inline-block" to={`/jobs/${job.id}`}>
          <p className="font-medium text-app-text group-hover:text-app-primary-hover">{job.jobTitle}</p>
        </Link>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <span className={`text-sm ${companyDisplayName === '—' ? 'text-app-text-disabled' : 'text-app-text-subtle'}`}>{companyDisplayName}</span>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <span className={`text-sm ${agencyDisplayName === '—' ? 'text-app-text-disabled' : 'text-app-text-subtle'}`}>{agencyDisplayName}</span>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <span className={['rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap', getJobComputedStatusBadgeClassName(job.computedStatus)].join(' ')}>{formatJobComputedStatus(job.computedStatus)}</span>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        {job.jobLinks.length === 0 ? (
          <span className="text-sm text-app-text-disabled">—</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {job.jobLinks.map((jobLink, index) => (
              <a
                key={jobLink.id}
                aria-label={`Open job link ${index + 1} for ${job.jobTitle} in new tab`}
                className={getActionIconButtonClassName()}
                href={jobLink.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="text-xs font-semibold leading-none">{index + 1}</span>
              </a>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
          <Link aria-label={`Open job ${job.jobTitle} at ${organizationName}`} className={getActionIconButtonClassName()} to={`/jobs/${job.id}`}>
            <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
              <path d="M7 17 17 7" />
              <path d="M9 7h8v8" />
            </svg>
          </Link>
          <DeleteIconButton label={`Delete job ${job.jobTitle} at ${organizationName}`} onDelete={handleDelete} />
        </div>
      </td>
    </tr>
  )
}

const JobsTable = ({ jobs, onDeleteJob }: { jobs: JobsListItemDto[]; onDeleteJob: (jobId: string) => Promise<void> }) => {
  if (jobs.length === 0) {
    return <p className="p-6 text-sm text-app-text-subtle">No jobs yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse table-fixed text-sm">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[18%]" />
          <col className="w-[18%]" />
          <col className="w-[12%]" />
          <col className="w-[16%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-app-border bg-app-surface-subtle text-left text-xs font-semibold uppercase tracking-[0.18em] text-app-text-subtle">
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Job title</th>
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Company</th>
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Agency</th>
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Status</th>
            <th className="border-r border-app-border px-4 py-3 last:border-r-0">Links</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobListItem key={job.id} job={job} onDeleteJob={onDeleteJob} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const JobsQuickAddForm = ({ onCreateJob }: { onCreateJob: (input: CreateJobInput) => Promise<string | null> }) => {
  const [companyName, setCompanyName] = useState('')
  const [staffingAgencyName, setStaffingAgencyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [initialLinkUrl, setInitialLinkUrl] = useState('')
  const jobTitleInputRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedCompany = companyName.trim()
    const trimmedStaffingAgencyName = staffingAgencyName.trim()
    const trimmedTitle = jobTitle.trim()
    const trimmedInitialLinkUrl = initialLinkUrl.trim()

    if (!trimmedTitle) {
      return
    }

    await onCreateJob({
      companyName: trimmedCompany,
      staffingAgencyName: trimmedStaffingAgencyName,
      jobTitle: trimmedTitle,
      ...(trimmedInitialLinkUrl ? { initialLinkUrl: trimmedInitialLinkUrl } : {}),
    })
    setCompanyName('')
    setStaffingAgencyName('')
    setJobTitle('')
    setInitialLinkUrl('')
    jobTitleInputRef.current?.focus()
  }

  return (
    <section className="max-w-4xl rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
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
            <span className="font-medium">Company name (optional)</span>
            <input
              className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm text-app-text-muted">
            <span className="font-medium">Staffing agency name (optional)</span>
            <input
              className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
              value={staffingAgencyName}
              onChange={(event) => setStaffingAgencyName(event.target.value)}
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
  )
}

export const JobsPage = () => {
  usePageTitle(createStaticPageTitle('Jobs'))

  const { createJob, deleteJob } = useJobMutations()
  const { data, error, isLoading } = useJobsListQuery()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Jobs</h1>
        <p className="mt-2 text-sm text-app-text-subtle">Keep track of the roles you're pursuing and everything connected to each one.</p>
      </div>

      <JobsQuickAddForm onCreateJob={createJob} />

      {error ? (
        <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft px-4 py-3 text-sm text-app-status-rejected">
          Unable to refresh jobs right now. Showing the most recently cached result if available.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        {isLoading && !data ? <p className="p-6 text-sm text-app-text-subtle">Loading jobs...</p> : <JobsTable jobs={data?.items ?? []} onDeleteJob={deleteJob} />}
      </section>
    </div>
  )
}

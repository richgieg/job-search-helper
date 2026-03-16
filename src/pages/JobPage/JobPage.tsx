import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ActionToggle } from '../../components/CompactActionControls'
import { FinalOutcomeStrip, type FinalOutcomeDraftStatus } from './FinalOutcomeStrip'
import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { JobChildEditors } from './JobChildEditors'
import { useJobEditorModel } from '../../features/jobs/use-job-editor-model'
import { useJobMutations } from '../../features/jobs/use-job-mutations'
import { formatJobComputedStatus, getJobComputedStatus, getJobComputedStatusBadgeClassName } from '../../features/jobs/job-status'
import { useJobDetailQuery } from '../../queries/use-job-detail-query'
import { useJobPagePanelState } from '../../store/app-ui-store'
import type { EmploymentType, Job, WorkArrangement } from '../../types/state'
import { employmentTypeOptions, workArrangementOptions } from '../../utils/job-field-options'
import { useCommitOnUnmountIfFocused } from '../../utils/use-commit-on-unmount-if-focused'

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
}) => {
  const { handleBlur, handleFocus } = useCommitOnUnmountIfFocused(onBlur)

  return (
    <label className="flex flex-col gap-2 text-sm text-app-text-muted">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
        placeholder={placeholder}
        type={type}
        value={value}
        onBlur={handleBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
      />
    </label>
  )
}

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
}) => {
  const { handleBlur, handleFocus } = useCommitOnUnmountIfFocused(onBlur)

  return (
    <label className="flex flex-col gap-2 text-sm text-app-text-muted">
      <span className="font-medium">{label}</span>
      <textarea
        className="min-h-24 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
        value={value}
        onBlur={handleBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
      />
    </label>
  )
}

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
}) => {
  const { handleBlur, handleFocus } = useCommitOnUnmountIfFocused(onBlur)

  return (
    <label className="flex flex-col gap-2 text-sm text-app-text-muted">
      <span className="font-medium">{label}</span>
      <select
        className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
        value={value}
        onBlur={handleBlur}
        onChange={(event) => onChange(event.target.value as T)}
        onFocus={handleFocus}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

interface JobDraftState {
  companyName: string
  staffingAgencyName: string
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
  staffingAgencyName: job.staffingAgencyName,
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

export const JobPage = () => {
  const { jobId = '' } = useParams()
  const { clearJobAppliedAt, clearJobFinalOutcome, setJobAppliedAt, setJobFinalOutcome, updateJob } = useJobMutations()
  const { data: jobDetail, error, isLoading } = useJobDetailQuery(jobId)
  const jobDetailsPanel = useJobPagePanelState(jobId, 'job-details')
  const editorModel = useJobEditorModel(jobDetail)
  const [draft, setDraft] = useState<JobDraftState | null>(null)
  const job = jobDetail?.job
  const interviewCount = useMemo(() => jobDetail?.interviews.length ?? 0, [jobDetail?.interviews.length])
  const computedStatus = useMemo(
    () =>
      jobDetail?.computedStatus ??
      getJobComputedStatus({
        appliedAt: job?.appliedAt ?? null,
        finalOutcome: job?.finalOutcome ?? null,
        interviewCount,
      }),
    [interviewCount, job?.appliedAt, job?.finalOutcome, jobDetail?.computedStatus],
  )

  useEffect(() => {
    if (!job) {
      setDraft(null)
      return
    }

    setDraft(createJobDraft(job))
  }, [job])

  if (isLoading && !job) {
    return <p className="text-sm text-app-text-subtle">Loading job...</p>
  }

  if (error && !job) {
    return (
      <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-app-heading">Unable to load job</h1>
        <p className="mt-3 text-sm text-app-status-rejected">The job details could not be refreshed right now.</p>
        <Link className="mt-5 inline-flex rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to="/jobs">
          Back to jobs
        </Link>
      </div>
    )
  }

  if (!job) {
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

  const activeDraft: JobDraftState = draft ?? createJobDraft(job)
  const organizationName = job.companyName || job.staffingAgencyName || 'Unknown organization'

  const commitRequiredField = (field: 'jobTitle', value: string) => {
    const nextDraft = activeDraft
    const trimmed = value.trim()

    if (!trimmed) {
      setDraft({ ...nextDraft, [field]: job[field] })
      return
    }

    if (trimmed === job[field]) {
      if (value !== trimmed) {
        setDraft({ ...nextDraft, [field]: trimmed })
      }
      return
    }

    void updateJob({
      jobId: job.id,
      changes: {
        [field]: trimmed,
      },
    })

    if (value !== trimmed) {
      setDraft({ ...nextDraft, [field]: trimmed })
    }
  }

  const commitOptionalTextField = (field: 'companyName' | 'staffingAgencyName', value: string) => {
    const trimmed = value.trim()

    if (trimmed === job[field]) {
      if (value !== trimmed) {
        setDraft({ ...activeDraft, [field]: trimmed })
      }
      return
    }

    void updateJob({
      jobId: job.id,
      changes: {
        [field]: trimmed,
      },
    })

    if (value !== trimmed) {
      setDraft({ ...activeDraft, [field]: trimmed })
    }
  }

  const commitTextField = (
    field: 'description' | 'location' | 'postedCompensation' | 'desiredCompensation' | 'compensationNotes' | 'notes',
    value: string,
  ) => {
    if (value === job[field]) {
      return
    }

    void updateJob({
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

    void updateJob({
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

    void updateJob({
      jobId: job.id,
      changes: {
        datePosted: nextValue,
      },
    })
  }

  const handleAppliedToggle = (checked: boolean) => {
    if (checked) {
      void setJobAppliedAt({
        jobId: job.id,
        appliedAt: new Date().toISOString(),
      })
      return
    }

    void clearJobAppliedAt(job.id)
  }

  const handleFinalOutcomeChange = (value: FinalOutcomeDraftStatus) => {
    if (!value) {
      void clearJobFinalOutcome(job.id)
      return
    }

    void setJobFinalOutcome({
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
            <span>{organizationName}</span>
            <span className={['rounded-full px-3 py-1 text-xs font-medium', getJobComputedStatusBadgeClassName(computedStatus)].join(' ')}>{formatJobComputedStatus(computedStatus)}</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft px-4 py-3 text-sm text-app-status-rejected">
          Unable to refresh this job right now. Showing the most recently cached result if available.
        </div>
      ) : null}

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

      <CollapsiblePanel
        description="Capture the core job details used across the app."
        expanded={jobDetailsPanel.expanded}
        onExpandedChange={jobDetailsPanel.onExpandedChange}
        title="Job details"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <TextField label="Job title" value={activeDraft.jobTitle} onBlur={() => commitRequiredField('jobTitle', activeDraft.jobTitle)} onChange={(value) => setDraft({ ...activeDraft, jobTitle: value })} />
          <TextField label="Company name" value={activeDraft.companyName} onBlur={() => commitOptionalTextField('companyName', activeDraft.companyName)} onChange={(value) => setDraft({ ...activeDraft, companyName: value })} />
          <TextField label="Staffing agency name" value={activeDraft.staffingAgencyName} onBlur={() => commitOptionalTextField('staffingAgencyName', activeDraft.staffingAgencyName)} onChange={(value) => setDraft({ ...activeDraft, staffingAgencyName: value })} />
          <TextField label="Location" value={activeDraft.location} onBlur={() => commitTextField('location', activeDraft.location)} onChange={(value) => setDraft({ ...activeDraft, location: value })} />
          <TextField label="Date posted" type="date" value={activeDraft.datePosted} onBlur={() => commitDatePosted(activeDraft.datePosted)} onChange={(value) => setDraft({ ...activeDraft, datePosted: value })} />
          <SelectField label="Work arrangement" options={workArrangementOptions} value={activeDraft.workArrangement} onBlur={() => commitSelectField('workArrangement', activeDraft.workArrangement)} onChange={(value) => setDraft({ ...activeDraft, workArrangement: value })} />
          <SelectField label="Employment type" options={employmentTypeOptions} value={activeDraft.employmentType} onBlur={() => commitSelectField('employmentType', activeDraft.employmentType)} onChange={(value) => setDraft({ ...activeDraft, employmentType: value })} />
          <TextField label="Posted compensation" value={activeDraft.postedCompensation} onBlur={() => commitTextField('postedCompensation', activeDraft.postedCompensation)} onChange={(value) => setDraft({ ...activeDraft, postedCompensation: value })} />
          <TextField label="Desired compensation" value={activeDraft.desiredCompensation} onBlur={() => commitTextField('desiredCompensation', activeDraft.desiredCompensation)} onChange={(value) => setDraft({ ...activeDraft, desiredCompensation: value })} />
          <div className="xl:col-span-2">
            <TextAreaField label="Compensation notes" value={activeDraft.compensationNotes} onBlur={() => commitTextField('compensationNotes', activeDraft.compensationNotes)} onChange={(value) => setDraft({ ...activeDraft, compensationNotes: value })} />
          </div>
          <div className="xl:col-span-2">
            <TextAreaField label="Description" value={activeDraft.description} onBlur={() => commitTextField('description', activeDraft.description)} onChange={(value) => setDraft({ ...activeDraft, description: value })} />
          </div>
          <div className="xl:col-span-2">
            <TextAreaField label="Notes" value={activeDraft.notes} onBlur={() => commitTextField('notes', activeDraft.notes)} onChange={(value) => setDraft({ ...activeDraft, notes: value })} />
          </div>
        </div>
      </CollapsiblePanel>

      <JobChildEditors
        applicationQuestionsModel={editorModel.applicationQuestions}
        companyName={job.companyName}
        contactsModel={editorModel.contacts}
        interviewsModel={editorModel.interviews}
        jobId={job.id}
        linksModel={editorModel.links}
        profilesModel={editorModel.profiles}
        staffingAgencyName={job.staffingAgencyName}
      />
    </div>
  )
}
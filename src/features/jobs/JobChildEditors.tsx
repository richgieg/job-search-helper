import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getJobComputedStatus } from './job-status'
import { useAppStore } from '../../store/app-store'
import type { ContactRelationshipType, JobEventType, JobPostingSourceType } from '../../types/state'

const Section = ({
  title,
  description,
  actionLabel,
  onAdd,
  children,
}: {
  title: string
  description: string
  actionLabel: string
  onAdd: () => void
  children: ReactNode
}) => (
  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        onClick={onAdd}
        type="button"
      >
        {actionLabel}
      </button>
    </div>
    <div className="mt-4 space-y-4">{children}</div>
  </section>
)

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
  type?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'datetime-local'
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

const ItemActions = ({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) => (
  <div className="flex flex-wrap gap-2">
    <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onSave} type="button">
      Save
    </button>
    <button className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={onDelete} type="button">
      Delete
    </button>
  </div>
)

const toDateTimeLocal = (value: string | null) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const fromDateTimeLocal = (value: string) => (value ? new Date(value).toISOString() : null)

const JobPostingSourceCard = ({ jobPostingSourceId }: { jobPostingSourceId: string }) => {
  const source = useAppStore((state) => state.data.jobPostingSources[jobPostingSourceId])
  const updateJobPostingSource = useAppStore((state) => state.actions.updateJobPostingSource)
  const deleteJobPostingSource = useAppStore((state) => state.actions.deleteJobPostingSource)
  const [draft, setDraft] = useState(source)

  useEffect(() => {
    setDraft(source)
  }, [source])

  if (!source || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Source type</span>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            value={draft.sourceType}
            onChange={(event) => setDraft({ ...draft, sourceType: event.target.value as JobPostingSourceType })}
          >
            <option value="linkedin">LinkedIn</option>
            <option value="workday">Workday</option>
            <option value="greenhouse">Greenhouse</option>
            <option value="indeed">Indeed</option>
            <option value="company_site">Company site</option>
            <option value="other">Other</option>
          </select>
        </label>
        <TextField label="Label" value={draft.label} onChange={(value) => setDraft({ ...draft, label: value })} />
        <TextField label="URL" type="url" value={draft.url} onChange={(value) => setDraft({ ...draft, url: value })} />
        <div className="xl:col-span-3 flex justify-end">
          <ItemActions
            onDelete={() => deleteJobPostingSource(source.id)}
            onSave={() =>
              updateJobPostingSource({
                jobPostingSourceId: source.id,
                changes: {
                  label: draft.label,
                  sourceType: draft.sourceType,
                  url: draft.url,
                  sortOrder: draft.sortOrder,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

const JobContactCard = ({ jobContactId }: { jobContactId: string }) => {
  const contact = useAppStore((state) => state.data.jobContacts[jobContactId])
  const updateJobContact = useAppStore((state) => state.actions.updateJobContact)
  const deleteJobContact = useAppStore((state) => state.actions.deleteJobContact)
  const [draft, setDraft] = useState(contact)

  useEffect(() => {
    setDraft(contact)
  }, [contact])

  if (!contact || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Company" value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Relationship type</span>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            value={draft.relationshipType}
            onChange={(event) => setDraft({ ...draft, relationshipType: event.target.value as ContactRelationshipType })}
          >
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring manager</option>
            <option value="referral">Referral</option>
            <option value="interviewer">Interviewer</option>
            <option value="other">Other</option>
          </select>
        </label>
        <TextField label="Email" type="email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
        <TextField label="Phone" type="tel" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
        <TextField label="LinkedIn URL" type="url" value={draft.linkedinUrl} onChange={(value) => setDraft({ ...draft, linkedinUrl: value })} />
        <TextField label="Address line 1" value={draft.addressLine1} onChange={(value) => setDraft({ ...draft, addressLine1: value })} />
        <TextField label="Address line 2" value={draft.addressLine2} onChange={(value) => setDraft({ ...draft, addressLine2: value })} />
        <TextField label="Address line 3" value={draft.addressLine3} onChange={(value) => setDraft({ ...draft, addressLine3: value })} />
        <TextField label="Address line 4" value={draft.addressLine4} onChange={(value) => setDraft({ ...draft, addressLine4: value })} />
        <div className="xl:col-span-3">
          <TextAreaField label="Notes" value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} />
        </div>
        <div className="xl:col-span-3 flex justify-end">
          <ItemActions
            onDelete={() => deleteJobContact(contact.id)}
            onSave={() => updateJobContact({ jobContactId: contact.id, changes: draft })}
          />
        </div>
      </div>
    </div>
  )
}

const JobEventCard = ({ jobEventId }: { jobEventId: string }) => {
  const jobEvent = useAppStore((state) => state.data.jobEvents[jobEventId])
  const updateJobEvent = useAppStore((state) => state.actions.updateJobEvent)
  const deleteJobEvent = useAppStore((state) => state.actions.deleteJobEvent)
  const [draft, setDraft] = useState(jobEvent)

  useEffect(() => {
    setDraft(jobEvent)
  }, [jobEvent])

  if (!jobEvent || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Event type</span>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            value={draft.eventType}
            onChange={(event) => setDraft({ ...draft, eventType: event.target.value as JobEventType })}
          >
            <option value="job_saved">Job saved</option>
            <option value="applied">Applied</option>
            <option value="interview_scheduled">Interview scheduled</option>
            <option value="interview_completed">Interview completed</option>
            <option value="offer_received">Offer received</option>
            <option value="rejected">Rejected</option>
            <option value="withdrew">Withdrew</option>
          </select>
        </label>
        <TextField
          label="Occurred at"
          type="datetime-local"
          value={toDateTimeLocal(draft.occurredAt)}
          onChange={(value) => setDraft({ ...draft, occurredAt: fromDateTimeLocal(value) })}
        />
        <TextField
          label="Scheduled for"
          type="datetime-local"
          value={toDateTimeLocal(draft.scheduledFor)}
          onChange={(value) => setDraft({ ...draft, scheduledFor: fromDateTimeLocal(value) })}
        />
        <div className="xl:col-span-3">
          <TextAreaField label="Notes" value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} />
        </div>
        <div className="xl:col-span-3 flex justify-end">
          <ItemActions
            onDelete={() => deleteJobEvent(jobEvent.id)}
            onSave={() =>
              updateJobEvent({
                jobEventId: jobEvent.id,
                changes: {
                  eventType: draft.eventType,
                  occurredAt: draft.occurredAt,
                  scheduledFor: draft.scheduledFor,
                  notes: draft.notes,
                  metadata: draft.metadata,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

const ApplicationQuestionCard = ({ applicationQuestionId }: { applicationQuestionId: string }) => {
  const applicationQuestion = useAppStore((state) => state.data.applicationQuestions[applicationQuestionId])
  const updateApplicationQuestion = useAppStore((state) => state.actions.updateApplicationQuestion)
  const deleteApplicationQuestion = useAppStore((state) => state.actions.deleteApplicationQuestion)
  const [draft, setDraft] = useState(applicationQuestion)

  useEffect(() => {
    setDraft(applicationQuestion)
  }, [applicationQuestion])

  if (!applicationQuestion || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-1">
        <TextAreaField label="Question" value={draft.question} onChange={(value) => setDraft({ ...draft, question: value })} />
        <TextAreaField label="Answer" value={draft.answer} onChange={(value) => setDraft({ ...draft, answer: value })} />
        <div className="flex justify-end">
          <ItemActions
            onDelete={() => deleteApplicationQuestion(applicationQuestion.id)}
            onSave={() =>
              updateApplicationQuestion({
                applicationQuestionId: applicationQuestion.id,
                changes: {
                  question: draft.question,
                  answer: draft.answer,
                  sortOrder: draft.sortOrder,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

export const JobChildEditors = ({ jobId }: { jobId: string }) => {
  const profilesById = useAppStore((state) => state.data.profiles)
  const jobPostingSourcesById = useAppStore((state) => state.data.jobPostingSources)
  const jobContactsById = useAppStore((state) => state.data.jobContacts)
  const applicationQuestionsById = useAppStore((state) => state.data.applicationQuestions)
  const jobEventsById = useAppStore((state) => state.data.jobEvents)
  const createJobPostingSource = useAppStore((state) => state.actions.createJobPostingSource)
  const createJobContact = useAppStore((state) => state.actions.createJobContact)
  const createApplicationQuestion = useAppStore((state) => state.actions.createApplicationQuestion)
  const createJobEvent = useAppStore((state) => state.actions.createJobEvent)
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const deleteProfile = useAppStore((state) => state.actions.deleteProfile)

  const attachedProfiles = useMemo(
    () =>
      Object.values(profilesById)
        .filter((profile) => profile.jobId === jobId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [jobId, profilesById],
  )

  const jobPostingSourceIds = useMemo(
    () =>
      Object.values(jobPostingSourcesById)
        .filter((item) => item.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [jobId, jobPostingSourcesById],
  )

  const jobContactIds = useMemo(
    () =>
      Object.values(jobContactsById)
        .filter((item) => item.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [jobContactsById, jobId],
  )

  const jobEvents = useMemo(
    () =>
      Object.values(jobEventsById)
        .filter((item) => item.jobId === jobId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [jobEventsById, jobId],
  )

  const applicationQuestionIds = useMemo(
    () =>
      Object.values(applicationQuestionsById)
        .filter((item) => item.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [applicationQuestionsById, jobId],
  )

  const status = useMemo(() => getJobComputedStatus(jobEvents.map((item) => item.eventType)), [jobEvents])

  return (
    <div className="mt-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Attached profiles</h3>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {attachedProfiles.length === 0 ? (
            <p className="text-sm text-slate-500">No job profiles attached yet.</p>
          ) : (
            attachedProfiles.map((profile) => (
              <div key={profile.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{profile.name}</p>
                  <p className="mt-1 text-sm text-slate-500">Updated {new Date(profile.updatedAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    to={`/profiles/${profile.id}`}
                  >
                    Open
                  </Link>
                  <Link
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    to={`/previews/cover-letter/${profile.id}`}
                  >
                    Cover letter
                  </Link>
                  <Link
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    to={`/previews/resume/${profile.id}`}
                  >
                    Resume
                  </Link>
                  <Link
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    to={`/previews/application/${profile.id}`}
                  >
                    Application
                  </Link>
                  <button
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => duplicateProfile({ sourceProfileId: profile.id })}
                    type="button"
                  >
                    Duplicate
                  </button>
                  <button
                    className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      const confirmed = window.confirm(`Delete profile "${profile.name}"? This cannot be undone.`)
                      if (!confirmed) {
                        return
                      }

                      deleteProfile(profile.id)
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Section actionLabel="Add posting source" description="Track the different URLs and systems where this job appears." onAdd={() => createJobPostingSource(jobId)} title="Posting sources">
        {jobPostingSourceIds.length === 0 ? <p className="text-sm text-slate-500">No posting sources yet.</p> : jobPostingSourceIds.map((id) => <JobPostingSourceCard key={id} jobPostingSourceId={id} />)}
      </Section>

      <Section actionLabel="Add contact" description="Maintain recruiters, hiring managers, referrals, and interviewers for the job." onAdd={() => createJobContact(jobId)} title="Contacts">
        {jobContactIds.length === 0 ? <p className="text-sm text-slate-500">No contacts yet.</p> : jobContactIds.map((id) => <JobContactCard key={id} jobContactId={id} />)}
      </Section>

      <Section
        actionLabel="Add application question"
        description="Track custom questions asked during the application flow and the answers you submitted."
        onAdd={() => createApplicationQuestion(jobId)}
        title="Application questions"
      >
        {applicationQuestionIds.length === 0 ? (
          <p className="text-sm text-slate-500">No application questions yet.</p>
        ) : (
          applicationQuestionIds.map((id) => <ApplicationQuestionCard key={id} applicationQuestionId={id} />)
        )}
      </Section>

      <Section actionLabel="Add event" description="Events drive the job's computed pipeline status." onAdd={() => createJobEvent({ jobId })} title="Events">
        {jobEvents.length === 0 ? <p className="text-sm text-slate-500">No events yet.</p> : jobEvents.map((item) => <JobEventCard key={item.id} jobEventId={item.id} />)}
      </Section>
    </div>
  )
}

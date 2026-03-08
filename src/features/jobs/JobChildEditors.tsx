import { useEffect, useMemo, useState } from 'react'

import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { ReorderButtons } from '../../components/ReorderButtons'
import { useAppStore } from '../../store/app-store'
import type { ContactRelationshipType, JobEventType } from '../../types/state'
import { moveOrderedItem } from '../../utils/reorder'

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
  type?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'datetime-local'
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

const DeleteButton = ({ onDelete }: { onDelete: () => void }) => (
  <button className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={onDelete} type="button">
    Delete
  </button>
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

const JobLinkCard = ({ jobLinkId }: { jobLinkId: string }) => {
  const link = useAppStore((state) => state.data.jobLinks[jobLinkId])
  const jobLinksById = useAppStore((state) => state.data.jobLinks)
  const updateJobLink = useAppStore((state) => state.actions.updateJobLink)
  const deleteJobLink = useAppStore((state) => state.actions.deleteJobLink)
  const reorderJobLinks = useAppStore((state) => state.actions.reorderJobLinks)
  const [draft, setDraft] = useState(link)

  const jobLinkIds = useMemo(
    () =>
      link
        ? Object.values(jobLinksById)
            .filter((item) => item.jobId === link.jobId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [jobLinksById, link],
  )
  const jobLinkIndex = jobLinkIds.indexOf(jobLinkId)

  useEffect(() => {
    setDraft(link)
  }, [link])

  if (!link || !draft) {
    return null
  }

  const commitLinkChanges = (changes: Partial<typeof link>) => {
    updateJobLink({
      jobLinkId: link.id,
      changes,
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <TextField label="Name" value={draft.name} onBlur={() => draft.name !== link.name && commitLinkChanges({ name: draft.name })} onChange={(value) => setDraft({ ...draft, name: value })} />
        </div>
        <div className="min-w-0 flex-1">
          <TextField label="URL" type="url" value={draft.url} onBlur={() => draft.url !== link.url && commitLinkChanges({ url: draft.url })} onChange={(value) => setDraft({ ...draft, url: value })} />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 self-end">
          <ReorderButtons
            canMoveDown={jobLinkIds.length > 1}
            canMoveUp={jobLinkIds.length > 1}
            onMoveDown={() =>
              reorderJobLinks({
                jobId: link.jobId,
                orderedIds: moveOrderedItem(jobLinkIds, jobLinkIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderJobLinks({
                jobId: link.jobId,
                orderedIds: moveOrderedItem(jobLinkIds, jobLinkIndex, -1),
              })
            }
          />
          <DeleteButton onDelete={() => deleteJobLink(link.id)} />
        </div>
      </div>
    </div>
  )
}

const JobContactCard = ({ jobContactId }: { jobContactId: string }) => {
  const contact = useAppStore((state) => state.data.jobContacts[jobContactId])
  const jobContactsById = useAppStore((state) => state.data.jobContacts)
  const updateJobContact = useAppStore((state) => state.actions.updateJobContact)
  const deleteJobContact = useAppStore((state) => state.actions.deleteJobContact)
  const reorderJobContacts = useAppStore((state) => state.actions.reorderJobContacts)
  const [draft, setDraft] = useState(contact)

  const jobContactIds = useMemo(
    () =>
      contact
        ? Object.values(jobContactsById)
            .filter((item) => item.jobId === contact.jobId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [contact, jobContactsById],
  )
  const jobContactIndex = jobContactIds.indexOf(jobContactId)

  useEffect(() => {
    setDraft(contact)
  }, [contact])

  if (!contact || !draft) {
    return null
  }

  const commitContactChanges = (changes: Partial<typeof contact>) => {
    updateJobContact({
      jobContactId: contact.id,
      changes,
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Name" value={draft.name} onBlur={() => draft.name !== contact.name && commitContactChanges({ name: draft.name })} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Title" value={draft.title} onBlur={() => draft.title !== contact.title && commitContactChanges({ title: draft.title })} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Company" value={draft.company} onBlur={() => draft.company !== contact.company && commitContactChanges({ company: draft.company })} onChange={(value) => setDraft({ ...draft, company: value })} />
        <SelectField
          label="Relationship type"
          options={[
            { value: 'recruiter', label: 'Recruiter' },
            { value: 'hiring_manager', label: 'Hiring manager' },
            { value: 'referral', label: 'Referral' },
            { value: 'interviewer', label: 'Interviewer' },
            { value: 'other', label: 'Other' },
          ]}
          value={draft.relationshipType}
          onBlur={() => draft.relationshipType !== contact.relationshipType && commitContactChanges({ relationshipType: draft.relationshipType })}
          onChange={(value) => setDraft({ ...draft, relationshipType: value as ContactRelationshipType })}
        />
        <TextField label="Email" type="email" value={draft.email} onBlur={() => draft.email !== contact.email && commitContactChanges({ email: draft.email })} onChange={(value) => setDraft({ ...draft, email: value })} />
        <TextField label="Phone" type="tel" value={draft.phone} onBlur={() => draft.phone !== contact.phone && commitContactChanges({ phone: draft.phone })} onChange={(value) => setDraft({ ...draft, phone: value })} />
        <TextField label="LinkedIn URL" type="url" value={draft.linkedinUrl} onBlur={() => draft.linkedinUrl !== contact.linkedinUrl && commitContactChanges({ linkedinUrl: draft.linkedinUrl })} onChange={(value) => setDraft({ ...draft, linkedinUrl: value })} />
        <TextField label="Address line 1" value={draft.addressLine1} onBlur={() => draft.addressLine1 !== contact.addressLine1 && commitContactChanges({ addressLine1: draft.addressLine1 })} onChange={(value) => setDraft({ ...draft, addressLine1: value })} />
        <TextField label="Address line 2" value={draft.addressLine2} onBlur={() => draft.addressLine2 !== contact.addressLine2 && commitContactChanges({ addressLine2: draft.addressLine2 })} onChange={(value) => setDraft({ ...draft, addressLine2: value })} />
        <TextField label="Address line 3" value={draft.addressLine3} onBlur={() => draft.addressLine3 !== contact.addressLine3 && commitContactChanges({ addressLine3: draft.addressLine3 })} onChange={(value) => setDraft({ ...draft, addressLine3: value })} />
        <TextField label="Address line 4" value={draft.addressLine4} onBlur={() => draft.addressLine4 !== contact.addressLine4 && commitContactChanges({ addressLine4: draft.addressLine4 })} onChange={(value) => setDraft({ ...draft, addressLine4: value })} />
        <div className="xl:col-span-3">
          <TextAreaField label="Notes" value={draft.notes} onBlur={() => draft.notes !== contact.notes && commitContactChanges({ notes: draft.notes })} onChange={(value) => setDraft({ ...draft, notes: value })} />
        </div>
        <div className="xl:col-span-3 flex flex-wrap items-center justify-end gap-2">
          <ReorderButtons
            canMoveDown={jobContactIds.length > 1}
            canMoveUp={jobContactIds.length > 1}
            onMoveDown={() =>
              reorderJobContacts({
                jobId: contact.jobId,
                orderedIds: moveOrderedItem(jobContactIds, jobContactIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderJobContacts({
                jobId: contact.jobId,
                orderedIds: moveOrderedItem(jobContactIds, jobContactIndex, -1),
              })
            }
          />
          <DeleteButton onDelete={() => deleteJobContact(contact.id)} />
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

  const commitEventChanges = (changes: Partial<typeof jobEvent>) => {
    updateJobEvent({
      jobEventId: jobEvent.id,
      changes,
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <SelectField
          label="Event type"
          options={[
            { value: 'job_saved', label: 'Job saved' },
            { value: 'applied', label: 'Applied' },
            { value: 'interview_scheduled', label: 'Interview scheduled' },
            { value: 'interview_completed', label: 'Interview completed' },
            { value: 'offer_received', label: 'Offer received' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'withdrew', label: 'Withdrew' },
          ]}
          value={draft.eventType}
          onBlur={() => draft.eventType !== jobEvent.eventType && commitEventChanges({ eventType: draft.eventType })}
          onChange={(value) => setDraft({ ...draft, eventType: value as JobEventType })}
        />
        <TextField
          label="Occurred at"
          type="datetime-local"
          value={toDateTimeLocal(draft.occurredAt)}
          onBlur={() => draft.occurredAt !== jobEvent.occurredAt && commitEventChanges({ occurredAt: draft.occurredAt })}
          onChange={(value) => setDraft({ ...draft, occurredAt: fromDateTimeLocal(value) })}
        />
        <TextField
          label="Scheduled for"
          type="datetime-local"
          value={toDateTimeLocal(draft.scheduledFor)}
          onBlur={() => draft.scheduledFor !== jobEvent.scheduledFor && commitEventChanges({ scheduledFor: draft.scheduledFor })}
          onChange={(value) => setDraft({ ...draft, scheduledFor: fromDateTimeLocal(value) })}
        />
        <div className="xl:col-span-3">
          <TextAreaField label="Notes" value={draft.notes} onBlur={() => draft.notes !== jobEvent.notes && commitEventChanges({ notes: draft.notes })} onChange={(value) => setDraft({ ...draft, notes: value })} />
        </div>
        <div className="xl:col-span-3 flex justify-end">
          <DeleteButton onDelete={() => deleteJobEvent(jobEvent.id)} />
        </div>
      </div>
    </div>
  )
}

const ApplicationQuestionCard = ({ applicationQuestionId }: { applicationQuestionId: string }) => {
  const applicationQuestion = useAppStore((state) => state.data.applicationQuestions[applicationQuestionId])
  const applicationQuestionsById = useAppStore((state) => state.data.applicationQuestions)
  const updateApplicationQuestion = useAppStore((state) => state.actions.updateApplicationQuestion)
  const deleteApplicationQuestion = useAppStore((state) => state.actions.deleteApplicationQuestion)
  const reorderApplicationQuestions = useAppStore((state) => state.actions.reorderApplicationQuestions)
  const [draft, setDraft] = useState(applicationQuestion)

  const applicationQuestionIds = useMemo(
    () =>
      applicationQuestion
        ? Object.values(applicationQuestionsById)
            .filter((item) => item.jobId === applicationQuestion.jobId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [applicationQuestion, applicationQuestionsById],
  )
  const applicationQuestionIndex = applicationQuestionIds.indexOf(applicationQuestionId)

  useEffect(() => {
    setDraft(applicationQuestion)
  }, [applicationQuestion])

  if (!applicationQuestion || !draft) {
    return null
  }

  const commitQuestionChanges = (changes: Partial<typeof applicationQuestion>) => {
    updateApplicationQuestion({
      applicationQuestionId: applicationQuestion.id,
      changes,
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-1">
        <TextAreaField label="Question" value={draft.question} onBlur={() => draft.question !== applicationQuestion.question && commitQuestionChanges({ question: draft.question })} onChange={(value) => setDraft({ ...draft, question: value })} />
        <TextAreaField label="Answer" value={draft.answer} onBlur={() => draft.answer !== applicationQuestion.answer && commitQuestionChanges({ answer: draft.answer })} onChange={(value) => setDraft({ ...draft, answer: value })} />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ReorderButtons
            canMoveDown={applicationQuestionIds.length > 1}
            canMoveUp={applicationQuestionIds.length > 1}
            onMoveDown={() =>
              reorderApplicationQuestions({
                jobId: applicationQuestion.jobId,
                orderedIds: moveOrderedItem(applicationQuestionIds, applicationQuestionIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderApplicationQuestions({
                jobId: applicationQuestion.jobId,
                orderedIds: moveOrderedItem(applicationQuestionIds, applicationQuestionIndex, -1),
              })
            }
          />
          <DeleteButton onDelete={() => deleteApplicationQuestion(applicationQuestion.id)} />
        </div>
      </div>
    </div>
  )
}

export const JobChildEditors = ({ jobId }: { jobId: string }) => {
  const jobLinksById = useAppStore((state) => state.data.jobLinks)
  const jobContactsById = useAppStore((state) => state.data.jobContacts)
  const applicationQuestionsById = useAppStore((state) => state.data.applicationQuestions)
  const jobEventsById = useAppStore((state) => state.data.jobEvents)
  const createJobLink = useAppStore((state) => state.actions.createJobLink)
  const createJobContact = useAppStore((state) => state.actions.createJobContact)
  const createApplicationQuestion = useAppStore((state) => state.actions.createApplicationQuestion)
  const createJobEvent = useAppStore((state) => state.actions.createJobEvent)

  const jobLinkIds = useMemo(
    () =>
      Object.values(jobLinksById)
        .filter((item) => item.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [jobId, jobLinksById],
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

  return (
    <>
      <CollapsiblePanel actionLabel="Add link" description="Track the relevant job URLs with short names." onAction={() => createJobLink(jobId)} title="Links">
        <div className="space-y-4">
          {jobLinkIds.length === 0 ? <p className="text-sm text-slate-500">No links yet.</p> : jobLinkIds.map((id) => <JobLinkCard key={id} jobLinkId={id} />)}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel actionLabel="Add contact" description="Maintain recruiters, hiring managers, referrals, and interviewers for the job." onAction={() => createJobContact(jobId)} title="Contacts">
        <div className="space-y-4">
          {jobContactIds.length === 0 ? <p className="text-sm text-slate-500">No contacts yet.</p> : jobContactIds.map((id) => <JobContactCard key={id} jobContactId={id} />)}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add application question"
        description="Track custom questions asked during the application flow and the answers you submitted."
        onAction={() => createApplicationQuestion(jobId)}
        title="Application questions"
      >
        <div className="space-y-4">
          {applicationQuestionIds.length === 0 ? (
            <p className="text-sm text-slate-500">No application questions yet.</p>
          ) : (
            applicationQuestionIds.map((id) => <ApplicationQuestionCard key={id} applicationQuestionId={id} />)
          )}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel actionLabel="Add event" description="Events drive the job's computed pipeline status." onAction={() => createJobEvent({ jobId })} title="Events">
        <div className="space-y-4">
          {jobEvents.length === 0 ? <p className="text-sm text-slate-500">No events yet.</p> : jobEvents.map((item) => <JobEventCard key={item.id} jobEventId={item.id} />)}
        </div>
      </CollapsiblePanel>
    </>
  )
}

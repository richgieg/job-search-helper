import { useEffect, useMemo, useState } from 'react'

import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { AddIconButton, DeleteIconButton } from '../../components/CompactActionControls'
import { ReorderButtons } from '../../components/ReorderButtons'
import { useAppStore } from '../../store/app-store'
import type { ContactRelationshipType, FinalOutcomeStatus } from '../../types/state'
import { moveOrderedItem } from '../../utils/reorder'

const summarizeParts = (parts: Array<string | null | undefined>) => parts.filter(Boolean).join(' • ')

const truncatePanelText = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

const formatRelationshipType = (relationshipType: ContactRelationshipType) => {
  switch (relationshipType) {
    case 'hiring_manager':
      return 'Hiring manager'
    case 'recruiter':
      return 'Recruiter'
    case 'referral':
      return 'Referral'
    case 'interviewer':
      return 'Interviewer'
    default:
      return 'Other'
  }
}

const formatFinalOutcomeStatus = (status: FinalOutcomeStatus) => {
  switch (status) {
    case 'offer_received':
      return 'Offer received'
    case 'offer_accepted':
      return 'Offer accepted'
    case 'rejected':
      return 'Rejected'
    case 'withdrew':
      return 'Withdrew'
    default:
      return status
  }
}

const TextField = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'datetime-local'
}) => (
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    {label ? <span className="font-medium">{label}</span> : null}
    <input
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
      placeholder={placeholder}
      spellCheck={type === 'url' ? false : undefined}
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

const formatInterviewTitleDate = (value: string | null) => {
  if (!value) {
    return 'Not scheduled yet'
  }

  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatInterviewTime = (value: string | null) => {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatInterviewTitle = (startAt: string | null) => {
  if (!startAt) {
    return 'Not scheduled yet'
  }

  return formatInterviewTitleDate(startAt)
}

const formatInterviewSummary = (startAt: string | null) => {
  if (!startAt) {
    return 'Please set the start date and time'
  }

  const start = formatInterviewTime(startAt)

  return summarizeParts([start || null])
}

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
          <TextField placeholder="https://example.com/job" type="url" value={draft.url} onBlur={() => draft.url !== link.url && commitLinkChanges({ url: draft.url })} onChange={(value) => setDraft({ ...draft, url: value })} />
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
          <DeleteIconButton label="Delete link" onDelete={() => deleteJobLink(link.id)} />
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

  const summary = summarizeParts([
    formatRelationshipType(draft.relationshipType),
    draft.title || null,
    draft.company || null,
  ])

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
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
          <DeleteIconButton label="Delete contact" onDelete={() => deleteJobContact(contact.id)} />
        </div>
      }
      summary={summary}
      title={draft.name || contact.name || 'Contact'}
    >
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
      </div>
    </CollapsiblePanel>
  )
}

type FinalOutcomeDraftStatus = '' | FinalOutcomeStatus

const JobFinalOutcomePanel = ({ jobId }: { jobId: string }) => {
  const job = useAppStore((state) => state.data.jobs[jobId])
  const setJobFinalOutcome = useAppStore((state) => state.actions.setJobFinalOutcome)
  const clearJobFinalOutcome = useAppStore((state) => state.actions.clearJobFinalOutcome)
  const [finalOutcomeStatusDraft, setFinalOutcomeStatusDraft] = useState<FinalOutcomeDraftStatus>('')
  const [finalOutcomeSetAtDraft, setFinalOutcomeSetAtDraft] = useState('')

  useEffect(() => {
    if (!job) {
      setFinalOutcomeStatusDraft('')
      setFinalOutcomeSetAtDraft('')
      return
    }

    setFinalOutcomeStatusDraft(job.finalOutcome?.status ?? '')
    setFinalOutcomeSetAtDraft(toDateTimeLocal(job.finalOutcome?.setAt ?? null))
  }, [job])

  if (!job) {
    return null
  }

  const commitFinalOutcome = () => {
    if (!finalOutcomeStatusDraft) {
      if (job.finalOutcome) {
        clearJobFinalOutcome(job.id)
      }
      return
    }

    const nextSetAt = fromDateTimeLocal(finalOutcomeSetAtDraft)

    if (!nextSetAt) {
      setFinalOutcomeSetAtDraft(toDateTimeLocal(job.finalOutcome?.setAt ?? new Date().toISOString()))
      return
    }

    if (job.finalOutcome?.status === finalOutcomeStatusDraft && job.finalOutcome?.setAt === nextSetAt) {
      return
    }

    setJobFinalOutcome({
      jobId: job.id,
      status: finalOutcomeStatusDraft,
      setAt: nextSetAt,
    })
  }

  const summary = job.finalOutcome ? `${formatFinalOutcomeStatus(job.finalOutcome.status)} ${toDateTimeLocal(job.finalOutcome.setAt).replace('T', ' ')}` : 'No final outcome'

  return (
    <CollapsiblePanel description={summary} title="Final outcome">
      <div className="grid gap-4 lg:grid-cols-2">
        <SelectField
          label="Final outcome"
          options={[
            { value: '', label: 'None' },
            { value: 'withdrew', label: 'Withdrew' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'offer_received', label: 'Offer received' },
            { value: 'offer_accepted', label: 'Offer accepted' },
          ]}
          value={finalOutcomeStatusDraft}
          onBlur={commitFinalOutcome}
          onChange={setFinalOutcomeStatusDraft}
        />
        <div className="flex items-end gap-2">
          <TextField label="Outcome set at" type="datetime-local" value={finalOutcomeSetAtDraft} onBlur={commitFinalOutcome} onChange={setFinalOutcomeSetAtDraft} />
          <button className="mb-[1px] rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => { setFinalOutcomeStatusDraft(''); setFinalOutcomeSetAtDraft(''); clearJobFinalOutcome(job.id) }} type="button">
            Clear outcome
          </button>
        </div>
      </div>
    </CollapsiblePanel>
  )
}

const InterviewCard = ({ interviewId }: { interviewId: string }) => {
  const interview = useAppStore((state) => state.data.interviews[interviewId])
  const interviewContactsById = useAppStore((state) => state.data.interviewContacts)
  const jobContactsById = useAppStore((state) => state.data.jobContacts)
  const updateInterview = useAppStore((state) => state.actions.updateInterview)
  const deleteInterview = useAppStore((state) => state.actions.deleteInterview)
  const addInterviewContact = useAppStore((state) => state.actions.addInterviewContact)
  const removeInterviewContact = useAppStore((state) => state.actions.removeInterviewContact)
  const reorderInterviewContacts = useAppStore((state) => state.actions.reorderInterviewContacts)
  const [draft, setDraft] = useState(interview)
  const [selectedContactId, setSelectedContactId] = useState('')

  useEffect(() => {
    setDraft(interview)
  }, [interview])

  const interviewContactIds = useMemo(
    () =>
      interview
        ? Object.values(interviewContactsById)
            .filter((item) => item.interviewId === interview.id)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [interview, interviewContactsById],
  )

  const availableContacts = useMemo(() => {
    if (!interview) {
      return []
    }

    const associatedContactIds = new Set(
      Object.values(interviewContactsById)
        .filter((item) => item.interviewId === interview.id)
        .map((item) => item.jobContactId),
    )

    return Object.values(jobContactsById)
      .filter((contact) => contact.jobId === interview.jobId && !associatedContactIds.has(contact.id))
      .sort((left, right) => left.sortOrder - right.sortOrder)
  }, [interview, interviewContactsById, jobContactsById])

  useEffect(() => {
    setSelectedContactId((current) => {
      if (current && availableContacts.some((contact) => contact.id === current)) {
        return current
      }

      return availableContacts[0]?.id ?? ''
    })
  }, [availableContacts])

  if (!interview || !draft) {
    return null
  }

  const commitInterviewChanges = (changes: Partial<typeof interview>) => {
    updateInterview({
      interviewId: interview.id,
      changes,
    })
  }

  const associatedContacts = interviewContactIds
    .map((associationId) => {
      const association = interviewContactsById[associationId]
      const contact = association ? jobContactsById[association.jobContactId] : null

      return association && contact ? { association, contact } : null
    })
    .filter(Boolean) as Array<{
    association: NonNullable<(typeof interviewContactsById)[string]>
    contact: NonNullable<(typeof jobContactsById)[string]>
  }>

  return (
    <CollapsiblePanel
      summary={formatInterviewSummary(draft.startAt)}
      title={formatInterviewTitle(draft.startAt)}
      headerActions={<DeleteIconButton label="Delete interview" onDelete={() => deleteInterview(interview.id)} />}
    >
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-1">
          <TextField
            label="Start at"
            type="datetime-local"
            value={toDateTimeLocal(draft.startAt)}
            onBlur={() => draft.startAt !== interview.startAt && commitInterviewChanges({ startAt: draft.startAt })}
            onChange={(value) => setDraft({ ...draft, startAt: fromDateTimeLocal(value) })}
          />
          <div className="xl:col-span-1">
            <TextAreaField label="Notes" value={draft.notes} onBlur={() => draft.notes !== interview.notes && commitInterviewChanges({ notes: draft.notes })} onChange={(value) => setDraft({ ...draft, notes: value })} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <SelectField
                label="Add associated contact"
                options={[
                  { value: '', label: availableContacts.length === 0 ? 'No remaining contacts' : 'Select a contact' },
                  ...availableContacts.map((contact) => ({
                    value: contact.id,
                    label: contact.name || contact.title || contact.company || 'Unnamed contact',
                  })),
                ]}
                value={selectedContactId}
                onChange={setSelectedContactId}
              />
            </div>
            <AddIconButton
              disabled={!selectedContactId}
              label="Add contact to interview"
              onAdd={() => {
                if (!selectedContactId) {
                  return
                }

                addInterviewContact({ interviewId: interview.id, jobContactId: selectedContactId })
              }}
            />
          </div>

          {associatedContacts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {associatedContacts.map(({ association, contact }, index) => (
                <div key={association.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{contact.name || 'Unnamed contact'}</p>
                    <p className="truncate text-xs text-slate-500">{summarizeParts([formatRelationshipType(contact.relationshipType), contact.title, contact.company]) || 'No details yet'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReorderButtons
                      canMoveDown={associatedContacts.length > 1 && index < associatedContacts.length - 1}
                      canMoveUp={associatedContacts.length > 1 && index > 0}
                      onMoveDown={() =>
                        reorderInterviewContacts({
                          interviewId: interview.id,
                          orderedIds: moveOrderedItem(interviewContactIds, index, 1),
                        })
                      }
                      onMoveUp={() =>
                        reorderInterviewContacts({
                          interviewId: interview.id,
                          orderedIds: moveOrderedItem(interviewContactIds, index, -1),
                        })
                      }
                    />
                    <DeleteIconButton label="Remove contact from interview" onDelete={() => removeInterviewContact(association.id)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No contacts associated with this interview yet.</p>
          )}
        </div>
      </div>
    </CollapsiblePanel>
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

  const title = truncatePanelText(draft.question, 96) || 'Application question'
  const summary = truncatePanelText(draft.answer, 180) || 'No answer'

  return (
    <CollapsiblePanel
      headerActions={
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
          <DeleteIconButton label="Delete application question" onDelete={() => deleteApplicationQuestion(applicationQuestion.id)} />
        </div>
      }
      summary={summary}
      title={title}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <TextAreaField label="Question" value={draft.question} onBlur={() => draft.question !== applicationQuestion.question && commitQuestionChanges({ question: draft.question })} onChange={(value) => setDraft({ ...draft, question: value })} />
        <TextAreaField label="Answer" value={draft.answer} onBlur={() => draft.answer !== applicationQuestion.answer && commitQuestionChanges({ answer: draft.answer })} onChange={(value) => setDraft({ ...draft, answer: value })} />
      </div>
    </CollapsiblePanel>
  )
}

export const JobChildEditors = ({ jobId }: { jobId: string }) => {
  const jobLinksById = useAppStore((state) => state.data.jobLinks)
  const jobContactsById = useAppStore((state) => state.data.jobContacts)
  const interviewsById = useAppStore((state) => state.data.interviews)
  const applicationQuestionsById = useAppStore((state) => state.data.applicationQuestions)
  const createJobLink = useAppStore((state) => state.actions.createJobLink)
  const createJobContact = useAppStore((state) => state.actions.createJobContact)
  const createInterview = useAppStore((state) => state.actions.createInterview)
  const createApplicationQuestion = useAppStore((state) => state.actions.createApplicationQuestion)

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

  const interviewIds = useMemo(
    () =>
      Object.values(interviewsById)
        .filter((item) => item.jobId === jobId)
        .sort((left, right) => {
          if (!left.startAt && !right.startAt) {
            return 0
          }

          if (!left.startAt) {
            return 1
          }

          if (!right.startAt) {
            return -1
          }

          return left.startAt.localeCompare(right.startAt)
        })
        .map((item) => item.id),
    [interviewsById, jobId],
  )

  const applicationQuestionIds = useMemo(
    () =>
      Object.values(applicationQuestionsById)
        .filter((item) => item.jobId === jobId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [applicationQuestionsById, jobId],
  )

  const hasJobLinks = jobLinkIds.length > 0
  const hasJobContacts = jobContactIds.length > 0
  const hasInterviews = interviewIds.length > 0
  const hasApplicationQuestions = applicationQuestionIds.length > 0

  return (
    <>
      <CollapsiblePanel actionLabel="Add link" actionStyle="icon" collapsible={hasJobLinks} description="Track the relevant job URLs for this role." onAction={() => createJobLink(jobId)} title="Links">
        {hasJobLinks ? <div className="space-y-4">{jobLinkIds.map((id) => <JobLinkCard key={id} jobLinkId={id} />)}</div> : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add application question"
        actionStyle="icon"
        collapsible={hasApplicationQuestions}
        description="Track custom questions asked during the application flow and the answers you submitted."
        onAction={() => createApplicationQuestion(jobId)}
        title="Application questions"
      >
        {hasApplicationQuestions ? (
          <div className="space-y-4">{applicationQuestionIds.map((id) => <ApplicationQuestionCard key={id} applicationQuestionId={id} />)}</div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel actionLabel="Add contact" actionStyle="icon" collapsible={hasJobContacts} description="Maintain recruiters, hiring managers, referrals, and interviewers for the job." onAction={() => createJobContact(jobId)} title="Contacts">
        {hasJobContacts ? <div className="space-y-4">{jobContactIds.map((id) => <JobContactCard key={id} jobContactId={id} />)}</div> : null}
      </CollapsiblePanel>

      <CollapsiblePanel actionLabel="Add interview" actionStyle="icon" collapsible={hasInterviews} description="Track interviews in chronological order." onAction={() => createInterview(jobId)} title="Interviews">
        {hasInterviews ? <div className="space-y-4">{interviewIds.map((id) => <InterviewCard key={id} interviewId={id} />)}</div> : null}
      </CollapsiblePanel>

      <JobFinalOutcomePanel jobId={jobId} />
    </>
  )
}
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { AddIconButton, DeleteIconButton, IconActionButton, getActionIconButtonClassName } from '../../components/CompactActionControls'
import { ReorderButtons } from '../../components/ReorderButtons'
import type { JobDetailInterviewDto } from '../../api/read-models'
import type {
  JobEditorApplicationQuestionsModel,
  JobEditorContactsModel,
  JobEditorInterviewsModel,
  JobEditorLinksModel,
  JobEditorProfilesModel,
} from '../../features/jobs/use-job-editor-model'
import { useJobMutations } from '../../features/jobs/use-job-mutations'
import { useProfileMutations } from '../../features/profiles/use-profile-mutations'
import { useJobPagePanelState } from '../../store/app-ui-store'
import type { ApplicationQuestion, ContactOrganizationKind, JobContact, JobLink, Profile } from '../../types/state'
import { moveOrderedItem } from '../../utils/reorder'
import { useCommitOnUnmountIfFocused } from '../../utils/use-commit-on-unmount-if-focused'
import { useScrollIntoViewOnMount } from '../../utils/use-scroll-into-view-on-mount'

const jobPageSectionPanelKeys = {
  applicationQuestions: 'application-questions',
  contacts: 'contacts',
  interviews: 'interviews',
  links: 'links',
  profiles: 'profiles',
} as const

const getJobPageItemPanelKey = (kind: string, id: string) => `${kind}:${id}`

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

const formatOrganizationKind = (organizationKind: ContactOrganizationKind) =>
  organizationKind === 'staffing_agency' ? 'Staffing agency' : 'Company'

const getSuggestedContactCompany = ({
  companyName,
  staffingAgencyName,
  organizationKind,
}: {
  companyName: string
  staffingAgencyName: string
  organizationKind: ContactOrganizationKind
}) => (organizationKind === 'staffing_agency' ? staffingAgencyName : companyName)

const getContactOrganizationSummary = (contact: Pick<JobContact, 'company' | 'organizationKind'>) =>
  contact.company.trim() || formatOrganizationKind(contact.organizationKind)

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
}) => {
  const { handleBlur, handleFocus } = useCommitOnUnmountIfFocused(onBlur)

  return (
    <label className="flex flex-col gap-2 text-sm text-app-text-muted">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
        placeholder={placeholder}
        spellCheck={type === 'url' ? false : undefined}
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

const AttachedProfileCard = ({
  profile,
  onDuplicateComplete,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  profile: Profile
  onDuplicateComplete?: (createdProfileId: string) => void
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteProfile, duplicateProfile } = useProfileMutations()
  const { scrollTargetRef: rowRef, scrollTargetStyle: rowScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete profile \"${profile.name}\"? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    void deleteProfile(profile.id)
  }

  const handleDuplicate = async () => {
    const createdId = await duplicateProfile({ sourceProfileId: profile.id })

    if (createdId) {
      onDuplicateComplete?.(createdId)
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-app-border-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      ref={rowRef}
      style={rowScrollStyle}
    >
      <div>
        <Link className="font-medium text-app-text" to={`/profiles/${profile.id}`}>
          {profile.name}
        </Link>
        <p className="mt-1 text-sm text-app-text-subtle">Updated {new Date(profile.updatedAt).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link aria-label={`Open profile ${profile.name}`} className={getActionIconButtonClassName()} to={`/profiles/${profile.id}`}>
          <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </Link>
        <IconActionButton label={`Duplicate profile ${profile.name}`} onClick={handleDuplicate}>
          <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="10" rx="2" width="10" x="9" y="9" />
            <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          </svg>
        </IconActionButton>
        <DeleteIconButton label={`Delete profile ${profile.name}`} onDelete={handleDelete} />
      </div>
    </div>
  )
}

const JobLinkCard = ({
  jobLink,
  orderedJobLinkIds,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  jobLink: JobLink
  orderedJobLinkIds: string[]
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteJobLink, reorderJobLinks, updateJobLink } = useJobMutations()
  const [draft, setDraft] = useState(jobLink)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const jobLinkIndex = orderedJobLinkIds.indexOf(jobLink.id)

  useEffect(() => {
    setDraft(jobLink)
  }, [jobLink])

  const commitLinkChanges = (changes: Partial<JobLink>) => {
    void updateJobLink({
      jobLinkId: jobLink.id,
      changes,
    })
  }

  const trimmedUrl = draft.url.trim()
  const hasUrl = trimmedUrl.length > 0

  return (
    <div className="rounded-xl border border-app-border-muted p-4" ref={cardRef} style={cardScrollStyle}>
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <TextField placeholder="https://example.com/job" type="url" value={draft.url} onBlur={() => draft.url !== jobLink.url && commitLinkChanges({ url: draft.url })} onChange={(value) => setDraft({ ...draft, url: value })} />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 self-end">
          {hasUrl ? (
            <a
              aria-label="Open link in new tab"
              className={getActionIconButtonClassName()}
              href={trimmedUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M7 17 17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </a>
          ) : (
            <button aria-label="Open link in new tab" className={getActionIconButtonClassName('neutral', true)} disabled type="button">
              <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M7 17 17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </button>
          )}
          <ReorderButtons
            canMoveDown={orderedJobLinkIds.length > 1}
            canMoveUp={orderedJobLinkIds.length > 1}
            onMoveDown={() =>
              reorderJobLinks({
                jobId: jobLink.jobId,
                orderedIds: moveOrderedItem(orderedJobLinkIds, jobLinkIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderJobLinks({
                jobId: jobLink.jobId,
                orderedIds: moveOrderedItem(orderedJobLinkIds, jobLinkIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete link" onDelete={() => void deleteJobLink(jobLink.id)} />
        </div>
      </div>
    </div>
  )
}

const JobContactCard = ({
  companyName,
  jobContact,
  orderedJobContactIds,
  staffingAgencyName,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  companyName: string
  jobContact: JobContact
  orderedJobContactIds: string[]
  staffingAgencyName: string
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteJobContact, reorderJobContacts, updateJobContact } = useJobMutations()
  const [draft, setDraft] = useState(jobContact)
  const jobContactPanel = useJobPagePanelState(jobContact.jobId, getJobPageItemPanelKey('contact', jobContact.id), defaultExpanded)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const jobContactIndex = orderedJobContactIds.indexOf(jobContact.id)

  useEffect(() => {
    setDraft(jobContact)
  }, [jobContact])

  const commitContactChanges = (changes: Partial<JobContact>) => {
    void updateJobContact({
      jobContactId: jobContact.id,
      changes,
    })
  }

  const handleOrganizationKindChange = (nextOrganizationKind: ContactOrganizationKind) => {
    const previousSuggestedCompany = getSuggestedContactCompany({
      companyName,
      staffingAgencyName,
      organizationKind: draft.organizationKind,
    })
    const nextSuggestedCompany = getSuggestedContactCompany({
      companyName,
      staffingAgencyName,
      organizationKind: nextOrganizationKind,
    })
    const shouldSyncCompany = draft.company === '' || draft.company === previousSuggestedCompany

    setDraft({
      ...draft,
      company: shouldSyncCompany ? nextSuggestedCompany : draft.company,
      organizationKind: nextOrganizationKind,
    })
  }

  const handleOrganizationKindBlur = () => {
    const changes: Partial<JobContact> = {}

    if (draft.organizationKind !== jobContact.organizationKind) {
      changes.organizationKind = draft.organizationKind
    }

    if (draft.company !== jobContact.company) {
      changes.company = draft.company
    }

    if (Object.keys(changes).length > 0) {
      commitContactChanges(changes)
    }
  }

  const summary = summarizeParts([draft.title || null, getContactOrganizationSummary(draft)])

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        expanded={jobContactPanel.expanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReorderButtons
              canMoveDown={orderedJobContactIds.length > 1}
              canMoveUp={orderedJobContactIds.length > 1}
              onMoveDown={() =>
                reorderJobContacts({
                  jobId: jobContact.jobId,
                  orderedIds: moveOrderedItem(orderedJobContactIds, jobContactIndex, 1),
                })
              }
              onMoveUp={() =>
                reorderJobContacts({
                  jobId: jobContact.jobId,
                  orderedIds: moveOrderedItem(orderedJobContactIds, jobContactIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete contact" onDelete={() => void deleteJobContact(jobContact.id)} />
          </div>
        }
        onExpandedChange={jobContactPanel.onExpandedChange}
        summary={summary}
        title={draft.name || jobContact.name || 'Contact'}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <SelectField
            label="Associated with"
            options={[
              { value: 'company', label: 'Company' },
              { value: 'staffing_agency', label: 'Staffing agency' },
            ]}
            value={draft.organizationKind}
            onBlur={handleOrganizationKindBlur}
            onChange={(value) => handleOrganizationKindChange(value as ContactOrganizationKind)}
          />
          <TextField label="Name" value={draft.name} onBlur={() => draft.name !== jobContact.name && commitContactChanges({ name: draft.name })} onChange={(value) => setDraft({ ...draft, name: value })} />
          <TextField label="Title" value={draft.title} onBlur={() => draft.title !== jobContact.title && commitContactChanges({ title: draft.title })} onChange={(value) => setDraft({ ...draft, title: value })} />
          <TextField label="Company" value={draft.company} onBlur={() => draft.company !== jobContact.company && commitContactChanges({ company: draft.company })} onChange={(value) => setDraft({ ...draft, company: value })} />
          <TextField label="Email" type="email" value={draft.email} onBlur={() => draft.email !== jobContact.email && commitContactChanges({ email: draft.email })} onChange={(value) => setDraft({ ...draft, email: value })} />
          <TextField label="Phone" type="tel" value={draft.phone} onBlur={() => draft.phone !== jobContact.phone && commitContactChanges({ phone: draft.phone })} onChange={(value) => setDraft({ ...draft, phone: value })} />
          <TextField label="LinkedIn URL" type="url" value={draft.linkedinUrl} onBlur={() => draft.linkedinUrl !== jobContact.linkedinUrl && commitContactChanges({ linkedinUrl: draft.linkedinUrl })} onChange={(value) => setDraft({ ...draft, linkedinUrl: value })} />
          <TextField label="Address line 1" value={draft.addressLine1} onBlur={() => draft.addressLine1 !== jobContact.addressLine1 && commitContactChanges({ addressLine1: draft.addressLine1 })} onChange={(value) => setDraft({ ...draft, addressLine1: value })} />
          <TextField label="Address line 2" value={draft.addressLine2} onBlur={() => draft.addressLine2 !== jobContact.addressLine2 && commitContactChanges({ addressLine2: draft.addressLine2 })} onChange={(value) => setDraft({ ...draft, addressLine2: value })} />
          <TextField label="Address line 3" value={draft.addressLine3} onBlur={() => draft.addressLine3 !== jobContact.addressLine3 && commitContactChanges({ addressLine3: draft.addressLine3 })} onChange={(value) => setDraft({ ...draft, addressLine3: value })} />
          <TextField label="Address line 4" value={draft.addressLine4} onBlur={() => draft.addressLine4 !== jobContact.addressLine4 && commitContactChanges({ addressLine4: draft.addressLine4 })} onChange={(value) => setDraft({ ...draft, addressLine4: value })} />
          <div className="xl:col-span-3">
            <TextAreaField label="Notes" value={draft.notes} onBlur={() => draft.notes !== jobContact.notes && commitContactChanges({ notes: draft.notes })} onChange={(value) => setDraft({ ...draft, notes: value })} />
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const InterviewCard = ({
  interviewEntry,
  allJobContacts,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  interviewEntry: JobDetailInterviewDto
  allJobContacts: JobContact[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { addInterviewContact, deleteInterview, removeInterviewContact, reorderInterviewContacts, updateInterview } = useJobMutations()
  const [draft, setDraft] = useState(interviewEntry.interview)
  const [selectedContactId, setSelectedContactId] = useState('')
  const interviewPanel = useJobPagePanelState(interviewEntry.interview.jobId, getJobPageItemPanelKey('interview', interviewEntry.interview.id), defaultExpanded)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  useEffect(() => {
    setDraft(interviewEntry.interview)
  }, [interviewEntry])

  const interview = interviewEntry.interview
  const associatedContacts = useMemo(
    () =>
      interviewEntry.contacts
        .filter((item) => item.jobContact !== null)
        .map((item) => ({
          association: item.interviewContact,
          contact: item.jobContact as JobContact,
        })),
    [interviewEntry.contacts],
  )
  const interviewContactIds = useMemo(() => associatedContacts.map((item) => item.association.id), [associatedContacts])

  const availableContacts = useMemo(() => {
    const associatedContactIds = new Set(associatedContacts.map((item) => item.contact.id))

    return allJobContacts.filter((contact) => !associatedContactIds.has(contact.id))
  }, [allJobContacts, associatedContacts])

  useEffect(() => {
    setSelectedContactId((current) => {
      if (current && availableContacts.some((contact) => contact.id === current)) {
        return current
      }

      return availableContacts[0]?.id ?? ''
    })
  }, [availableContacts])

  const commitInterviewChanges = (changes: Partial<typeof interview>) => {
    void updateInterview({
      interviewId: interview.id,
      changes,
    })
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        expanded={interviewPanel.expanded}
        onExpandedChange={interviewPanel.onExpandedChange}
        summary={formatInterviewSummary(draft.startAt)}
        title={formatInterviewTitle(draft.startAt)}
        headerActions={<DeleteIconButton label="Delete interview" onDelete={() => void deleteInterview(interview.id)} />}
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

        <div className="rounded-xl border border-app-border-muted p-4">
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

                void addInterviewContact({ interviewId: interview.id, jobContactId: selectedContactId })
              }}
            />
          </div>

          {associatedContacts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {associatedContacts.map(({ association, contact }, index) => (
                <div key={association.id} className="flex items-center justify-between gap-3 rounded-xl border border-app-border-muted px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-app-text">{contact.name || 'Unnamed contact'}</p>
                    <p className="truncate text-xs text-app-text-subtle">{summarizeParts([formatOrganizationKind(contact.organizationKind), contact.title, contact.company]) || 'No details yet'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReorderButtons
                      canMoveDown={associatedContacts.length > 1}
                      canMoveUp={associatedContacts.length > 1}
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
                    <DeleteIconButton label="Remove contact from interview" onDelete={() => void removeInterviewContact(association.id)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-app-text-subtle">No contacts associated with this interview yet.</p>
          )}
        </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const ApplicationQuestionCard = ({
  applicationQuestion,
  orderedApplicationQuestionIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  applicationQuestion: ApplicationQuestion
  orderedApplicationQuestionIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteApplicationQuestion, reorderApplicationQuestions, updateApplicationQuestion } = useJobMutations()
  const [draft, setDraft] = useState(applicationQuestion)
  const applicationQuestionPanel = useJobPagePanelState(
    applicationQuestion.jobId,
    getJobPageItemPanelKey('application-question', applicationQuestion.id),
    defaultExpanded,
  )
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const applicationQuestionIndex = orderedApplicationQuestionIds.indexOf(applicationQuestion.id)

  useEffect(() => {
    setDraft(applicationQuestion)
  }, [applicationQuestion])

  const commitQuestionChanges = (changes: Partial<ApplicationQuestion>) => {
    void updateApplicationQuestion({
      applicationQuestionId: applicationQuestion.id,
      changes,
    })
  }

  const title = truncatePanelText(draft.question, 96) || 'Application question'
  const summary = truncatePanelText(draft.answer, 180) || 'No answer'

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        expanded={applicationQuestionPanel.expanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReorderButtons
              canMoveDown={orderedApplicationQuestionIds.length > 1}
              canMoveUp={orderedApplicationQuestionIds.length > 1}
              onMoveDown={() =>
                reorderApplicationQuestions({
                  jobId: applicationQuestion.jobId,
                  orderedIds: moveOrderedItem(orderedApplicationQuestionIds, applicationQuestionIndex, 1),
                })
              }
              onMoveUp={() =>
                reorderApplicationQuestions({
                  jobId: applicationQuestion.jobId,
                  orderedIds: moveOrderedItem(orderedApplicationQuestionIds, applicationQuestionIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete application question" onDelete={() => void deleteApplicationQuestion(applicationQuestion.id)} />
          </div>
        }
        onExpandedChange={applicationQuestionPanel.onExpandedChange}
        summary={summary}
        title={title}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <TextAreaField label="Question" value={draft.question} onBlur={() => draft.question !== applicationQuestion.question && commitQuestionChanges({ question: draft.question })} onChange={(value) => setDraft({ ...draft, question: value })} />
          <TextAreaField label="Answer" value={draft.answer} onBlur={() => draft.answer !== applicationQuestion.answer && commitQuestionChanges({ answer: draft.answer })} onChange={(value) => setDraft({ ...draft, answer: value })} />
        </div>
      </CollapsiblePanel>
    </div>
  )
}

export const JobChildEditors = ({
  applicationQuestionsModel,
  companyName,
  contactsModel,
  interviewsModel,
  jobId,
  linksModel,
  profilesModel,
  staffingAgencyName,
}: {
  applicationQuestionsModel: JobEditorApplicationQuestionsModel
  companyName: string
  contactsModel: JobEditorContactsModel
  interviewsModel: JobEditorInterviewsModel
  jobId: string
  linksModel: JobEditorLinksModel
  profilesModel: JobEditorProfilesModel
  staffingAgencyName: string
}) => {
  const { duplicateProfile } = useProfileMutations()
  const { createApplicationQuestion, createInterview, createJobContact, createJobLink } = useJobMutations()
  const [selectedBaseProfileId, setSelectedBaseProfileId] = useState('')
  const [newAttachedProfileId, setNewAttachedProfileId] = useState<string | null>(null)
  const [newJobLinkId, setNewJobLinkId] = useState<string | null>(null)
  const [newJobContactId, setNewJobContactId] = useState<string | null>(null)
  const [newInterviewId, setNewInterviewId] = useState<string | null>(null)
  const [newApplicationQuestionId, setNewApplicationQuestionId] = useState<string | null>(null)

  const { attachedProfiles, baseProfiles } = profilesModel
  const { jobLinks } = linksModel
  const { jobContacts } = contactsModel
  const { interviews } = interviewsModel
  const { applicationQuestions } = applicationQuestionsModel

  const jobLinkIds = useMemo(() => jobLinks.map((item) => item.id), [jobLinks])
  const jobContactIds = useMemo(() => jobContacts.map((item) => item.id), [jobContacts])
  const interviewIds = useMemo(() => interviews.map((item) => item.interview.id), [interviews])
  const applicationQuestionIds = useMemo(() => applicationQuestions.map((item) => item.id), [applicationQuestions])

  const hasJobLinks = jobLinkIds.length > 0
  const hasJobContacts = jobContactIds.length > 0
  const hasInterviews = interviewIds.length > 0
  const hasApplicationQuestions = applicationQuestionIds.length > 0
  const hasAttachedProfiles = attachedProfiles.length > 0
  const profilesPanel = useJobPagePanelState(jobId, jobPageSectionPanelKeys.profiles)
  const linksPanel = useJobPagePanelState(jobId, jobPageSectionPanelKeys.links)
  const applicationQuestionsPanel = useJobPagePanelState(jobId, jobPageSectionPanelKeys.applicationQuestions)
  const contactsPanel = useJobPagePanelState(jobId, jobPageSectionPanelKeys.contacts)
  const interviewsPanel = useJobPagePanelState(jobId, jobPageSectionPanelKeys.interviews)

  useEffect(() => {
    setSelectedBaseProfileId((current) => {
      if (current && baseProfiles.some((profile) => profile.id === current)) {
        return current
      }

      return baseProfiles[0]?.id ?? ''
    })
  }, [baseProfiles])

  const handleAddJobProfile = async () => {
    if (!selectedBaseProfileId) {
      return
    }

    const createdId = await duplicateProfile({
      sourceProfileId: selectedBaseProfileId,
      targetJobId: jobId,
    })

    if (createdId) {
      setNewAttachedProfileId(createdId)
    }
  }

  return (
    <>
      <CollapsiblePanel
        collapsible={hasAttachedProfiles}
        description="Create a job-specific profile from a base profile to generate a tailored resume and cover letter."
        expanded={profilesPanel.expanded}
        headerActionContent={({ triggerAction }) =>
          baseProfiles.length === 0 ? (
            <p className="text-sm text-app-text-subtle">Create a base profile first.</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="min-w-0 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring sm:w-64"
                value={selectedBaseProfileId}
                onChange={(event) => setSelectedBaseProfileId(event.target.value)}
              >
                {baseProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <AddIconButton label="Add profile" onAdd={triggerAction} />
            </div>
          )
        }
        onAction={handleAddJobProfile}
        onExpandedChange={profilesPanel.onExpandedChange}
        title="Profiles"
      >
        {hasAttachedProfiles ? (
          <div className="space-y-3">
            {attachedProfiles.map((profile) => (
              <AttachedProfileCard
                key={profile.id}
                onDuplicateComplete={setNewAttachedProfileId}
                profile={profile}
                scrollIntoViewOnMount={profile.id === newAttachedProfileId}
                {...(profile.id === newAttachedProfileId
                  ? { onScrollIntoViewComplete: () => setNewAttachedProfileId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add link"
        actionStyle="icon"
        collapsible={hasJobLinks}
        description="Track the relevant job URLs for this role."
        expanded={linksPanel.expanded}
        onAction={async () => {
          const createdId = await createJobLink(jobId)

          if (createdId) {
            setNewJobLinkId(createdId)
          }
        }}
        onExpandedChange={linksPanel.onExpandedChange}
        showBottomActionWhenHeaderHidden
        title="Links"
      >
        {hasJobLinks ? (
          <div className="space-y-4">
            {jobLinks.map((jobLink) => (
              <JobLinkCard
                jobLink={jobLink}
                key={jobLink.id}
                orderedJobLinkIds={jobLinkIds}
                scrollIntoViewOnMount={jobLink.id === newJobLinkId}
                {...(jobLink.id === newJobLinkId
                  ? { onScrollIntoViewComplete: () => setNewJobLinkId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add application question"
        actionStyle="icon"
        collapsible={hasApplicationQuestions}
        description="Track custom questions asked during the application flow and the answers you submitted."
        expanded={applicationQuestionsPanel.expanded}
        onAction={async () => {
          const createdId = await createApplicationQuestion(jobId)

          if (createdId) {
            setNewApplicationQuestionId(createdId)
          }
        }}
        onExpandedChange={applicationQuestionsPanel.onExpandedChange}
        showBottomActionWhenHeaderHidden
        title="Application questions"
      >
        {hasApplicationQuestions ? (
          <div className="space-y-4">
            {applicationQuestions.map((applicationQuestion) => (
              <ApplicationQuestionCard
                applicationQuestion={applicationQuestion}
                defaultExpanded={applicationQuestion.id === newApplicationQuestionId}
                key={applicationQuestion.id}
                orderedApplicationQuestionIds={applicationQuestionIds}
                scrollIntoViewOnMount={applicationQuestion.id === newApplicationQuestionId}
                {...(applicationQuestion.id === newApplicationQuestionId
                  ? { onScrollIntoViewComplete: () => setNewApplicationQuestionId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add contact"
        actionStyle="icon"
        collapsible={hasJobContacts}
        description="Manage the contacts used for outreach, interviews, and cover letters."
        expanded={contactsPanel.expanded}
        onAction={async () => {
          const createdId = await createJobContact(jobId)

          if (createdId) {
            setNewJobContactId(createdId)
          }
        }}
        onExpandedChange={contactsPanel.onExpandedChange}
        showBottomActionWhenHeaderHidden
        title="Contacts"
      >
        {hasJobContacts ? (
          <div className="space-y-4">
            {jobContacts.map((jobContact) => (
              <JobContactCard
                companyName={companyName}
                defaultExpanded={jobContact.id === newJobContactId}
                jobContact={jobContact}
                key={jobContact.id}
                orderedJobContactIds={jobContactIds}
                scrollIntoViewOnMount={jobContact.id === newJobContactId}
                staffingAgencyName={staffingAgencyName}
                {...(jobContact.id === newJobContactId
                  ? { onScrollIntoViewComplete: () => setNewJobContactId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add interview"
        actionStyle="icon"
        collapsible={hasInterviews}
        description="Track interviews in chronological order."
        expanded={interviewsPanel.expanded}
        onAction={async () => {
          const createdId = await createInterview(jobId)

          if (createdId) {
            setNewInterviewId(createdId)
          }
        }}
        onExpandedChange={interviewsPanel.onExpandedChange}
        showBottomActionWhenHeaderHidden
        title="Interviews"
      >
        {hasInterviews ? (
          <div className="space-y-4">
            {interviews.map((interviewEntry) => (
              <InterviewCard
                allJobContacts={jobContacts}
                defaultExpanded={interviewEntry.interview.id === newInterviewId}
                interviewEntry={interviewEntry}
                key={interviewEntry.interview.id}
                scrollIntoViewOnMount={interviewEntry.interview.id === newInterviewId}
                {...(interviewEntry.interview.id === newInterviewId
                  ? { onScrollIntoViewComplete: () => setNewInterviewId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>
    </>
  )
}
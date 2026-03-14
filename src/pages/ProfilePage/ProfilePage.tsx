import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ActionToggle } from '../../components/CompactActionControls'
import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { ReorderButtons } from '../../components/ReorderButtons'
import { DocumentProfileHeader } from '../../features/documents/DocumentProfileHeader'
import { useProfileMutations } from '../../features/profiles/use-profile-mutations'
import { useProfileEditorModel } from '../../features/profiles/use-profile-editor-model'
import { useProfileDetailQuery } from '../../queries/use-profile-detail-query'
import { useProfileDocumentQuery } from '../../queries/use-profile-document-query'
import { useProfilePagePanelState } from '../../store/app-ui-store'
import { ProfileChildEditors } from './ProfileChildEditors'
import type { DocumentHeaderTemplate, PersonalDetails, ResumeSectionKey } from '../../types/state'
import { documentHeaderTemplateLabels, documentHeaderTemplates } from '../../utils/document-header-templates'
import { defaultResumeSectionOrder } from '../../utils/resume-section-labels'
import { normalizeResumeSectionLabel } from '../../utils/resume-section-labels'
import { moveOrderedItem } from '../../utils/reorder'

const buildResumeSectionLabels = (profile?: { resumeSettings: { sections: Record<ResumeSectionKey, { label: string }> } }) =>
  defaultResumeSectionOrder.reduce<Record<ResumeSectionKey, string>>((labels, section) => {
    labels[section] = profile?.resumeSettings.sections[section].label ?? ''
    return labels
  }, {} as Record<ResumeSectionKey, string>)

const createPersonalDetailsDraft = (personalDetails: PersonalDetails): PersonalDetails => ({
  ...personalDetails,
})

const Field = ({
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
  type?: 'text' | 'email' | 'tel' | 'url'
}) => (
  <label className="flex flex-col gap-2 text-sm text-app-text-muted">
    <span className="font-medium">{label}</span>
    <input
      className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
      placeholder={placeholder}
      spellCheck={type === 'url' ? false : undefined}
      type={type}
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const OrderBadge = ({ value }: { value: number }) => (
  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-app-surface-subtle px-2 text-xs font-semibold text-app-text-subtle">
    {value}
  </span>
)

export const ProfilePage = () => {
  const { profileId = '' } = useParams()
  const { reorderResumeSections, setDocumentHeaderTemplate, setResumeSectionEnabled, setResumeSectionLabel, updateProfile } = useProfileMutations()
  const { data: profileDetail, error, isLoading } = useProfileDetailQuery(profileId)
  const { data: documentData } = useProfileDocumentQuery(profileId)
  const profileDetailsPanel = useProfilePagePanelState(profileId, 'profile-details')
  const documentSettingsPanel = useProfilePagePanelState(profileId, 'document-settings')
  const editorModel = useProfileEditorModel(profileDetail)
  const profile = profileDetail?.profile
  const [name, setName] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [resumeSectionLabels, setResumeSectionLabels] = useState<Record<ResumeSectionKey, string> | null>(null)
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null)

  useEffect(() => {
    if (!profile) {
      return
    }

    setName(profile.name)
    setSummary(profile.summary)
    setCoverLetter(profile.coverLetter)
    setResumeSectionLabels(buildResumeSectionLabels(profile))
    setPersonalDetails(createPersonalDetailsDraft(profile.personalDetails))
  }, [profile])

  if (isLoading && !profile) {
    return <p className="text-sm text-app-text-subtle">Loading profile...</p>
  }

  if (error && !profileDetail && !profile) {
    return (
      <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-app-heading">Unable to load profile</h1>
        <p className="mt-3 text-sm text-app-status-rejected">The profile details could not be refreshed right now.</p>
        <Link className="mt-5 inline-flex rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to="/profiles">
          Back to profiles
        </Link>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-app-border-muted bg-app-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-app-heading">Profile not found</h1>
        <p className="mt-3 text-sm text-app-text-subtle">The selected profile could not be found.</p>
        <Link className="mt-5 inline-flex rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to="/profiles">
          Back to profiles
        </Link>
      </div>
    )
  }

  const activeName = name ?? profile.name
  const activeSummary = summary ?? profile.summary
  const activeCoverLetter = coverLetter ?? profile.coverLetter
  const activeResumeSectionLabels = resumeSectionLabels ?? buildResumeSectionLabels(profile)
  const activePersonalDetails = personalDetails ?? createPersonalDetailsDraft(profile.personalDetails)

  const attachedJob = profileDetail?.attachedJob ?? null
  const orderedResumeSections = Object.entries(profile.resumeSettings.sections)
    .map(([section, settings]) => ({
      section: section as ResumeSectionKey,
      ...settings,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const orderedResumeSectionKeys = orderedResumeSections.map((section) => section.section)
  const splitResumeSectionIndex = Math.ceil(orderedResumeSections.length / 2)
  const leftColumnResumeSections = orderedResumeSections.slice(0, splitResumeSectionIndex)
  const rightColumnResumeSections = orderedResumeSections.slice(splitResumeSectionIndex)

  const commitProfileName = () => {
    const trimmed = activeName.trim()
    if (!trimmed) {
      setName(profile.name)
      return
    }

    if (trimmed === profile.name) {
      if (activeName !== trimmed) {
        setName(trimmed)
      }
      return
    }

    void updateProfile({
      profileId: profile.id,
      changes: {
        name: trimmed,
      },
    })
    if (activeName !== trimmed) {
      setName(trimmed)
    }
  }

  const commitProfileTextField = (field: 'summary' | 'coverLetter', value: string) => {
    if (value === profile[field]) {
      return
    }

    void updateProfile({
      profileId: profile.id,
      changes: {
        [field]: value,
      },
    })
  }

  const commitPersonalDetail = <K extends keyof PersonalDetails>(key: K, value: PersonalDetails[K]) => {
    if (value === profile.personalDetails[key]) {
      return
    }

    void updateProfile({
      profileId: profile.id,
      changes: {},
      personalDetails: {
        [key]: value,
      },
    })
  }

  const commitResumeSectionLabel = (section: ResumeSectionKey) => {
    const nextLabel = normalizeResumeSectionLabel(section, activeResumeSectionLabels[section])

    if (nextLabel !== activeResumeSectionLabels[section]) {
      setResumeSectionLabels((current) => ({
        ...(current ?? activeResumeSectionLabels),
        [section]: nextLabel,
      }))
    }

    if (nextLabel === profile.resumeSettings.sections[section].label) {
      return
    }

    void setResumeSectionLabel({
      profileId: profile.id,
      section,
      label: nextLabel,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-app-primary">Profile editor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-heading">{profile.name || 'Unnamed profile'}</h1>
          <p className="mt-2 text-sm text-app-text-subtle">
            {attachedJob ? `Job profile for ${attachedJob.jobTitle || 'Untitled role'} at ${attachedJob.companyName || 'Unknown company'}` : 'Base profile'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to={`/profiles/${profile.id}/cover-letter`}>
            Cover letter
          </Link>
          <Link className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to={`/profiles/${profile.id}/resume`}>
            Resume
          </Link>
          <Link className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to={`/profiles/${profile.id}/references`}>
            References
          </Link>
          <Link className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to={`/profiles/${profile.id}/combined`}>
            Cover letter + resume
          </Link>
          <Link className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to={`/profiles/${profile.id}/application`}>
            Application
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft px-4 py-3 text-sm text-app-status-rejected">
          Unable to refresh this profile right now. Showing the most recently cached result if available.
        </div>
      ) : null}

      <CollapsiblePanel
        description="Edit the core profile content used across previews and applications."
        expanded={profileDetailsPanel.expanded}
        onExpandedChange={profileDetailsPanel.onExpandedChange}
        title="Profile details"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Field label="Profile name" onBlur={commitProfileName} value={activeName} onChange={setName} />

          <div className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Full name" value={activePersonalDetails.fullName} onBlur={() => commitPersonalDetail('fullName', activePersonalDetails.fullName)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, fullName: value })} />
              <Field label="Email" type="email" value={activePersonalDetails.email} onBlur={() => commitPersonalDetail('email', activePersonalDetails.email)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, email: value })} />
              <Field label="Phone" type="tel" value={activePersonalDetails.phone} onBlur={() => commitPersonalDetail('phone', activePersonalDetails.phone)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, phone: value })} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Address line 1" value={activePersonalDetails.addressLine1} onBlur={() => commitPersonalDetail('addressLine1', activePersonalDetails.addressLine1)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, addressLine1: value })} />
              <Field label="Address line 2" value={activePersonalDetails.addressLine2} onBlur={() => commitPersonalDetail('addressLine2', activePersonalDetails.addressLine2)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, addressLine2: value })} />
              <Field label="Address line 3" value={activePersonalDetails.addressLine3} onBlur={() => commitPersonalDetail('addressLine3', activePersonalDetails.addressLine3)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, addressLine3: value })} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="City" value={activePersonalDetails.city} onBlur={() => commitPersonalDetail('city', activePersonalDetails.city)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, city: value })} />
              <Field label="State" value={activePersonalDetails.state} onBlur={() => commitPersonalDetail('state', activePersonalDetails.state)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, state: value })} />
              <Field label="Postal code" value={activePersonalDetails.postalCode} onBlur={() => commitPersonalDetail('postalCode', activePersonalDetails.postalCode)} onChange={(value) => setPersonalDetails({ ...activePersonalDetails, postalCode: value })} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-app-text-muted">
              <span className="font-medium">Professional summary</span>
              <textarea
                className="min-h-28 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
                value={activeSummary}
                onBlur={() => commitProfileTextField('summary', activeSummary)}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
          </div>

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-app-text-muted">
              <span className="font-medium">Cover letter content</span>
              <textarea
                className="min-h-40 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
                value={activeCoverLetter}
                onBlur={() => commitProfileTextField('coverLetter', activeCoverLetter)}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            </label>
          </div>
        </div>
      </CollapsiblePanel>

      <ProfileChildEditors
        additionalExperienceModel={editorModel.additionalExperience}
        achievementsModel={editorModel.achievements}
        certificationsModel={editorModel.certifications}
        educationModel={editorModel.education}
        experienceModel={editorModel.experience}
        linksModel={editorModel.links}
        profileId={profile.id}
        projectsModel={editorModel.projects}
        referencesModel={editorModel.references}
        skillsModel={editorModel.skills}
      />

      <CollapsiblePanel
        description="Control document header styling plus which sections appear on the resume and the order in which they are shown."
        expanded={documentSettingsPanel.expanded}
        onExpandedChange={documentSettingsPanel.onExpandedChange}
        title="Document settings"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-app-heading">Shared header</h3>
              <p className="mt-1 text-sm text-app-text-subtle">Applies to the resume, cover letter, and references documents.</p>
            </div>

            <label className="flex flex-col gap-2 text-sm text-app-text-muted">
              <span className="sr-only">Shared header template</span>
              <select
                className="rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-focus-ring"
                value={profile.resumeSettings.headerTemplate}
                onChange={(event) =>
                  void setDocumentHeaderTemplate({
                    profileId: profile.id,
                    headerTemplate: event.target.value as DocumentHeaderTemplate,
                  })
                }
              >
                {documentHeaderTemplates.map((template) => (
                  <option key={template} value={template}>
                    {documentHeaderTemplateLabels[template]}
                  </option>
                ))}
              </select>
            </label>

            {documentData ? (
              <div className="overflow-hidden rounded-xl border border-app-border bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-app-text-subtle">Preview</p>
                <div className="overflow-x-auto pb-1">
                  <div className="document-header-preview">
                    <DocumentProfileHeader documentData={documentData} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-app-heading">Resume sections</h3>
              <p className="mt-1 text-sm text-app-text-subtle">Control which sections appear on the resume and the order in which they are shown.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
          {[leftColumnResumeSections, rightColumnResumeSections].map((column, columnIndex) => (
            <div key={columnIndex} className="space-y-3">
              {column.map((resumeSection) => {
                const index = orderedResumeSections.findIndex((section) => section.section === resumeSection.section)

                return (
                  <div key={resumeSection.section} className="flex flex-col gap-3 rounded-xl border border-app-border-muted p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3 text-sm font-medium text-app-text md:flex-1">
                      <OrderBadge value={index + 1} />
                      <label className="min-w-0 flex-1">
                        <span className="sr-only">Resume section label</span>
                        <input
                          className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-app-text outline-none transition focus:border-app-focus-ring"
                          value={activeResumeSectionLabels[resumeSection.section]}
                          onBlur={() => commitResumeSectionLabel(resumeSection.section)}
                          onChange={(event) =>
                            setResumeSectionLabels((current) => ({
                              ...(current ?? activeResumeSectionLabels),
                              [resumeSection.section]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <ActionToggle
                        checked={resumeSection.enabled}
                        label={`Enable ${resumeSection.label} section`}
                        onChange={(value) =>
                          void setResumeSectionEnabled({
                            profileId: profile.id,
                            section: resumeSection.section,
                            enabled: value,
                          })
                        }
                      />

                      <ReorderButtons
                        canMoveDown={orderedResumeSectionKeys.length > 1}
                        canMoveUp={orderedResumeSectionKeys.length > 1}
                        onMoveDown={() =>
                          void reorderResumeSections({
                            profileId: profile.id,
                            orderedSections: moveOrderedItem(orderedResumeSectionKeys, index, 1) as ResumeSectionKey[],
                          })
                        }
                        onMoveUp={() =>
                          void reorderResumeSections({
                            profileId: profile.id,
                            orderedSections: moveOrderedItem(orderedResumeSectionKeys, index, -1) as ResumeSectionKey[],
                          })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
            </div>
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}
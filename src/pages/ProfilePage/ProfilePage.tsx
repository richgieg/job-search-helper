import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ActionToggle } from '../../components/CompactActionControls'
import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { ReorderButtons } from '../../components/ReorderButtons'
import { ProfileChildEditors } from './ProfileChildEditors'
import { useAppStore } from '../../store/app-store'
import type { PersonalDetails, ResumeSectionKey } from '../../types/state'
import { moveOrderedItem } from '../../utils/reorder'
import { normalizeResumeSectionLabel } from '../../utils/resume-section-labels'

const createPersonalDetailsDraft = (personalDetails: PersonalDetails): PersonalDetails => ({
  ...personalDetails,
})

const emptyPersonalDetails: PersonalDetails = {
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  city: '',
  state: '',
  postalCode: '',
}

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
  const profile = useAppStore((state) => state.data.profiles[profileId])
  const jobsById = useAppStore((state) => state.data.jobs)
  const updateProfile = useAppStore((state) => state.actions.updateProfile)
  const setResumeSectionEnabled = useAppStore((state) => state.actions.setResumeSectionEnabled)
  const setResumeSectionLabel = useAppStore((state) => state.actions.setResumeSectionLabel)
  const reorderResumeSections = useAppStore((state) => state.actions.reorderResumeSections)
  const [name, setName] = useState(profile?.name ?? '')
  const [summary, setSummary] = useState(profile?.summary ?? '')
  const [coverLetter, setCoverLetter] = useState(profile?.coverLetter ?? '')
  const [resumeSectionLabels, setResumeSectionLabels] = useState<Record<ResumeSectionKey, string>>(
    profile
      ? {
          summary: profile.resumeSettings.sections.summary.label,
          skills: profile.resumeSettings.sections.skills.label,
          achievements: profile.resumeSettings.sections.achievements.label,
          experience: profile.resumeSettings.sections.experience.label,
          education: profile.resumeSettings.sections.education.label,
          projects: profile.resumeSettings.sections.projects.label,
          certifications: profile.resumeSettings.sections.certifications.label,
          references: profile.resumeSettings.sections.references.label,
        }
      : {
          summary: '',
          skills: '',
          achievements: '',
          experience: '',
          education: '',
          projects: '',
          certifications: '',
          references: '',
        },
  )
  const [personalDetails, setPersonalDetails] = useState(profile ? createPersonalDetailsDraft(profile.personalDetails) : emptyPersonalDetails)

  useEffect(() => {
    if (!profile) {
      return
    }

    setName(profile.name)
    setSummary(profile.summary)
    setCoverLetter(profile.coverLetter)
    setResumeSectionLabels({
      summary: profile.resumeSettings.sections.summary.label,
      skills: profile.resumeSettings.sections.skills.label,
      achievements: profile.resumeSettings.sections.achievements.label,
      experience: profile.resumeSettings.sections.experience.label,
      education: profile.resumeSettings.sections.education.label,
      projects: profile.resumeSettings.sections.projects.label,
      certifications: profile.resumeSettings.sections.certifications.label,
      references: profile.resumeSettings.sections.references.label,
    })
    setPersonalDetails(createPersonalDetailsDraft(profile.personalDetails))
  }, [profile])

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

  const attachedJob = profile.jobId ? jobsById[profile.jobId] : null
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
    const trimmed = name.trim()
    if (!trimmed) {
      setName(profile.name)
      return
    }

    if (trimmed === profile.name) {
      if (name !== trimmed) {
        setName(trimmed)
      }
      return
    }

    updateProfile({
      profileId: profile.id,
      changes: {
        name: trimmed,
      },
    })
    if (name !== trimmed) {
      setName(trimmed)
    }
  }

  const commitProfileTextField = (field: 'summary' | 'coverLetter', value: string) => {
    if (value === profile[field]) {
      return
    }

    updateProfile({
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

    updateProfile({
      profileId: profile.id,
      changes: {},
      personalDetails: {
        [key]: value,
      },
    })
  }

  const commitResumeSectionLabel = (section: ResumeSectionKey) => {
    const nextLabel = normalizeResumeSectionLabel(section, resumeSectionLabels[section])

    if (nextLabel !== resumeSectionLabels[section]) {
      setResumeSectionLabels((current) => ({
        ...current,
        [section]: nextLabel,
      }))
    }

    if (nextLabel === profile.resumeSettings.sections[section].label) {
      return
    }

    setResumeSectionLabel({
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

      <CollapsiblePanel
        description="Edit the core profile content used across previews and applications."
        title="Profile details"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Field label="Profile name" onBlur={commitProfileName} value={name} onChange={setName} />

          <div className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Full name" value={personalDetails.fullName} onBlur={() => commitPersonalDetail('fullName', personalDetails.fullName)} onChange={(value) => setPersonalDetails({ ...personalDetails, fullName: value })} />
              <Field label="Email" type="email" value={personalDetails.email} onBlur={() => commitPersonalDetail('email', personalDetails.email)} onChange={(value) => setPersonalDetails({ ...personalDetails, email: value })} />
              <Field label="Phone" type="tel" value={personalDetails.phone} onBlur={() => commitPersonalDetail('phone', personalDetails.phone)} onChange={(value) => setPersonalDetails({ ...personalDetails, phone: value })} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Address line 1" value={personalDetails.addressLine1} onBlur={() => commitPersonalDetail('addressLine1', personalDetails.addressLine1)} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine1: value })} />
              <Field label="Address line 2" value={personalDetails.addressLine2} onBlur={() => commitPersonalDetail('addressLine2', personalDetails.addressLine2)} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine2: value })} />
              <Field label="Address line 3" value={personalDetails.addressLine3} onBlur={() => commitPersonalDetail('addressLine3', personalDetails.addressLine3)} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine3: value })} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="City" value={personalDetails.city} onBlur={() => commitPersonalDetail('city', personalDetails.city)} onChange={(value) => setPersonalDetails({ ...personalDetails, city: value })} />
              <Field label="State" value={personalDetails.state} onBlur={() => commitPersonalDetail('state', personalDetails.state)} onChange={(value) => setPersonalDetails({ ...personalDetails, state: value })} />
              <Field label="Postal code" value={personalDetails.postalCode} onBlur={() => commitPersonalDetail('postalCode', personalDetails.postalCode)} onChange={(value) => setPersonalDetails({ ...personalDetails, postalCode: value })} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-app-text-muted">
              <span className="font-medium">Professional summary</span>
              <textarea
                className="min-h-28 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
                value={summary}
                onBlur={() => commitProfileTextField('summary', summary)}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
          </div>

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-app-text-muted">
              <span className="font-medium">Cover letter content</span>
              <textarea
                className="min-h-40 rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
                value={coverLetter}
                onBlur={() => commitProfileTextField('coverLetter', coverLetter)}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            </label>
          </div>
        </div>
      </CollapsiblePanel>

      <ProfileChildEditors profileId={profile.id} />

      <CollapsiblePanel description="Control which sections appear on the resume and the order in which they are shown." title="Resume settings">
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
                          value={resumeSectionLabels[resumeSection.section]}
                          onBlur={() => commitResumeSectionLabel(resumeSection.section)}
                          onChange={(event) =>
                            setResumeSectionLabels((current) => ({
                              ...current,
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
                          setResumeSectionEnabled({
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
                          reorderResumeSections({
                            profileId: profile.id,
                            orderedSections: moveOrderedItem(orderedResumeSectionKeys, index, 1) as ResumeSectionKey[],
                          })
                        }
                        onMoveUp={() =>
                          reorderResumeSections({
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
      </CollapsiblePanel>
    </div>
  )
}
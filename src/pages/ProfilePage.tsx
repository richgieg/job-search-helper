import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { CollapsiblePanel } from '../components/CollapsiblePanel'
import { ReorderButtons } from '../components/ReorderButtons'
import { ProfileChildEditors } from '../features/profiles/ProfileChildEditors'
import { useAppStore } from '../store/app-store'
import type { PersonalDetails, ResumeSectionKey } from '../types/state'
import { moveOrderedItem } from '../utils/reorder'

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

const resumeSectionLabels: Record<ResumeSectionKey, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  references: 'References',
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
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
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

const ProfileLinkRow = ({ profileLinkId }: { profileLinkId: string }) => {
  const profileLink = useAppStore((state) => state.data.profileLinks[profileLinkId])
  const profileLinksById = useAppStore((state) => state.data.profileLinks)
  const updateProfileLink = useAppStore((state) => state.actions.updateProfileLink)
  const deleteProfileLink = useAppStore((state) => state.actions.deleteProfileLink)
  const reorderProfileLinks = useAppStore((state) => state.actions.reorderProfileLinks)
  const [name, setName] = useState(profileLink?.name ?? '')
  const [url, setUrl] = useState(profileLink?.url ?? '')
  const [enabled, setEnabled] = useState(profileLink?.enabled ?? true)

  const profileLinkIds = profileLink
    ? Object.values(profileLinksById)
        .filter((item) => item.profileId === profileLink.profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id)
    : []
  const profileLinkIndex = profileLinkIds.indexOf(profileLinkId)

  useEffect(() => {
    if (!profileLink) {
      return
    }

    setName(profileLink.name)
    setUrl(profileLink.url)
    setEnabled(profileLink.enabled)
  }, [profileLink])

  if (!profileLink) {
    return null
  }

  const commitName = () => {
    if (name === profileLink.name) {
      return
    }

    updateProfileLink({
      profileLinkId: profileLink.id,
      changes: { name },
    })
  }

  const commitUrl = () => {
    if (url === profileLink.url) {
      return
    }

    updateProfileLink({
      profileLinkId: profileLink.id,
      changes: { url },
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-end">
        <Field label="Link name" onBlur={commitName} value={name} onChange={setName} />
        <Field label="URL" type="url" onBlur={commitUrl} value={url} onChange={setUrl} />
        <div className="flex flex-wrap items-center justify-end gap-2 md:self-end">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              checked={enabled}
              className="h-4 w-4 rounded border-slate-300"
              onChange={(event) => {
                const nextEnabled = event.target.checked
                setEnabled(nextEnabled)
                updateProfileLink({
                  profileLinkId: profileLink.id,
                  changes: { enabled: nextEnabled },
                })
              }}
              type="checkbox"
            />
            Enabled
          </label>
          <ReorderButtons
            canMoveDown={profileLinkIds.length > 1}
            canMoveUp={profileLinkIds.length > 1}
            onMoveDown={() =>
              reorderProfileLinks({
                profileId: profileLink.profileId,
                orderedIds: moveOrderedItem(profileLinkIds, profileLinkIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderProfileLinks({
                profileId: profileLink.profileId,
                orderedIds: moveOrderedItem(profileLinkIds, profileLinkIndex, -1),
              })
            }
          />
          <button
            className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            onClick={() => deleteProfileLink(profileLink.id)}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export const ProfilePage = () => {
  const { profileId = '' } = useParams()
  const profile = useAppStore((state) => state.data.profiles[profileId])
  const profileLinksById = useAppStore((state) => state.data.profileLinks)
  const jobsById = useAppStore((state) => state.data.jobs)
  const updateProfile = useAppStore((state) => state.actions.updateProfile)
  const createProfileLink = useAppStore((state) => state.actions.createProfileLink)
  const setResumeSectionEnabled = useAppStore((state) => state.actions.setResumeSectionEnabled)
  const reorderResumeSections = useAppStore((state) => state.actions.reorderResumeSections)
  const [name, setName] = useState(profile?.name ?? '')
  const [summary, setSummary] = useState(profile?.summary ?? '')
  const [coverLetter, setCoverLetter] = useState(profile?.coverLetter ?? '')
  const [personalDetails, setPersonalDetails] = useState(profile ? createPersonalDetailsDraft(profile.personalDetails) : emptyPersonalDetails)

  useEffect(() => {
    if (!profile) {
      return
    }

    setName(profile.name)
    setSummary(profile.summary)
    setCoverLetter(profile.coverLetter)
    setPersonalDetails(createPersonalDetailsDraft(profile.personalDetails))
  }, [profile])

  if (!profile) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Profile not found</h1>
        <p className="mt-3 text-sm text-slate-600">The selected profile could not be found.</p>
        <Link className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/profiles">
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
  const orderedProfileLinkIds = Object.values(profileLinksById)
    .filter((item) => item.profileId === profile.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => item.id)

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Profile editor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{profile.name || 'Unnamed profile'}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {attachedJob ? `Job profile for ${attachedJob.jobTitle || 'Untitled role'} at ${attachedJob.companyName || 'Unknown company'}` : 'Base profile'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/previews/cover-letter/${profile.id}`}>
            Cover letter
          </Link>
          <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/previews/resume/${profile.id}`}>
            Resume
          </Link>
          <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/previews/application/${profile.id}`}>
            Application
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {profile.jobId === null ? 'Base profile' : 'Job profile'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Created {new Date(profile.createdAt).toLocaleString()}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Updated {new Date(profile.updatedAt).toLocaleString()}</span>
        </div>
      </section>

      <CollapsiblePanel
        description="Edit the core profile content used across previews and applications."
        title="Profile details"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Field label="Profile name" onBlur={commitProfileName} value={name} onChange={setName} />

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">Professional summary</span>
              <textarea
                className="min-h-28 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                value={summary}
                onBlur={() => commitProfileTextField('summary', summary)}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
          </div>

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">Cover letter content</span>
              <textarea
                className="min-h-40 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                value={coverLetter}
                onBlur={() => commitProfileTextField('coverLetter', coverLetter)}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            </label>
          </div>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        description="Manage contact and address details used in document headers and applications."
        title="Personal details"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Full name" value={personalDetails.fullName} onBlur={() => commitPersonalDetail('fullName', personalDetails.fullName)} onChange={(value) => setPersonalDetails({ ...personalDetails, fullName: value })} />
          <Field label="Email" type="email" value={personalDetails.email} onBlur={() => commitPersonalDetail('email', personalDetails.email)} onChange={(value) => setPersonalDetails({ ...personalDetails, email: value })} />
          <Field label="Phone" type="tel" value={personalDetails.phone} onBlur={() => commitPersonalDetail('phone', personalDetails.phone)} onChange={(value) => setPersonalDetails({ ...personalDetails, phone: value })} />
          <Field label="Address line 1" value={personalDetails.addressLine1} onBlur={() => commitPersonalDetail('addressLine1', personalDetails.addressLine1)} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine1: value })} />
          <Field label="Address line 2" value={personalDetails.addressLine2} onBlur={() => commitPersonalDetail('addressLine2', personalDetails.addressLine2)} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine2: value })} />
          <Field label="Address line 3" value={personalDetails.addressLine3} onBlur={() => commitPersonalDetail('addressLine3', personalDetails.addressLine3)} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine3: value })} />
          <Field label="City" value={personalDetails.city} onBlur={() => commitPersonalDetail('city', personalDetails.city)} onChange={(value) => setPersonalDetails({ ...personalDetails, city: value })} />
          <Field label="State" value={personalDetails.state} onBlur={() => commitPersonalDetail('state', personalDetails.state)} onChange={(value) => setPersonalDetails({ ...personalDetails, state: value })} />
          <Field label="Postal code" value={personalDetails.postalCode} onBlur={() => commitPersonalDetail('postalCode', personalDetails.postalCode)} onChange={(value) => setPersonalDetails({ ...personalDetails, postalCode: value })} />
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        description="Store the public URLs that should travel with this profile."
        headerActions={
          <button
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => createProfileLink(profile.id)}
            type="button"
          >
            Add link
          </button>
        }
        title="Links"
      >
        <div className="space-y-3">
          {orderedProfileLinkIds.length === 0 ? <p className="text-sm text-slate-500">No links added yet.</p> : null}
          {orderedProfileLinkIds.map((id) => <ProfileLinkRow key={id} profileLinkId={id} />)}
        </div>
      </CollapsiblePanel>

      <ProfileChildEditors profileId={profile.id} />

      <CollapsiblePanel description="Control which sections appear on the resume and the order in which they are shown." title="Resume settings">
        <div className="space-y-3">
          {orderedResumeSections.map((resumeSection, index) => (
            <div key={resumeSection.section} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-800">
                <input
                  checked={resumeSection.enabled}
                  className="h-4 w-4 rounded border-slate-300"
                  onChange={(event) =>
                    setResumeSectionEnabled({
                      profileId: profile.id,
                      section: resumeSection.section,
                      enabled: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>{resumeSectionLabels[resumeSection.section]}</span>
              </label>

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
          ))}
        </div>
      </CollapsiblePanel>
    </div>
  )
}
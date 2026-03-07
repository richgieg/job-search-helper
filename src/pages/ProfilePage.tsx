import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ReorderButtons } from '../components/ReorderButtons'
import { ProfileChildEditors } from '../features/profiles/ProfileChildEditors'
import { useAppStore } from '../store/app-store'
import type { PersonalDetails, ProfileLinks, ResumeSectionKey } from '../types/state'
import { moveOrderedItem } from '../utils/reorder'

const createPersonalDetailsDraft = (personalDetails: PersonalDetails): PersonalDetails => ({
  ...personalDetails,
})

const createLinksDraft = (links: ProfileLinks): ProfileLinks => ({
  ...links,
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

const emptyLinks: ProfileLinks = {
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  websiteUrl: '',
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
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'url'
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

export const ProfilePage = () => {
  const { profileId = '' } = useParams()
  const profile = useAppStore((state) => state.data.profiles[profileId])
  const jobsById = useAppStore((state) => state.data.jobs)
  const updateProfile = useAppStore((state) => state.actions.updateProfile)
  const setResumeSectionEnabled = useAppStore((state) => state.actions.setResumeSectionEnabled)
  const reorderResumeSections = useAppStore((state) => state.actions.reorderResumeSections)
  const [name, setName] = useState(profile?.name ?? '')
  const [summary, setSummary] = useState(profile?.summary ?? '')
  const [coverLetter, setCoverLetter] = useState(profile?.coverLetter ?? '')
  const [personalDetails, setPersonalDetails] = useState(profile ? createPersonalDetailsDraft(profile.personalDetails) : emptyPersonalDetails)
  const [links, setLinks] = useState(profile ? createLinksDraft(profile.links) : emptyLinks)

  useEffect(() => {
    if (!profile) {
      return
    }

    setName(profile.name)
    setSummary(profile.summary)
    setCoverLetter(profile.coverLetter)
    setPersonalDetails(createPersonalDetailsDraft(profile.personalDetails))
    setLinks(createLinksDraft(profile.links))
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

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setName(profile.name)
      return
    }

    updateProfile({
      profileId: profile.id,
      changes: {
        name: trimmed,
        summary,
        coverLetter,
      },
      personalDetails,
      links,
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
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" onClick={handleSave} type="button">
            Save profile
          </button>
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

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <Field label="Profile name" value={name} onChange={setName} />

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">Professional summary</span>
              <textarea
                className="min-h-28 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                placeholder="Professional summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
          </div>

          <div className="xl:col-span-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">Cover letter content</span>
              <textarea
                className="min-h-40 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                placeholder="Cover letter content"
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Personal details</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Full name" value={personalDetails.fullName} onChange={(value) => setPersonalDetails({ ...personalDetails, fullName: value })} />
            <Field label="Email" type="email" value={personalDetails.email} onChange={(value) => setPersonalDetails({ ...personalDetails, email: value })} />
            <Field label="Phone" type="tel" value={personalDetails.phone} onChange={(value) => setPersonalDetails({ ...personalDetails, phone: value })} />
            <Field label="Address line 1" value={personalDetails.addressLine1} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine1: value })} />
            <Field label="Address line 2" value={personalDetails.addressLine2} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine2: value })} />
            <Field label="Address line 3" value={personalDetails.addressLine3} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine3: value })} />
            <Field label="City" value={personalDetails.city} onChange={(value) => setPersonalDetails({ ...personalDetails, city: value })} />
            <Field label="State" value={personalDetails.state} onChange={(value) => setPersonalDetails({ ...personalDetails, state: value })} />
            <Field label="Postal code" value={personalDetails.postalCode} onChange={(value) => setPersonalDetails({ ...personalDetails, postalCode: value })} />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Links</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field label="LinkedIn" type="url" value={links.linkedinUrl} onChange={(value) => setLinks({ ...links, linkedinUrl: value })} />
            <Field label="GitHub" type="url" value={links.githubUrl} onChange={(value) => setLinks({ ...links, githubUrl: value })} />
            <Field label="Portfolio" type="url" value={links.portfolioUrl} onChange={(value) => setLinks({ ...links, portfolioUrl: value })} />
            <Field label="Website" type="url" value={links.websiteUrl} onChange={(value) => setLinks({ ...links, websiteUrl: value })} />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Resume settings</h2>
          <p className="mt-2 text-sm text-slate-500">Control which sections appear on the resume and the order in which they are shown.</p>
          <div className="mt-4 space-y-3">
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
        </div>
      </section>

      <ProfileChildEditors profileId={profile.id} />
    </div>
  )
}
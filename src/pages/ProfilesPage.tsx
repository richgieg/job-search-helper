import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ProfileChildEditors } from '../features/profiles/ProfileChildEditors'
import { useAppStore } from '../store/app-store'
import type { PersonalDetails, ProfileLinks } from '../types/state'

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
  addressLine4: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
}

const emptyLinks: ProfileLinks = {
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  websiteUrl: '',
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

const ProfileListItem = ({ profileId }: { profileId: string }) => {
  const profile = useAppStore((state) => state.data.profiles[profileId])
  const updateProfile = useAppStore((state) => state.actions.updateProfile)
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const deleteProfile = useAppStore((state) => state.actions.deleteProfile)
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
    return null
  }

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

  const handleDuplicate = () => {
    duplicateProfile({ sourceProfileId: profile.id })
  }

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete profile "${profile.name}"? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    deleteProfile(profile.id)
  }

  return (
    <li className="rounded-xl border border-slate-200 px-4 py-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              value={name}
              onBlur={handleSave}
              onChange={(event) => setName(event.target.value)}
            />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {profile.jobId === null ? 'Base profile' : `Job profile · ${profile.jobId}`}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-400">Updated {new Date(profile.updatedAt).toLocaleString()}</p>
        </div>

        <div className="flex flex-wrap gap-2">
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
          <Link
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            to={`/previews/cover-letter/${profile.id}`}
          >
            Cover letter
          </Link>
          <button
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={handleDuplicate}
            type="button"
          >
            Duplicate
          </button>
          <button
            className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            onClick={handleDelete}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700 xl:col-span-2">
            <span className="font-medium">Professional summary</span>
            <textarea
              className="min-h-28 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              placeholder="Professional summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700 xl:col-span-2">
            <span className="font-medium">Cover letter content</span>
            <textarea
              className="min-h-40 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
              placeholder="Cover letter content"
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
            />
          </label>
        </div>

        <>
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Personal details</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Full name" value={personalDetails.fullName} onChange={(value) => setPersonalDetails({ ...personalDetails, fullName: value })} />
              <Field label="Email" type="email" value={personalDetails.email} onChange={(value) => setPersonalDetails({ ...personalDetails, email: value })} />
              <Field label="Phone" type="tel" value={personalDetails.phone} onChange={(value) => setPersonalDetails({ ...personalDetails, phone: value })} />
              <Field label="Address line 1" value={personalDetails.addressLine1} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine1: value })} />
              <Field label="Address line 2" value={personalDetails.addressLine2} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine2: value })} />
              <Field label="Address line 3" value={personalDetails.addressLine3} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine3: value })} />
              <Field label="Address line 4" value={personalDetails.addressLine4} onChange={(value) => setPersonalDetails({ ...personalDetails, addressLine4: value })} />
              <Field label="City" value={personalDetails.city} onChange={(value) => setPersonalDetails({ ...personalDetails, city: value })} />
              <Field label="Region" value={personalDetails.region} onChange={(value) => setPersonalDetails({ ...personalDetails, region: value })} />
              <Field label="Postal code" value={personalDetails.postalCode} onChange={(value) => setPersonalDetails({ ...personalDetails, postalCode: value })} />
              <Field label="Country" value={personalDetails.country} onChange={(value) => setPersonalDetails({ ...personalDetails, country: value })} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Links</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="LinkedIn" type="url" value={links.linkedinUrl} onChange={(value) => setLinks({ ...links, linkedinUrl: value })} />
              <Field label="GitHub" type="url" value={links.githubUrl} onChange={(value) => setLinks({ ...links, githubUrl: value })} />
              <Field label="Portfolio" type="url" value={links.portfolioUrl} onChange={(value) => setLinks({ ...links, portfolioUrl: value })} />
              <Field label="Website" type="url" value={links.websiteUrl} onChange={(value) => setLinks({ ...links, websiteUrl: value })} />
            </div>
          </div>
        </>

        <div className="mt-6 flex justify-end">
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            onClick={handleSave}
            type="button"
          >
            Save details
          </button>
        </div>
      </div>

      <ProfileChildEditors profileId={profile.id} />
    </li>
  )
}

export const ProfilesPage = () => {
  const profilesById = useAppStore((state) => state.data.profiles)
  const createBaseProfile = useAppStore((state) => state.actions.createBaseProfile)
  const [name, setName] = useState('')

  const profiles = useMemo(() => Object.values(profilesById), [profilesById])

  const sortedProfiles = useMemo(
    () => [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [profiles],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      return
    }

    createBaseProfile(trimmed)
    setName('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Profiles</h1>
        <p className="mt-2 text-sm text-slate-600">Create base profiles now. Job profile workflows can layer on top of the same store structure.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quick add base profile</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-500"
            placeholder="General Software Engineer"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700" type="submit">
            Add profile
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Profile list</h2>
          <span className="text-sm text-slate-500">{sortedProfiles.length} total</span>
        </div>

        {sortedProfiles.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No profiles yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedProfiles.map((profile) => (
              <ProfileListItem key={profile.id} profileId={profile.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

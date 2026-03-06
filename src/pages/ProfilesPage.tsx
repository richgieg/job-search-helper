import { FormEvent, useMemo, useState } from 'react'

import { useAppStore } from '../store/app-store'

const ProfileListItem = ({ profileId }: { profileId: string }) => {
  const profile = useAppStore((state) => state.data.profiles[profileId])
  const updateProfile = useAppStore((state) => state.actions.updateProfile)
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const deleteProfile = useAppStore((state) => state.actions.deleteProfile)
  const [name, setName] = useState(profile?.name ?? '')

  if (!profile) {
    return null
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === profile.name) {
      setName(profile.name)
      return
    }

    updateProfile({
      profileId: profile.id,
      changes: { name: trimmed },
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
    </li>
  )
}

export const ProfilesPage = () => {
  const profiles = useAppStore((state) => Object.values(state.data.profiles))
  const createBaseProfile = useAppStore((state) => state.actions.createBaseProfile)
  const [name, setName] = useState('')

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

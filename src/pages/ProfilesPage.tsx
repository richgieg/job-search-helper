import { SubmitEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAppStore } from '../store/app-store'

const ProfileListItem = ({ profileId }: { profileId: string }) => {
  const profile = useAppStore((state) => state.data.profiles[profileId])
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const deleteProfile = useAppStore((state) => state.actions.deleteProfile)

  if (!profile) {
    return null
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
    <tr className="border-t border-slate-200 first:border-t-0">
      <td className="px-4 py-4 align-top">
        <div>
          <Link className="font-medium text-slate-900 hover:text-sky-700" to={`/profiles/${profile.id}`}>
            {profile.name}
          </Link>
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-600">{new Date(profile.updatedAt).toLocaleString()}</td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap justify-end gap-2">
          <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/profiles/${profile.id}`}>
            Open
          </Link>
          <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={handleDuplicate} type="button">
            Duplicate
          </button>
          <button className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={handleDelete} type="button">
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

export const ProfilesPage = () => {
  const profilesById = useAppStore((state) => state.data.profiles)
  const createBaseProfile = useAppStore((state) => state.actions.createBaseProfile)
  const [name, setName] = useState('')

  const profiles = useMemo(() => Object.values(profilesById).filter((profile) => profile.jobId === null), [profilesById])

  const sortedProfileIds = useMemo(() => [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map((profile) => profile.id), [profiles])

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
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
        <p className="mt-2 text-sm text-slate-600">Use this page as a lightweight overview of reusable base profiles. Open any profile to edit its details, links, document content, and child records.</p>
      </div>

      <section className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-sky-500"
            placeholder="Profile name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700" type="submit">
            Add profile
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {sortedProfileIds.length === 0 ? (
          <p className="text-sm text-slate-500">No profiles yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Profile</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProfileIds.map((profileId) => (
                  <ProfileListItem key={profileId} profileId={profileId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

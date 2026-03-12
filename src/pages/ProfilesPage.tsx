import { SubmitEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { DeleteIconButton, IconActionButton, getActionIconButtonClassName } from '../components/CompactActionControls'
import { useAppStore } from '../store/app-store'

const ProfileListItem = ({ profileId }: { profileId: string }) => {
  const profile = useAppStore((state) => state.data.profiles[profileId])
  const duplicateProfile = useAppStore((state) => state.actions.duplicateProfile)
  const deleteProfile = useAppStore((state) => state.actions.deleteProfile)

  if (!profile) {
    return null
  }

  const handleDuplicate = () => {
    void duplicateProfile({ sourceProfileId: profile.id })
  }

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete profile "${profile.name}"? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    void deleteProfile(profile.id)
  }

  return (
    <tr className="border-t border-app-border-muted first:border-t-0">
      <td className="border-r border-app-border-muted px-4 py-3 align-middle last:border-r-0">
        <div>
          <Link className="font-medium text-app-text hover:text-app-primary-hover" to={`/profiles/${profile.id}`}>
            {profile.name}
          </Link>
        </div>
      </td>
      <td className="border-r border-app-border-muted px-4 py-3 align-middle text-sm text-app-text-subtle last:border-r-0 whitespace-nowrap">{new Date(profile.updatedAt).toLocaleString()}</td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-wrap justify-end gap-2">
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
      </td>
    </tr>
  )
}

export const ProfilesPage = () => {
  const profilesById = useAppStore((state) => state.data.profiles)
  const createBaseProfile = useAppStore((state) => state.actions.createBaseProfile)
  const [name, setName] = useState('')

  const profiles = useMemo(() => Object.values(profilesById).filter((profile) => profile.jobId === null), [profilesById])

  const sortedProfileIds = useMemo(() => [...profiles].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).map((profile) => profile.id), [profiles])

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      return
    }

    await createBaseProfile(trimmed)
    setName('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Profiles</h1>
        <p className="mt-2 text-sm text-app-text-subtle">Create and manage the base profiles you can tailor for each opportunity.</p>
      </div>

      <section className="max-w-xl rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-app-text-muted">
            <span className="font-medium">Profile name</span>
            <input
              className="min-w-0 flex-1 rounded-xl border border-app-border px-3 py-2 text-sm outline-none ring-0 transition focus:border-app-focus-ring"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <div className="flex justify-end">
            <button className="rounded-xl bg-app-primary px-3 py-2 text-sm font-medium text-app-primary-contrast hover:bg-app-primary-hover" type="submit">
              Add profile
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        {sortedProfileIds.length === 0 ? (
          <p className="p-6 text-sm text-app-text-subtle">No profiles yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse table-fixed text-sm">
              <colgroup>
                <col className="w-[58%]" />
                <col className="w-[18%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-app-border bg-app-surface-subtle text-left text-xs font-semibold uppercase tracking-[0.18em] text-app-text-subtle">
                  <th className="border-r border-app-border px-4 py-3 last:border-r-0">Profile</th>
                  <th className="border-r border-app-border px-4 py-3 last:border-r-0">Updated</th>
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

import { SubmitEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { createStaticPageTitle } from '../app/page-titles'
import { usePageTitle } from '../app/use-page-title'
import type { ProfilesListItemDto } from '../api/read-models'
import { DeleteIconButton, IconActionButton, getActionIconButtonClassName } from '../components/CompactActionControls'
import { useProfileMutations } from '../features/profiles/use-profile-mutations'
import { useProfilesListQuery } from '../queries/use-profiles-list-query'

const ProfileListItem = ({
  profile,
  onDeleteProfile,
  onDuplicateProfile,
}: {
  profile: ProfilesListItemDto
  onDeleteProfile: (profileId: string) => Promise<void>
  onDuplicateProfile: (profileId: string) => Promise<void>
}) => {
  const handleDuplicate = () => {
    void onDuplicateProfile(profile.id)
  }

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete profile "${profile.name}"? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    void onDeleteProfile(profile.id)
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
        <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
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

const ProfilesQuickAddForm = ({ onCreateProfile }: { onCreateProfile: (name: string) => Promise<string | null> }) => {
  const [name, setName] = useState('')

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      return
    }

    await onCreateProfile(trimmed)
    setName('')
  }

  return (
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
  )
}

export const ProfilesPage = () => {
  usePageTitle(createStaticPageTitle('Profiles'))

  const { createBaseProfile, deleteProfile, duplicateProfile } = useProfileMutations()
  const { data, error, isLoading } = useProfilesListQuery('base')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Profiles</h1>
        <p className="mt-2 text-sm text-app-text-subtle">Create and manage the base profiles you can tailor for each opportunity.</p>
      </div>

      <ProfilesQuickAddForm onCreateProfile={createBaseProfile} />

      {error ? (
        <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft px-4 py-3 text-sm text-app-status-rejected">
          Unable to refresh profiles right now. Showing the most recently cached result if available.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        {isLoading && !data ? (
          <p className="p-6 text-sm text-app-text-subtle">Loading profiles...</p>
        ) : data && data.items.length === 0 ? (
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
                {(data?.items ?? []).map((profile) => (
                  <ProfileListItem
                    key={profile.id}
                    profile={profile}
                    onDeleteProfile={deleteProfile}
                    onDuplicateProfile={(profileId) => duplicateProfile({ sourceProfileId: profileId }).then(() => undefined)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

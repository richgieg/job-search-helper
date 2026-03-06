import { useMemo } from 'react'

import { useAppStore } from '../store/app-store'

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
  </div>
)

export const DashboardPage = () => {
  const profiles = useAppStore((state) => state.data.profiles)
  const jobs = useAppStore((state) => state.data.jobs)
  const contacts = useAppStore((state) => state.data.jobContacts)
  const events = useAppStore((state) => state.data.jobEvents)

  const stats = useMemo(
    () => ({
      profileCount: Object.keys(profiles).length,
      jobCount: Object.keys(jobs).length,
      contactCount: Object.keys(contacts).length,
      eventCount: Object.keys(events).length,
    }),
    [contacts, events, jobs, profiles],
  )

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          This scaffold includes the app shell, routing, store foundation, and import/export plumbing for the
          browser-only MVP.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Profiles" value={stats.profileCount} />
        <StatCard label="Jobs" value={stats.jobCount} />
        <StatCard label="Contacts" value={stats.contactCount} />
        <StatCard label="Events" value={stats.eventCount} />
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Next implementation targets</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Expand the store actions to match the documented state actions.</li>
          <li>Build profile and job CRUD forms.</li>
          <li>Add import validation with Zod.</li>
          <li>Wire generated document previews.</li>
        </ul>
      </section>
    </div>
  )
}

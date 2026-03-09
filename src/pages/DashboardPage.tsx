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
        <p className="mt-2 max-w-3xl text-sm text-slate-600">See your job search at a glance and stay on top of next steps.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Profiles" value={stats.profileCount} />
        <StatCard label="Jobs" value={stats.jobCount} />
        <StatCard label="Contacts" value={stats.contactCount} />
        <StatCard label="Events" value={stats.eventCount} />
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
        <h2 className="text-lg font-semibold text-slate-900">How to use this dashboard</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Create or update reusable base profiles.</li>
          <li>Add jobs and attach tailored job profiles.</li>
          <li>Track contacts, application questions, and timeline events.</li>
          <li>Generate resume, cover letter, and application previews.</li>
          <li>Export JSON backups or restore from an import.</li>
        </ul>
      </section>
    </div>
  )
}

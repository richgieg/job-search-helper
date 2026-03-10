import { useMemo } from 'react'

import { useAppStore } from '../store/app-store'

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-app-border-muted bg-app-surface p-5 shadow-sm">
    <p className="text-sm font-medium text-app-text-subtle">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-app-text">{value}</p>
  </div>
)

export const DashboardPage = () => {
  const profiles = useAppStore((state) => state.data.profiles)
  const jobs = useAppStore((state) => state.data.jobs)
  const contacts = useAppStore((state) => state.data.jobContacts)
  const interviews = useAppStore((state) => state.data.interviews)

  const stats = useMemo(
    () => ({
      profileCount: Object.keys(profiles).length,
      jobCount: Object.keys(jobs).length,
      contactCount: Object.keys(contacts).length,
      interviewCount: Object.keys(interviews).length,
    }),
    [contacts, interviews, jobs, profiles],
  )

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-app-text-subtle">See your job search at a glance and stay on top of next steps.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Profiles" value={stats.profileCount} />
        <StatCard label="Jobs" value={stats.jobCount} />
        <StatCard label="Contacts" value={stats.contactCount} />
        <StatCard label="Interviews" value={stats.interviewCount} />
      </section>

      <section className="rounded-2xl border border-dashed border-app-border bg-app-surface-overlay p-6">
        <h2 className="text-lg font-semibold text-app-text">How to use this dashboard</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-app-text-subtle">
          <li>Create or update reusable base profiles.</li>
          <li>Add jobs and attach tailored job profiles.</li>
          <li>Track contacts, application questions, interviews, and outcomes.</li>
          <li>Generate resume, cover letter, and application previews.</li>
          <li>Export JSON backups or restore from an import.</li>
        </ul>
      </section>
    </div>
  )
}

import { useDashboardSummaryQuery } from '../queries/use-dashboard-summary-query'
import type { DashboardUpcomingInterviewDto } from '../api/read-models'

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-app-border-muted bg-app-surface p-5 shadow-sm">
    <p className="text-sm font-medium text-app-text-subtle">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-app-text">{value}</p>
  </div>
)

const MetricSection = ({ title, metrics }: { title: string; metrics: Array<{ label: string; value: number }> }) => (
  <section className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-app-heading">{title}</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <StatCard key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </div>
  </section>
)

const getUpcomingInterviewOrganizationName = (interview: DashboardUpcomingInterviewDto) =>
  interview.companyName || interview.staffingAgencyName || 'Unknown organization'

const formatInterviewDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

export const DashboardPage = () => {
  const { data, error, isLoading } = useDashboardSummaryQuery()
  const newJobMetrics = [
    { label: 'Added today', value: data?.addedTodayCount ?? 0 },
    { label: 'Added last 7 days', value: data?.addedLast7DaysCount ?? 0 },
  ]
  const applicationMetrics = [
    { label: 'Applied today', value: data?.appliedTodayCount ?? 0 },
    { label: 'Applied last 7 days', value: data?.appliedLast7DaysCount ?? 0 },
    { label: 'Not applied', value: data?.notAppliedCount ?? 0 },
  ]
  const interviewMetrics = [
    { label: 'Interviews booked today', value: data?.interviewsBookedTodayCount ?? 0 },
    { label: 'Interviews booked last 7 days', value: data?.interviewsBookedLast7DaysCount ?? 0 },
  ]
  const offerMetrics = [
    { label: 'Offers received today', value: data?.offersReceivedTodayCount ?? 0 },
    { label: 'Offers received last 7 days', value: data?.offersReceivedLast7DaysCount ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-app-text-subtle">See whether your search is building momentum, converting into applications and interviews, and what is coming up next.</p>
      </section>

      {isLoading && !data ? <p className="text-sm text-app-text-subtle">Loading dashboard...</p> : null}
      {error ? (
        <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft px-4 py-3 text-sm text-app-status-rejected">
          Unable to refresh dashboard metrics right now. Showing the most recently cached result if available.
        </div>
      ) : null}

      {data?.upcomingInterviews.length ? (
        <section className="rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-lg font-semibold text-app-heading">Upcoming interviews</h2>
            <p className="text-sm text-app-text-subtle">{data.upcomingInterviews.length} scheduled</p>
          </div>

          <ul className="mt-4 space-y-3">
            {data.upcomingInterviews.map((interview) => {
              const organizationName = getUpcomingInterviewOrganizationName(interview)

              return (
                <li key={interview.interviewId} className="rounded-xl border border-app-border-muted px-4 py-3">
                  <a className="block hover:text-app-primary-hover" href={`/jobs/${interview.jobId}`}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <p className="font-medium text-app-text">{interview.jobTitle}</p>
                        <p className="text-sm text-app-text-subtle">{organizationName}</p>
                      </div>
                      <p className="text-sm font-medium text-app-text-muted">{formatInterviewDateTime(interview.startAt)}</p>
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
        <div className="space-y-8">
          <MetricSection title="Jobs" metrics={newJobMetrics} />

          <MetricSection title="Applications" metrics={applicationMetrics} />

          <MetricSection title="Interviews" metrics={interviewMetrics} />

          <MetricSection title="Offers" metrics={offerMetrics} />
        </div>
      </section>
    </div>
  )
}

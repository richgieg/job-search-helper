import { useState } from 'react'

import type { DashboardActivityDto, DashboardActivityPeriodDays, DashboardUpcomingInterviewDto } from '../api/read-models'
import { useDashboardActivityQuery } from '../queries/use-dashboard-activity-query'
import { useDashboardSummaryQuery } from '../queries/use-dashboard-summary-query'

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

const activityChartSeries = [
  { key: 'jobsAddedCount', label: 'Jobs added', color: 'var(--app-primary)' },
  { key: 'applicationsSubmittedCount', label: 'Applications submitted', color: 'var(--app-status-applied)' },
  { key: 'interviewsBookedCount', label: 'Interviews booked', color: 'var(--app-status-interview-muted)' },
  { key: 'offersReceivedCount', label: 'Offers received', color: 'var(--app-status-offer)' },
] as const

const chartViewBox = {
  width: 720,
  height: 260,
  paddingTop: 16,
  paddingRight: 16,
  paddingBottom: 40,
  paddingLeft: 32,
}

const formatActivityAxisLabel = (value: string, periodDays: DashboardActivityPeriodDays) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(undefined, periodDays === 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' })

const formatActivityA11yDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

const getVisibleActivityLabelIndexes = (length: number) => {
  if (length <= 7) {
    return Array.from({ length }, (_, index) => index)
  }

  const step = Math.max(1, Math.floor(length / 6))
  const indexes = new Set<number>([0, length - 1])

  for (let index = 0; index < length; index += step) {
    indexes.add(index)
  }

  return [...indexes].sort((left, right) => left - right)
}

const getChartTickValues = (maxValue: number) => {
  const midpoint = Math.ceil(maxValue / 2)
  return [...new Set([0, midpoint, maxValue])].sort((left, right) => left - right)
}

const DashboardActivityChart = ({ data }: { data: DashboardActivityDto }) => {
  const plotWidth = chartViewBox.width - chartViewBox.paddingLeft - chartViewBox.paddingRight
  const plotHeight = chartViewBox.height - chartViewBox.paddingTop - chartViewBox.paddingBottom
  const maxValue = Math.max(1, ...data.points.flatMap((point) => [point.jobsAddedCount, point.applicationsSubmittedCount, point.interviewsBookedCount, point.offersReceivedCount]))
  const yTicks = getChartTickValues(maxValue)
  const labelIndexes = getVisibleActivityLabelIndexes(data.points.length)
  const clusterWidth = data.points.length === 1 ? plotWidth * 0.7 : plotWidth / data.points.length
  const clusterInnerWidth = Math.max(20, Math.min(48, clusterWidth * 0.78))
  const gapWidth = Math.max(2, Math.min(4, clusterInnerWidth * 0.06))
  const barWidth = Math.max(3, (clusterInnerWidth - gapWidth * (activityChartSeries.length - 1)) / activityChartSeries.length)

  const getClusterCenterX = (index: number) =>
    chartViewBox.paddingLeft + (data.points.length === 1 ? plotWidth / 2 : ((index + 0.5) * plotWidth) / data.points.length)
  const getY = (value: number) => chartViewBox.paddingTop + plotHeight - (value / maxValue) * plotHeight

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm text-app-text-muted">
        {activityChartSeries.map((series) => (
          <div key={series.key} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ backgroundColor: series.color }} />
            <span>{series.label}</span>
          </div>
        ))}
      </div>

      <svg
        aria-label={`Dashboard activity over the last ${data.periodDays} days`}
        className="w-full"
        role="img"
        viewBox={`0 0 ${chartViewBox.width} ${chartViewBox.height}`}
      >
        {yTicks.map((tick) => {
          const y = getY(tick)

          return (
            <g key={tick}>
              <line stroke="var(--app-border-muted)" strokeDasharray="4 4" x1={chartViewBox.paddingLeft} x2={chartViewBox.width - chartViewBox.paddingRight} y1={y} y2={y} />
              <text fill="var(--app-text-subtle)" fontSize="11" textAnchor="end" x={chartViewBox.paddingLeft - 8} y={y + 4}>
                {tick}
              </text>
            </g>
          )
        })}

        {data.points.map((point, index) => {
          const clusterStartX = getClusterCenterX(index) - clusterInnerWidth / 2
          const dayLabel = formatActivityA11yDate(point.date)

          return (
            <g key={point.date}>
              {activityChartSeries.map((series, seriesIndex) => {
                const value = point[series.key]
                const y = getY(value)
                const height = chartViewBox.paddingTop + plotHeight - y
                const x = clusterStartX + seriesIndex * (barWidth + gapWidth)

                return (
                  <rect
                    aria-label={`${dayLabel} ${series.label.toLowerCase()}: ${value}`}
                    fill={series.color}
                    height={height}
                    key={`${point.date}-${series.key}`}
                    width={barWidth}
                    x={x}
                    y={y}
                  />
                )
              })}
            </g>
          )
        })}

        {labelIndexes.map((index) => (
          <text
            fill="var(--app-text-subtle)"
            fontSize="11"
            key={data.points[index]!.date}
            textAnchor="middle"
            x={getClusterCenterX(index)}
            y={chartViewBox.height - 12}
          >
            {formatActivityAxisLabel(data.points[index]!.date, data.periodDays)}
          </text>
        ))}
      </svg>
    </div>
  )
}

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
  const [activityPeriodDays, setActivityPeriodDays] = useState<DashboardActivityPeriodDays>(7)
  const { data, error, isLoading } = useDashboardSummaryQuery()
  const {
    data: activityData,
    error: activityError,
    isLoading: isActivityLoading,
  } = useDashboardActivityQuery(activityPeriodDays)
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
        <p className="mt-2 max-w-3xl text-sm text-app-text-subtle">See how your job search is progressing and what needs attention next.</p>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-app-heading">Activity</h2>
            <p className="mt-1 text-sm text-app-text-subtle">Daily activity over the last {activityPeriodDays} days.</p>
          </div>

          <div aria-label="Activity chart period" className="inline-flex rounded-xl border border-app-border-muted bg-app-surface-subtle p-1" role="group">
            {[7, 30].map((periodDays) => {
              const isSelected = activityPeriodDays === periodDays

              return (
                <button
                  aria-pressed={isSelected}
                  className={[
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isSelected ? 'bg-app-primary text-app-primary-contrast' : 'text-app-text-muted hover:bg-app-surface-muted',
                  ].join(' ')}
                  key={periodDays}
                  onClick={() => setActivityPeriodDays(periodDays as DashboardActivityPeriodDays)}
                  type="button"
                >
                  {periodDays} days
                </button>
              )
            })}
          </div>
        </div>

        {isActivityLoading && !activityData ? <p className="mt-4 text-sm text-app-text-subtle">Loading activity chart...</p> : null}
        {activityError && !activityData ? <p className="mt-4 text-sm text-app-status-rejected">Unable to load activity chart right now.</p> : null}
        {activityData ? <div className="mt-6"><DashboardActivityChart data={activityData} /></div> : null}
      </section>

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

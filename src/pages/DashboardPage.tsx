import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { DashboardActivityDto, DashboardActivityPeriodDays, DashboardUpcomingInterviewDto } from '../api/read-models'
import { useDashboardActivityQuery } from '../queries/use-dashboard-activity-query'
import { useDashboardSummaryQuery } from '../queries/use-dashboard-summary-query'

const summaryMetricTones = [
  'bg-app-primary-soft text-app-primary',
  'bg-app-status-applied-soft text-app-status-applied',
  'bg-app-status-interview-soft text-app-status-interview',
  'bg-app-status-offer-soft text-app-status-offer',
] as const

const SummaryStatCard = ({
  label,
  toneClassName,
  value,
}: {
  label: string
  toneClassName: string
  value: number
}) => (
  <div className="rounded-[1.75rem] border border-app-border bg-app-surface/85 p-5 shadow-sm backdrop-blur-sm">
    <div className={[toneClassName, 'inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]'].join(' ')}>
      {label}
    </div>
    <p className="mt-4 text-3xl font-semibold tracking-tight text-app-heading">{value}</p>
  </div>
)

const MetricSection = ({
  title,
  metrics,
}: {
  title: string
  metrics: Array<{ label: string; toneClassName: string; value: number }>
}) => (
  <section className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-app-heading">{title}</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <SummaryStatCard key={metric.label} label={metric.label} toneClassName={metric.toneClassName} value={metric.value} />
      ))}
    </div>
  </section>
)

const DashboardSummarySkeleton = () => (
  <div aria-hidden="true" className="space-y-8">
    {['Today', 'Last 7 days', 'Totals'].map((title) => (
      <section className="space-y-4" key={title}>
        <div>
          <div className="h-6 w-28 rounded bg-app-surface-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, cardIndex) => (
            <div className="rounded-[1.75rem] border border-app-border bg-app-surface/85 p-5 shadow-sm" key={cardIndex}>
              <div className="h-6 w-20 rounded-full bg-app-surface-muted" />
              <div className="mt-4 h-9 w-14 rounded bg-app-surface-muted" />
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
)

const activityChartSeries = [
  { key: 'jobsAddedCount', label: 'Jobs added', color: 'var(--app-primary)' },
  { key: 'applicationsSubmittedCount', label: 'Applications submitted', color: 'var(--app-status-applied)' },
  { key: 'interviewsBookedCount', label: 'Interviews booked', color: 'var(--app-status-interview)' },
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

const DashboardActivityLegend = () => (
  <div className="flex flex-wrap gap-3 text-sm text-app-text-muted">
    {activityChartSeries.map((series) => (
      <div key={series.key} className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ backgroundColor: series.color }} />
        <span>{series.label}</span>
      </div>
    ))}
  </div>
)

const DashboardActivityChartFrame = ({ children }: { children: ReactNode }) => <div className="mt-6 min-h-88">{children}</div>

const DashboardActivityChartSkeleton = () => (
  <div aria-hidden="true" className="pt-4">
    <div className="rounded-xl border border-app-border-muted bg-app-surface-subtle p-4">
      <div className="flex h-72 items-end gap-3">
        {Array.from({ length: 7 }, (_, index) => (
          <div className="flex flex-1 items-end gap-1" key={index}>
            {Array.from({ length: activityChartSeries.length }, (_, seriesIndex) => (
              <div
                className="flex-1 bg-app-surface-muted"
                key={seriesIndex}
                style={{ height: `${28 + ((index + seriesIndex) % 4) * 16}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
)

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
    <div className="pt-4">
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
  const todayMetrics = [
    { label: 'Jobs Added', toneClassName: summaryMetricTones[0], value: data?.addedTodayCount ?? 0 },
    { label: 'Applications Sent', toneClassName: summaryMetricTones[1], value: data?.appliedTodayCount ?? 0 },
    {
      label: 'Interviews Booked',
      toneClassName: summaryMetricTones[2],
      value: data?.interviewsBookedTodayCount ?? 0,
    },
    {
      label: 'Offers Received',
      toneClassName: summaryMetricTones[3],
      value: data?.offersReceivedTodayCount ?? 0,
    },
  ]
  const thisWeekMetrics = [
    { label: 'Jobs Added', toneClassName: summaryMetricTones[0], value: data?.addedLast7DaysCount ?? 0 },
    {
      label: 'Applications Sent',
      toneClassName: summaryMetricTones[1],
      value: data?.appliedLast7DaysCount ?? 0,
    },
    {
      label: 'Interviews Booked',
      toneClassName: summaryMetricTones[2],
      value: data?.interviewsBookedLast7DaysCount ?? 0,
    },
    {
      label: 'Offers Received',
      toneClassName: summaryMetricTones[3],
      value: data?.offersReceivedLast7DaysCount ?? 0,
    },
  ]
  const totalMetrics = [
    {
      label: 'Jobs Added',
      toneClassName: summaryMetricTones[0],
      value: data?.totalJobsAddedCount ?? 0,
    },
    {
      label: 'Applications Sent',
      toneClassName: summaryMetricTones[1],
      value: data?.totalApplicationsSentCount ?? 0,
    },
    {
      label: 'Interviews Booked',
      toneClassName: summaryMetricTones[2],
      value: data?.totalInterviewsBookedCount ?? 0,
    },
    {
      label: 'Offers Received',
      toneClassName: summaryMetricTones[3],
      value: data?.totalOffersReceivedCount ?? 0,
    },
  ]

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-app-text-subtle">See how your job search is progressing and what needs attention next.</p>
      </section>

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
                  <Link className="block hover:text-app-primary-hover" to={`/jobs/${interview.jobId}`}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <p className="font-medium text-app-text">{interview.jobTitle}</p>
                        <p className="text-sm text-app-text-subtle">{organizationName}</p>
                      </div>
                      <p className="text-sm font-medium text-app-text-muted">{formatInterviewDateTime(interview.startAt)}</p>
                    </div>
                  </Link>
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

        <DashboardActivityChartFrame>
          <DashboardActivityLegend />
          {isActivityLoading && !activityData ? (
            <DashboardActivityChartSkeleton />
          ) : null}
          {activityError && !activityData ? <p className="text-sm text-app-status-rejected">Unable to load activity chart right now.</p> : null}
          {activityData ? <DashboardActivityChart data={activityData} /> : null}
        </DashboardActivityChartFrame>
      </section>

      <section className="rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
        {isLoading && !data ? (
          <DashboardSummarySkeleton />
        ) : (
          <div className="space-y-8">
            <MetricSection title="Today" metrics={todayMetrics} />

            <MetricSection title="Last 7 days" metrics={thisWeekMetrics} />

            <MetricSection title="Totals" metrics={totalMetrics} />
          </div>
        )}
      </section>
    </div>
  )
}

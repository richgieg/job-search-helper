import sampleDataTemplateJson from '../../../sample-data/sample-data.json'

import { validateAppExportFile } from './app-export-file'
import type { AppExportFile } from '../../types/state'

// Generates a fresh sample export from the bundled template at runtime.
//
// The timestamp anchor is the `interview-summit-architecture` interview. Its
// source timestamp is interpreted in the sample-data source timezone and moved
// to the next occurrence of that interview's weekday while preserving the same
// intended local wall-clock time for the current user.
//
// Once that anchor target is computed, the generator derives a single
// millisecond timestamp shift and a corresponding whole-day date shift, then
// applies those shifts recursively across all ISO timestamp and ISO date values
// in the sample export template.

const dayInMilliseconds = 24 * 60 * 60 * 1000
const sampleDataAnchorTimeZone = 'America/Los_Angeles'

const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const weekdayNumberByShortLabel = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
} as const

const sampleDataTemplate = validateAppExportFile(sampleDataTemplateJson)

const shiftIsoTimestampByMilliseconds = (value: string, timestampShiftMilliseconds: number) =>
  new Date(Date.parse(value) + timestampShiftMilliseconds).toISOString()

const getSourceWallClockParts = (value: string, timeZone: string) => {
  const source = new Date(value)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(source)
  const weekdayLabel = parts.find((part) => part.type === 'weekday')?.value
  const hourLabel = parts.find((part) => part.type === 'hour')?.value
  const minuteLabel = parts.find((part) => part.type === 'minute')?.value
  const secondLabel = parts.find((part) => part.type === 'second')?.value

  if (!weekdayLabel || hourLabel === undefined || minuteLabel === undefined || secondLabel === undefined) {
    throw new Error('Could not read sample-data anchor wall-clock parts.')
  }

  const weekday = weekdayNumberByShortLabel[weekdayLabel as keyof typeof weekdayNumberByShortLabel]

  if (weekday === undefined) {
    throw new Error('Sample-data anchor weekday could not be mapped.')
  }

  return {
    weekday,
    hour: Number(hourLabel),
    minute: Number(minuteLabel),
    second: Number(secondLabel),
    millisecond: source.getUTCMilliseconds(),
  }
}

const setIsoTimestampToNextMatchingWeekdayPreservingLocalTime = (value: string, now: Date, sourceTimeZone: string) => {
  const sourceWallClock = getSourceWallClockParts(value, sourceTimeZone)
  const sourceWeekday = sourceWallClock.weekday
  const nowWeekday = now.getDay()
  const daysUntilNextMatchingWeekday = sourceWeekday > nowWeekday ? sourceWeekday - nowWeekday : sourceWeekday + 7 - nowWeekday
  const target = new Date(now)

  target.setDate(now.getDate() + daysUntilNextMatchingWeekday)
  target.setHours(sourceWallClock.hour, sourceWallClock.minute, sourceWallClock.second, sourceWallClock.millisecond)

  return target.toISOString()
}

const shiftIsoDate = (value: string, dateShiftDays: number) => {
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const shiftedTime = Date.UTC(year, month - 1, day + dateShiftDays)

  return new Date(shiftedTime).toISOString().slice(0, 10)
}

const shiftDatesRecursively = (
  value: unknown,
  timestampShiftMilliseconds: number,
  dateShiftDays: number,
): unknown => {
  if (typeof value === 'string') {
    if (isoTimestampPattern.test(value)) {
      return shiftIsoTimestampByMilliseconds(value, timestampShiftMilliseconds)
    }

    if (isoDatePattern.test(value)) {
      return shiftIsoDate(value, dateShiftDays)
    }

    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => shiftDatesRecursively(entry, timestampShiftMilliseconds, dateShiftDays))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, shiftDatesRecursively(entry, timestampShiftMilliseconds, dateShiftDays)]),
    )
  }

  return value
}

export const generateSampleAppExportFile = (now = new Date()): AppExportFile => {
  const summitArchitectureInterview = sampleDataTemplate.data.interviews['interview-summit-architecture']
  const summitArchitectureStartAt = summitArchitectureInterview?.startAt

  if (!summitArchitectureStartAt) {
    throw new Error('Sample data is missing the summit architecture interview start time.')
  }

  const targetSummitArchitectureStartAt = setIsoTimestampToNextMatchingWeekdayPreservingLocalTime(
    summitArchitectureStartAt,
    now,
    sampleDataAnchorTimeZone,
  )
  const timestampShiftMilliseconds = Date.parse(targetSummitArchitectureStartAt) - Date.parse(summitArchitectureStartAt)
  const dateShiftDays = Math.round(timestampShiftMilliseconds / dayInMilliseconds)
  const generated = shiftDatesRecursively(
    sampleDataTemplate,
    timestampShiftMilliseconds,
    dateShiftDays,
  ) as AppExportFile

  return validateAppExportFile(generated)
}
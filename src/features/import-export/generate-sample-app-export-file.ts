import sampleDataTemplateJson from '../../../sample-data/sample-data.json'

import { validateAppExportFile } from './app-export-file'
import type { AppExportFile } from '../../types/state'

const dayInMilliseconds = 24 * 60 * 60 * 1000

const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

const sampleDataTemplate = validateAppExportFile(sampleDataTemplateJson)

const shiftIsoTimestampByMilliseconds = (value: string, timestampShiftMilliseconds: number) =>
  new Date(Date.parse(value) + timestampShiftMilliseconds).toISOString()

const setIsoTimestampToNextMatchingWeekdayPreservingTime = (value: string, now: Date) => {
  const source = new Date(value)
  const sourceWeekday = source.getUTCDay()
  const nowWeekday = now.getUTCDay()
  const daysUntilNextMatchingWeekday = sourceWeekday > nowWeekday ? sourceWeekday - nowWeekday : sourceWeekday + 7 - nowWeekday

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilNextMatchingWeekday,
      source.getUTCHours(),
      source.getUTCMinutes(),
      source.getUTCSeconds(),
      source.getUTCMilliseconds(),
    ),
  ).toISOString()
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

  const targetSummitArchitectureStartAt = setIsoTimestampToNextMatchingWeekdayPreservingTime(summitArchitectureStartAt, now)
  const timestampShiftMilliseconds = Date.parse(targetSummitArchitectureStartAt) - Date.parse(summitArchitectureStartAt)
  const dateShiftDays = Math.round(timestampShiftMilliseconds / dayInMilliseconds)
  const generated = shiftDatesRecursively(
    sampleDataTemplate,
    timestampShiftMilliseconds,
    dateShiftDays,
  ) as AppExportFile

  return validateAppExportFile(generated)
}
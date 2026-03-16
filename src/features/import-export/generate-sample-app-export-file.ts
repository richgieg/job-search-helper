import sampleDataTemplateJson from '../../../sample-data/sample-data.json'

import { validateAppExportFile } from './app-export-file'
import type { AppExportFile } from '../../types/state'

const dayInMilliseconds = 24 * 60 * 60 * 1000

const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

const sampleDataTemplate = validateAppExportFile(sampleDataTemplateJson)

const getUtcDayStart = (value: Date) => Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())

const shiftIsoTimestamp = (value: string, timestampShiftMilliseconds: number) =>
  new Date(Date.parse(value) + timestampShiftMilliseconds).toISOString()

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
      return shiftIsoTimestamp(value, timestampShiftMilliseconds)
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
  const templateExportedAt = new Date(sampleDataTemplate.exportedAt)
  const timestampShiftMilliseconds = now.getTime() - templateExportedAt.getTime()
  const dateShiftDays = Math.round((getUtcDayStart(now) - getUtcDayStart(templateExportedAt)) / dayInMilliseconds)

  return validateAppExportFile(
    shiftDatesRecursively(sampleDataTemplate, timestampShiftMilliseconds, dateShiftDays),
  )
}
import { ZodError } from 'zod'

import type { AppExportFile } from '../../types/state'
import { AppExportFileSchema } from '../../types/state'

const formatIssuePathSegment = (segment: PropertyKey) => (typeof segment === 'symbol' ? segment.toString() : String(segment))

const formatIssuePath = (path: readonly PropertyKey[]) =>
  path.length > 0 ? path.map(formatIssuePathSegment).join('.') : '<root>'

export const formatAppExportFileValidationError = (error: ZodError) =>
  error.issues.map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`).join('; ')

export const validateAppExportFile = (value: unknown): AppExportFile => {
  const result = AppExportFileSchema.safeParse(value)

  if (!result.success) {
    throw new Error(`Import file does not match the expected format. ${formatAppExportFileValidationError(result.error)}`)
  }

  return result.data
}

export const parseAppExportFileJson = (text: string): AppExportFile => {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Import file is not valid JSON.')
  }

  return validateAppExportFile(parsed)
}
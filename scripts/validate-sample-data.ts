import { readFileSync } from 'node:fs'

import { ZodError } from 'zod'

import { AppExportFileSchema } from '../src/types/state-schema'

const sampleDataPath = 'sample-data/sample-data.json'

const formatValidationError = (error: ZodError) =>
  error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '<root>'
      return `${path}: ${issue.message}`
    })
    .join('\n')

const main = () => {
  const raw = readFileSync(sampleDataPath, 'utf8')
  const parsed = JSON.parse(raw)
  const result = AppExportFileSchema.safeParse(parsed)

  if (!result.success) {
    console.error(`sample-data.json failed schema validation:\n${formatValidationError(result.error)}`)
    process.exit(1)
  }

  console.log('sample-data.json passed AppExportFileSchema validation')
}

main()
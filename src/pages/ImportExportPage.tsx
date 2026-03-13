import { ChangeEvent, useMemo, useState } from 'react'

import { useAppDataTransfer } from '../features/import-export/use-app-data-transfer'
import { useDashboardSummaryQuery } from '../queries/use-dashboard-summary-query'
import type { AppExportFile } from '../types/state'

const downloadJson = (payload: AppExportFile) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const timestamp = new Date().toISOString().replaceAll(':', '-')

  anchor.href = url
  anchor.download = `job-search-helper-${timestamp}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export const ImportExportPage = () => {
  const { exportAppData, importAppData } = useAppDataTransfer()
  const { data } = useDashboardSummaryQuery()
  const [error, setError] = useState<string | null>(null)
  const profileCount = data?.profileCount ?? 0
  const jobCount = data?.jobCount ?? 0

  const summary = useMemo(() => `${profileCount} profiles · ${jobCount} jobs`, [jobCount, profileCount])

  const handleExport = async () => {
    const file = await exportAppData()
    downloadJson(file)
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    try {
      const text = await selectedFile.text()
      const parsed = JSON.parse(text) as AppExportFile

      if (parsed.version !== 1 || typeof parsed.exportedAt !== 'string' || typeof parsed.data !== 'object') {
        throw new Error('Unsupported export file format.')
      }

      await importAppData(parsed)
      setError(null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown import error.'
      setError(message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Import / Export</h1>
        <p className="mt-2 text-sm text-app-text-subtle">Before you step away, export your progress; when you return, import it to restore your workspace.</p>
      </div>

      <section className="rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
        <p className="text-sm text-app-text-subtle">Current state</p>
        <p className="mt-2 text-lg font-semibold text-app-text">{summary}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" onClick={handleExport} type="button">
            Export JSON
          </button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted">
            Import JSON
            <input accept="application/json" className="hidden" onChange={handleImport} type="file" />
          </label>
        </div>

        <p className="mt-4 text-xs text-app-warning">Import replaces the current in-memory state. Merge behavior is intentionally not supported in the MVP.</p>
        {error ? <p className="mt-3 text-sm text-app-danger">Import failed: {error}</p> : null}
      </section>
    </div>
  )
}

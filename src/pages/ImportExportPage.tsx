import { ChangeEvent, useMemo, useState } from 'react'

import { createEmptyAppDataState } from '../domain/app-data-state'
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
  const { exportAppData, importAppData, isSaving } = useAppDataTransfer()
  const { data } = useDashboardSummaryQuery()
  const [error, setError] = useState<string | null>(null)
  const profileCount = data?.profileCount ?? 0
  const jobCount = data?.jobCount ?? 0

  const summary = useMemo(() => `${profileCount} profiles · ${jobCount} jobs`, [jobCount, profileCount])

  const handleExport = async () => {
    try {
      const file = await exportAppData()
      downloadJson(file)
      setError(null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown export error.'
      setError(message)
    }
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

  const handleClearData = async () => {
    const confirmed = window.confirm('Clear all saved data? This cannot be undone unless you have an exported backup.')

    if (!confirmed) {
      return
    }

    const emptyExport: AppExportFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: createEmptyAppDataState(),
    }

    try {
      await importAppData(emptyExport)
      setError(null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown clear-data error.'
      setError(message)
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
          <button
            className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={handleExport}
            type="button"
          >
            Export JSON
          </button>
          <label
            className={`inline-flex items-center justify-center rounded-xl border border-app-warning px-3 py-2 text-sm font-medium text-app-warning hover:bg-app-warning/10 ${
              isSaving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            Import JSON
            <input accept="application/json" className="hidden" disabled={isSaving} onChange={handleImport} type="file" />
          </label>
          <button
            className="rounded-xl border border-app-danger px-3 py-2 text-sm font-medium text-app-danger hover:bg-app-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={handleClearData}
            type="button"
          >
            Clear Local Data
          </button>
        </div>

        <p className="mt-4 text-xs text-app-warning">Import replaces the current local database.</p>
        <p className="mt-2 text-xs text-app-danger">Clear Local Data resets the app to an empty state. Export first if you want a backup.</p>
        {error ? <p className="mt-3 text-sm text-app-danger">Action failed: {error}</p> : null}
      </section>
    </div>
  )
}

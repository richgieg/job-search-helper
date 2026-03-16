import { ChangeEvent, useMemo, useState } from 'react'

import { parseAppExportFileJson } from '../features/import-export/app-export-file'
import { generateSampleAppExportFile } from '../features/import-export/generate-sample-app-export-file'
import { useBrowserStorageEstimate } from '../features/import-export/use-browser-storage-estimate'
import { useAppDataTransfer } from '../features/import-export/use-app-data-transfer'
import { useDashboardSummaryQuery } from '../queries/use-dashboard-summary-query'
import type { AppExportFile } from '../types/state'

const byteUnits = ['B', 'KB', 'MB', 'GB', 'TB'] as const

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return 'Unknown'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), byteUnits.length - 1)
  const value = bytes / 1024 ** unitIndex
  const formattedValue = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value >= 10 ? 0 : 1,
    minimumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)

  return `${formattedValue} ${byteUnits[unitIndex]}`
}

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
  const { exportAppData, importAppData, isSaving, resetLocalData } = useAppDataTransfer()
  const { available, isLoading: isLoadingStorageEstimate, quotaBytes, refresh: refreshStorageEstimate, usageBytes } =
    useBrowserStorageEstimate()
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

    const confirmed = window.confirm(
      'Replace current local data with the selected import file? This cannot be undone unless you have an exported backup.',
    )

    if (!confirmed) {
      event.target.value = ''
      return
    }

    try {
      const text = await selectedFile.text()
      const parsed = parseAppExportFileJson(text)

      await importAppData(parsed)
      await refreshStorageEstimate()
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

    try {
      await resetLocalData()
      await refreshStorageEstimate()
      setError(null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown clear-data error.'
      setError(message)
    }
  }

  const handleLoadSampleData = async () => {
    const confirmed = window.confirm(
      'Replace current local data with fresh sample data? This cannot be undone unless you have an exported backup.',
    )

    if (!confirmed) {
      return
    }

    try {
      await importAppData(generateSampleAppExportFile())
      await refreshStorageEstimate()
      setError(null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown sample-data error.'
      setError(message)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-app-heading">Import / Export</h1>
        <p className="mt-2 text-sm text-app-text-subtle">Export a JSON backup of your local data, or import one to replace what is currently saved in this browser.</p>
      </div>

      <section className="rounded-2xl border border-app-border-muted bg-app-surface p-6 shadow-sm">
        <p className="text-sm text-app-text-subtle">Current state</p>
        <p className="mt-2 text-lg font-semibold text-app-text">{summary}</p>
        {isLoadingStorageEstimate ? <p className="mt-3 text-sm text-app-text-subtle">Checking browser storage...</p> : null}
        {!isLoadingStorageEstimate && available && usageBytes !== null && quotaBytes !== null ? (
          <div className="mt-3 space-y-1 text-sm text-app-text-subtle">
            <p>{`Estimated browser storage: ${formatBytes(usageBytes)} used of ${formatBytes(quotaBytes)}`}</p>
          </div>
        ) : null}
        {!isLoadingStorageEstimate && !available ? <p className="mt-3 text-sm text-app-text-subtle">Browser storage details are not available.</p> : null}

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
            className={`inline-flex items-center justify-center rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted ${
              isSaving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            Import JSON
            <input accept="application/json" className="hidden" disabled={isSaving} onChange={handleImport} type="file" />
          </label>
          <button
            className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={handleLoadSampleData}
            type="button"
          >
            Load Fresh Sample Data
          </button>
          <button
            className="rounded-xl border border-app-danger px-3 py-2 text-sm font-medium text-app-danger hover:bg-app-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={handleClearData}
            type="button"
          >
            Clear Data
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-app-danger">Action failed: {error}</p> : null}
      </section>
    </div>
  )
}

import { ChangeEvent, useMemo, useState } from 'react'

import { useAppStore } from '../store/app-store'
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
  const exportAppData = useAppStore((state) => state.actions.exportAppData)
  const importAppData = useAppStore((state) => state.actions.importAppData)
  const [error, setError] = useState<string | null>(null)
  const profileCount = useAppStore((state) => Object.keys(state.data.profiles).length)
  const jobCount = useAppStore((state) => Object.keys(state.data.jobs).length)

  const summary = useMemo(() => `${profileCount} profiles · ${jobCount} jobs`, [jobCount, profileCount])

  const handleExport = () => {
    const file = exportAppData()
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

      importAppData(parsed)
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
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Import / Export</h1>
        <p className="mt-2 text-sm text-slate-600">Persist the browser-only app state by exporting JSON or overwriting current in-memory state with an import.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Current state</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{summary}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700" onClick={handleExport} type="button">
            Export JSON
          </button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Import JSON
            <input accept="application/json" className="hidden" onChange={handleImport} type="file" />
          </label>
        </div>

        <p className="mt-4 text-xs text-amber-700">Import replaces the current in-memory state. Merge behavior is intentionally not supported in the MVP.</p>
        {error ? <p className="mt-3 text-sm text-rose-600">Import failed: {error}</p> : null}
      </section>
    </div>
  )
}

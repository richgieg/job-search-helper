import { type ReactNode, useEffect, useState } from 'react'

interface CollapsiblePanelProps {
  title: string
  description?: string
  summary?: string
  children: ReactNode
  defaultExpanded?: boolean
  actionLabel?: string
  onAction?: () => void
  expandOnAction?: boolean
  isDirty?: boolean
  onDiscardChanges?: () => void
  headerActions?: ReactNode
  contentClassName?: string
}

export const CollapsiblePanel = ({
  title,
  description,
  summary,
  children,
  defaultExpanded = false,
  actionLabel,
  onAction,
  expandOnAction = true,
  isDirty = false,
  onDiscardChanges,
  headerActions,
  contentClassName,
}: CollapsiblePanelProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)

  useEffect(() => {
    if (!expanded || !isDirty) {
      setShowDiscardWarning(false)
    }
  }, [expanded, isDirty])

  const handleToggle = () => {
    if (expanded) {
      if (isDirty) {
        setShowDiscardWarning(true)
        return
      }

      setExpanded(false)
      return
    }

    setExpanded(true)
  }

  const handleAction = () => {
    if (expandOnAction) {
      setExpanded(true)
    }

    onAction?.()
  }

  const handleDiscardAndCollapse = () => {
    onDiscardChanges?.()
    setShowDiscardWarning(false)
    setExpanded(false)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button className="min-w-0 flex-1 text-left" onClick={handleToggle} type="button">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 text-sm text-slate-500">
              {expanded ? '▾' : '▸'}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
              {summary ? <p className="mt-1 text-xs text-slate-500">{summary}</p> : null}
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {headerActions}
          {actionLabel && onAction ? (
            <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700" onClick={handleAction} type="button">
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>

      {showDiscardWarning ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">This section has unsaved changes.</p>
          <p className="mt-1">Collapse anyway and discard those edits?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-xl border border-amber-300 px-3 py-2 font-medium text-amber-900 hover:bg-amber-100" onClick={() => setShowDiscardWarning(false)} type="button">
              Keep editing
            </button>
            <button className="rounded-xl bg-amber-600 px-3 py-2 font-medium text-white hover:bg-amber-700" onClick={handleDiscardAndCollapse} type="button">
              Discard and collapse
            </button>
          </div>
        </div>
      ) : null}

      {expanded ? <div className={['mt-4', contentClassName].filter(Boolean).join(' ')}>{children}</div> : null}
    </section>
  )
}

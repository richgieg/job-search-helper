import { Children, type ReactNode, useState } from 'react'

import { AddIconButton } from './CompactActionControls'

interface CollapsiblePanelProps {
  title: string
  description?: string
  summary?: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  actionLabel?: string
  onAction?: () => void
  expandOnAction?: boolean
  actionStyle?: 'text' | 'icon'
  headerActions?: ReactNode
  headerActionContent?: ReactNode
  contentClassName?: string
}

export const CollapsiblePanel = ({
  title,
  description,
  summary,
  children,
  collapsible = true,
  defaultExpanded = false,
  actionLabel,
  onAction,
  expandOnAction = true,
  actionStyle = 'text',
  headerActions,
  headerActionContent,
  contentClassName,
}: CollapsiblePanelProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const isExpanded = collapsible ? expanded : true
  const hasContent = Children.count(children) > 0

  const handleToggle = () => {
    if (!collapsible) {
      return
    }

    setExpanded((current) => !current)
  }

  const handleAction = () => {
    if (expandOnAction) {
      setExpanded(true)
    }

    onAction?.()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {collapsible ? (
          <button className="min-w-0 flex-1 text-left" onClick={handleToggle} type="button">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-sm text-slate-500">
                {isExpanded ? '▾' : '▸'}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
                {summary ? <p className="mt-1 text-xs text-slate-500">{summary}</p> : null}
              </div>
            </div>
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-sm text-slate-300">
                ▸
              </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                  {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
                  {summary ? <p className="mt-1 text-xs text-slate-500">{summary}</p> : null}
                </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {headerActions}
            {(!collapsible || isExpanded) && headerActionContent ? headerActionContent : null}
          {(!collapsible || isExpanded) && actionLabel && onAction ? (
            actionStyle === 'icon' ? (
              <AddIconButton label={actionLabel} onAdd={handleAction} />
            ) : (
              <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700" onClick={handleAction} type="button">
                {actionLabel}
              </button>
            )
          ) : null}
        </div>
      </div>

      {isExpanded && hasContent ? <div className={['mt-4', contentClassName].filter(Boolean).join(' ')}>{children}</div> : null}
    </section>
  )
}

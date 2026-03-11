import { Children, type ReactNode, useEffect, useRef, useState } from 'react'

import { AddIconButton } from './CompactActionControls'

const HEADER_ACTION_VISIBLE_RATIO_THRESHOLD = 0.5
const PANEL_FOOTER_MIN_HEIGHT_CLASS = 'min-h-12'

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
  headerActionContent?: ReactNode | ((input: { triggerAction: () => void }) => ReactNode)
  contentClassName?: string
  showBottomActionWhenHeaderHidden?: boolean
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
  showBottomActionWhenHeaderHidden = false,
}: CollapsiblePanelProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [isHeaderActionVisible, setIsHeaderActionVisible] = useState(true)
  const headerActionRef = useRef<HTMLDivElement | null>(null)
  const isExpanded = collapsible ? expanded : true
  const hasContent = Children.count(children) > 0
  const shouldRenderTopAction = (!collapsible || isExpanded) && Boolean(actionLabel && onAction)
  const shouldShowBottomAction = showBottomActionWhenHeaderHidden && shouldRenderTopAction && hasContent && !isHeaderActionVisible

  useEffect(() => {
    if (!showBottomActionWhenHeaderHidden || !shouldRenderTopAction || !headerActionRef.current) {
      setIsHeaderActionVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderActionVisible(entry?.isIntersecting === true && entry.intersectionRatio >= HEADER_ACTION_VISIBLE_RATIO_THRESHOLD)
      },
      { threshold: HEADER_ACTION_VISIBLE_RATIO_THRESHOLD },
    )

    observer.observe(headerActionRef.current)

    return () => observer.disconnect()
  }, [showBottomActionWhenHeaderHidden, shouldRenderTopAction])

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

  const resolvedHeaderActionContent = typeof headerActionContent === 'function'
    ? headerActionContent({ triggerAction: handleAction })
    : headerActionContent

  return (
    <section className="rounded-2xl border border-app-border-muted bg-app-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {collapsible ? (
          <button className="min-w-0 flex-1 text-left" onClick={handleToggle} type="button">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-sm text-app-text-subtle">
                {isExpanded ? '▾' : '▸'}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-app-text">{title}</h3>
                {description ? <p className="mt-1 text-sm text-app-text-subtle">{description}</p> : null}
                {summary ? <p className="mt-1 text-xs text-app-text-subtle">{summary}</p> : null}
              </div>
            </div>
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="invisible mt-0.5 text-sm">
                ▸
              </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-app-text">{title}</h3>
                  {description ? <p className="mt-1 text-sm text-app-text-subtle">{description}</p> : null}
                  {summary ? <p className="mt-1 text-xs text-app-text-subtle">{summary}</p> : null}
                </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {headerActions}
          {(!collapsible || isExpanded) && resolvedHeaderActionContent ? resolvedHeaderActionContent : null}
          {shouldRenderTopAction ? (
            <div ref={headerActionRef}>
              {actionStyle === 'icon' ? (
                <AddIconButton label={actionLabel!} onAdd={handleAction} />
              ) : (
                <button className="rounded-xl bg-app-primary px-4 py-2 text-sm font-medium text-app-primary-contrast hover:bg-app-primary-hover" onClick={handleAction} type="button">
                  {actionLabel}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {isExpanded && hasContent ? (
        <>
          <div className={['mt-4', contentClassName].filter(Boolean).join(' ')}>{children}</div>
          <div className={['mt-4 flex items-center justify-end', PANEL_FOOTER_MIN_HEIGHT_CLASS].join(' ')}>
            {shouldRenderTopAction ? (
              <button
                aria-hidden={!shouldShowBottomAction}
                className={[
                  'rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted transition-opacity hover:bg-app-surface-muted',
                  shouldShowBottomAction ? 'opacity-100' : 'pointer-events-none opacity-0',
                ].join(' ')}
                disabled={!shouldShowBottomAction}
                onClick={handleAction}
                tabIndex={shouldShowBottomAction ? 0 : -1}
                type="button"
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  )
}

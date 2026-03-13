import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

const AUTO_SCROLL_MARGIN_BOTTOM_PX = 96
const AUTO_SCROLL_MARGIN_TOP_PX = 24

const scheduleAfterLayout = (callback: () => void) => {
  if (typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(() => callback())
  }

  return window.setTimeout(callback, 0)
}

const cancelScheduledAfterLayout = (handle: number) => {
  if (typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(handle)
    return
  }

  window.clearTimeout(handle)
}

const scrollIntoViewIfNeeded = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const isFullyVisible = rect.top >= 0 && rect.bottom + AUTO_SCROLL_MARGIN_BOTTOM_PX <= window.innerHeight
  const availableHeight = window.innerHeight - AUTO_SCROLL_MARGIN_TOP_PX - AUTO_SCROLL_MARGIN_BOTTOM_PX
  const isOversized = rect.height > availableHeight

  if (isFullyVisible) {
    return
  }

  if (isOversized) {
    window.scrollTo({
      top: Math.max(0, window.scrollY + rect.top - AUTO_SCROLL_MARGIN_TOP_PX),
      behavior: 'smooth',
    })
    return
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

export const useScrollIntoViewOnMount = <T extends HTMLElement>({
  enabled,
  onComplete,
}: {
  enabled: boolean
  onComplete: (() => void) | undefined
}) => {
  const scrollTargetRef = useRef<T | null>(null)
  const scrollTargetStyle = useMemo<CSSProperties>(
    () => ({ scrollMarginBottom: `${AUTO_SCROLL_MARGIN_BOTTOM_PX}px` }),
    [],
  )

  useEffect(() => {
    if (!enabled || !scrollTargetRef.current) {
      return
    }

    const scheduledHandle = scheduleAfterLayout(() => {
      if (!scrollTargetRef.current) {
        return
      }

      scrollIntoViewIfNeeded(scrollTargetRef.current)
      onComplete?.()
    })

    return () => {
      cancelScheduledAfterLayout(scheduledHandle)
    }
  }, [enabled, onComplete])

  return {
    scrollTargetRef,
    scrollTargetStyle,
  }
}
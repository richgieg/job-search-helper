// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useScrollIntoViewOnMount } from './use-scroll-into-view-on-mount'

const createRect = ({ top, bottom, height }: { top: number; bottom: number; height: number }): DOMRect => ({
  top,
  bottom,
  height,
  left: 0,
  right: 0,
  width: 0,
  x: 0,
  y: top,
  toJSON: () => ({}),
} as DOMRect)

describe('useScrollIntoViewOnMount', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('scrolls the element into view when it is below the viewport', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    window.scrollTo = vi.fn()

    const onComplete = vi.fn()
    const { result, rerender } = renderHook(
      ({ enabled }) => useScrollIntoViewOnMount<HTMLDivElement>({ enabled, onComplete }),
      { initialProps: { enabled: false } },
    )

    const element = document.createElement('div')
    element.scrollIntoView = vi.fn()
    element.getBoundingClientRect = () => createRect({ top: 650, bottom: 780, height: 130 })
    result.current.scrollTargetRef.current = element

    rerender({ enabled: true })

    await waitFor(() => {
      expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' })
    })

    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledOnce()
    expect(result.current.scrollTargetStyle).toEqual({ scrollMarginBottom: '96px' })
  })

  it('scrolls the window when the target is taller than the available viewport space', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 50 })
    window.scrollTo = vi.fn()

    const onComplete = vi.fn()
    const { result, rerender } = renderHook(
      ({ enabled }) => useScrollIntoViewOnMount<HTMLDivElement>({ enabled, onComplete }),
      { initialProps: { enabled: false } },
    )

    const element = document.createElement('div')
    element.scrollIntoView = vi.fn()
    element.getBoundingClientRect = () => createRect({ top: 300, bottom: 1100, height: 800 })
    result.current.scrollTargetRef.current = element

    rerender({ enabled: true })

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 326, behavior: 'smooth' })
    })

    expect(element.scrollIntoView).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('does not scroll when the target is already fully visible', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    window.scrollTo = vi.fn()

    const onComplete = vi.fn()
    const { result, rerender } = renderHook(
      ({ enabled }) => useScrollIntoViewOnMount<HTMLDivElement>({ enabled, onComplete }),
      { initialProps: { enabled: false } },
    )

    const element = document.createElement('div')
    element.scrollIntoView = vi.fn()
    element.getBoundingClientRect = () => createRect({ top: 24, bottom: 680, height: 656 })
    result.current.scrollTargetRef.current = element

    rerender({ enabled: true })

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce()
    })

    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(element.scrollIntoView).not.toHaveBeenCalled()
  })
})
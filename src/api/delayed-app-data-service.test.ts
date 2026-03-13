import { describe, expect, it, vi } from 'vitest'

import { createEmptyAppDataState } from '../domain/app-data-state'
import { createDelayedAppDataService, getSimulatedDelayMs } from './delayed-app-data-service'
import { MockAppBackend } from './mock-app-backend'

describe('delayed app data service', () => {
  it('computes a delay within the configured range', () => {
    const delay = getSimulatedDelayMs({
      minDelayMs: 100,
      maxDelayMs: 300,
      random: () => 0.25,
    })

    expect(delay).toBe(150)
  })

  it('uses the minimum delay when the range is inverted', () => {
    const delay = getSimulatedDelayMs({
      minDelayMs: 250,
      maxDelayMs: 100,
      random: () => 0.75,
    })

    expect(delay).toBe(250)
  })

  it('delays backend calls before delegating to the wrapped service', async () => {
    const backend = new MockAppBackend({ initialData: createEmptyAppDataState() })
    const sleep = vi.fn(async (_ms: number) => {})
    const delayed = createDelayedAppDataService(backend, {
      minDelayMs: 120,
      maxDelayMs: 220,
      random: () => 0.5,
      sleep,
    })

    const result = await delayed.getAppData()

    expect(sleep).toHaveBeenCalledOnce()
    expect(sleep).toHaveBeenCalledWith(170)
    expect(result).toEqual(createEmptyAppDataState())
  })
})
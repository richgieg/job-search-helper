// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppApiClient, getAppApiClient, setAppApiClient } from '../api'
import { createEmptyAppDataState } from '../domain/app-data-state'
import { ImportExportPage } from './ImportExportPage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

const toExportPayload = (data: ReturnType<typeof createSeedData>) => {
  const { version: _version, exportedAt: _exportedAt, ...payload } = data
  return payload
}

describe('ImportExportPage', () => {
  beforeEach(() => {
    setupRouteTestEnvironment()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetRouteTestState()
  })

  it('shows browser storage usage when the browser exposes an estimate', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        estimate: vi.fn(async () => ({
          usage: 1024,
          quota: 10 * 1024,
          usageDetails: {
            indexedDB: 512,
          },
        })),
      },
    })

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('Estimated browser storage: 1.0 KB used of 10 KB')).toBeInTheDocument()
  })

  it('shows a fallback message when browser storage estimates are unavailable', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: undefined,
    })

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('Browser storage details are not available.')).toBeInTheDocument()
  })

  it('refreshes import page counts after importing json', async () => {
    const user = userEvent.setup()
    const estimate = vi
      .fn()
      .mockResolvedValueOnce({
        usage: 1024,
        quota: 10 * 1024,
        usageDetails: {
          indexedDB: 512,
        },
      })
      .mockResolvedValueOnce({
        usage: 2048,
        quota: 10 * 1024,
        usageDetails: {
          indexedDB: 1024,
        },
      })

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        estimate,
      },
    })

    setAppApiClient(createAppApiClient({ initialData: createEmptyAppDataState() }))

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('0 profiles · 0 jobs')).toBeInTheDocument()
    expect(await screen.findByText('Estimated browser storage: 1.0 KB used of 10 KB')).toBeInTheDocument()

    const imported = {
      version: 1 as const,
      exportedAt: '2026-03-12T12:00:00.000Z',
      data: toExportPayload(createSeedData()),
    }

    const file = new File([JSON.stringify(imported)], 'import.json', { type: 'application/json' })

    await user.upload(screen.getByLabelText('Import JSON'), file)

    expect(await screen.findByText('1 profiles · 1 jobs')).toBeInTheDocument()
    expect(await screen.findByText('Estimated browser storage: 2.0 KB used of 10 KB')).toBeInTheDocument()
  })

  it('deletes local data and keeps the app usable immediately afterward', async () => {
    const user = userEvent.setup()
    const estimate = vi
      .fn()
      .mockResolvedValueOnce({
        usage: 2048,
        quota: 10 * 1024,
        usageDetails: {
          indexedDB: 2048,
        },
      })
      .mockResolvedValueOnce({
        usage: 256,
        quota: 10 * 1024,
        usageDetails: {
          indexedDB: 256,
        },
      })

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        estimate,
      },
    })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('1 profiles · 1 jobs')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear Local Data' }))

    expect(confirmSpy).toHaveBeenCalledOnce()
    expect(await screen.findByText('0 profiles · 0 jobs')).toBeInTheDocument()
    expect(await screen.findByText('Estimated browser storage: 256 B used of 10 KB')).toBeInTheDocument()

    const clearedExport = await getAppApiClient().exportAppData()
    const createdProfile = await getAppApiClient().createBaseProfile('Fresh Profile')
    const createdProfileRecord = createdProfile.createdId ? createdProfile.data.profiles[createdProfile.createdId] : null

    expect(Object.keys(clearedExport.data.jobs)).toHaveLength(0)
    expect(Object.keys(clearedExport.data.profiles)).toHaveLength(0)
    expect(createdProfileRecord?.name).toBe('Fresh Profile')
  })

  it('shows an error when the selected file is not valid json', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('1 profiles · 1 jobs')).toBeInTheDocument()

    const file = new File(['{"version": 1'], 'broken.json', { type: 'application/json' })

    await user.upload(screen.getByLabelText('Import JSON'), file)

    expect(await screen.findByText('Action failed: Import file is not valid JSON.')).toBeInTheDocument()
    expect(screen.getByText('1 profiles · 1 jobs')).toBeInTheDocument()
  })

  it('shows an error when the selected file fails AppExportFileSchema validation', async () => {
    const user = userEvent.setup()

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('1 profiles · 1 jobs')).toBeInTheDocument()

    const invalidImport = {
      version: 1,
      exportedAt: '2026-03-12T12:00:00.000Z',
      data: {
        ...toExportPayload(createSeedData()),
        unexpected: true,
      },
    }

    const file = new File([JSON.stringify(invalidImport)], 'invalid.json', { type: 'application/json' })

    await user.upload(screen.getByLabelText('Import JSON'), file)

    expect(
      await screen.findByText('Action failed: Import file does not match the expected format. data: Unrecognized key: "unexpected"'),
    ).toBeInTheDocument()
    expect(screen.getByText('1 profiles · 1 jobs')).toBeInTheDocument()
  })
})
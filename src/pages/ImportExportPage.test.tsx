// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createAppApiClient, setAppApiClient } from '../api'
import { createEmptyAppDataState } from '../domain/app-data-state'
import { ImportExportPage } from './ImportExportPage'
import { createSeedData, renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('ImportExportPage', () => {
  beforeEach(() => {
    setupRouteTestEnvironment()
  })

  afterEach(() => {
    resetRouteTestState()
  })

  it('refreshes import page counts after importing json', async () => {
    const user = userEvent.setup()

    setAppApiClient(createAppApiClient({ initialData: createEmptyAppDataState() }))

    renderRoute({
      element: <ImportExportPage />,
      path: '/import-export',
      route: '/import-export',
    })

    expect(await screen.findByText('0 profiles · 0 jobs')).toBeInTheDocument()

    const imported = {
      version: 1 as const,
      exportedAt: '2026-03-12T12:00:00.000Z',
      data: createSeedData(),
    }

    const file = new File([JSON.stringify(imported)], 'import.json', { type: 'application/json' })

    await user.upload(screen.getByLabelText('Import JSON'), file)

    expect(await screen.findByText('1 profiles · 1 jobs')).toBeInTheDocument()
  })
})
// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { APP_NAME } from '../app/page-titles'
import { renderRoute, resetRouteTestState, setupRouteTestEnvironment } from '../test/route-test-helpers'
import { AboutPage } from './AboutPage'

describe('AboutPage', () => {
  afterEach(() => {
    resetRouteTestState()
  })

  it('describes the app, its motivation, and the author', async () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <AboutPage />,
      path: '/about',
      route: '/about',
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Why this app exists' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'A practical workspace for an active job search' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Part job-search tool, part AI-assisted build experiment' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Richard Gieg' })).toBeInTheDocument()
    expect(screen.getByText(/local-first web app for organizing job opportunities/i)).toBeInTheDocument()
    expect(screen.getByText(/gaining hands-on experience with AI agent coding/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Visit my website to see more of my background and projects.' })).toHaveAttribute(
      'href',
      'https://www.richgieg.com/',
    )
    expect(document.title).toBe(`About | ${APP_NAME}`)
  })
})
// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LandingPage } from './LandingPage'
import { renderRoute, setupRouteTestEnvironment } from '../test/route-test-helpers'

describe('LandingPage', () => {
  it('renders the redesigned marketing sections with only the sample-data CTA', () => {
    setupRouteTestEnvironment()

    renderRoute({
      element: <LandingPage />,
      path: '/',
      route: '/',
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Take control of your job search.' })).toBeInTheDocument()
    expect(screen.getByText('Turn scattered tabs and saved links into one reliable system.')).toBeInTheDocument()
    expect(screen.getByText('See the top of funnel, applications, interviews, and offers without inventing busywork.')).toBeInTheDocument()
    expect(screen.getByText('Build tailored application materials without losing track of which version belongs to which role.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open the dashboard' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Load Sample Data' })).toHaveAttribute('href', '/import-export')
    expect(screen.queryByRole('link', { name: 'Load fresh sample data' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Browse jobs' })).not.toBeInTheDocument()
  })
})
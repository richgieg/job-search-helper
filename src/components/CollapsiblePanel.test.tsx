// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CollapsiblePanel } from './CollapsiblePanel'

describe('CollapsiblePanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('expands when defaultExpanded becomes true after mount', () => {
    const { rerender } = render(
      <CollapsiblePanel defaultExpanded={false} title="Test panel">
        <div>Panel content</div>
      </CollapsiblePanel>,
    )

    expect(screen.queryByText('Panel content')).not.toBeInTheDocument()

    rerender(
      <CollapsiblePanel defaultExpanded title="Test panel">
        <div>Panel content</div>
      </CollapsiblePanel>,
    )

    expect(screen.getByText('Panel content')).toBeInTheDocument()
  })

  it('stays expanded when it becomes collapsible after rendering open content', () => {
    const { rerender } = render(
      <CollapsiblePanel collapsible={false} title="Test panel">
        <div>Panel content</div>
      </CollapsiblePanel>,
    )

    expect(screen.getByText('Panel content')).toBeInTheDocument()

    rerender(
      <CollapsiblePanel collapsible title="Test panel">
        <div>Panel content</div>
      </CollapsiblePanel>,
    )

    expect(screen.getByText('Panel content')).toBeInTheDocument()
  })
})
import { describe, expect, it } from 'vitest'

import { moveOrderedItem } from './reorder'

describe('moveOrderedItem', () => {
  it('wraps the first item to the end when moving up', () => {
    expect(moveOrderedItem(['a', 'b', 'c'], 0, -1)).toEqual(['b', 'c', 'a'])
  })

  it('wraps the last item to the beginning when moving down', () => {
    expect(moveOrderedItem(['a', 'b', 'c'], 2, 1)).toEqual(['c', 'a', 'b'])
  })

  it('still reorders normally for non-edge moves', () => {
    expect(moveOrderedItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveOrderedItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
  })

  it('returns the original ids when the list cannot be reordered', () => {
    const orderedIds = ['only-item']

    expect(moveOrderedItem(orderedIds, 0, -1)).toBe(orderedIds)
    expect(moveOrderedItem(['a', 'b'], -1, 1)).toEqual(['a', 'b'])
    expect(moveOrderedItem(['a', 'b'], 2, -1)).toEqual(['a', 'b'])
  })
})

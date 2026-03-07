export const moveOrderedItem = (orderedIds: string[], currentIndex: number, direction: -1 | 1) => {
  const nextIndex = currentIndex + direction

  if (currentIndex < 0 || nextIndex < 0 || currentIndex >= orderedIds.length || nextIndex >= orderedIds.length) {
    return orderedIds
  }

  const nextOrderedIds = [...orderedIds]
  const [movedId] = nextOrderedIds.splice(currentIndex, 1)

  if (!movedId) {
    return orderedIds
  }

  nextOrderedIds.splice(nextIndex, 0, movedId)

  return nextOrderedIds
}

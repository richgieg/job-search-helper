export const moveOrderedItem = (orderedIds: string[], currentIndex: number, direction: -1 | 1) => {
  const itemCount = orderedIds.length

  if (itemCount < 2 || currentIndex < 0 || currentIndex >= itemCount) {
    return orderedIds
  }

  const nextIndex = currentIndex + direction < 0 ? itemCount - 1 : (currentIndex + direction) % itemCount

  if (nextIndex === currentIndex) {
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

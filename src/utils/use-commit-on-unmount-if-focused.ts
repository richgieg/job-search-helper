import { useEffect, useRef } from 'react'

export const useCommitOnUnmountIfFocused = (onCommit?: () => void) => {
  const commitRef = useRef(onCommit)
  const hadFocusRef = useRef(false)

  useEffect(() => {
    commitRef.current = onCommit
  }, [onCommit])

  useEffect(() => {
    return () => {
      if (hadFocusRef.current) {
        commitRef.current?.()
      }
    }
  }, [])

  return {
    handleFocus: () => {
      hadFocusRef.current = true
    },
    handleBlur: () => {
      hadFocusRef.current = false
      commitRef.current?.()
    },
  }
}
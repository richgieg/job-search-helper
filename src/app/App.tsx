import { useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'

import { AppRoutes } from './router'
import { useAppStore } from '../store/app-store'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

const AppBootstrap = () => {
  const hydration = useAppStore((state) => state.status.hydration)
  const hydrate = useAppStore((state) => state.actions.hydrate)

  useEffect(() => {
    if (hydration === 'idle') {
      void hydrate()
    }
  }, [hydrate, hydration])

  return null
}

export const App = () => {
  return (
    <BrowserRouter>
      <AppBootstrap />
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  )
}

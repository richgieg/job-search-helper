import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { applyResolvedTheme, getSystemPrefersDark, readStoredThemePreference, resolveThemePreference } from './app/theme'
import './index.css'
import { queryClient } from './queries/query-client'

applyResolvedTheme(resolveThemePreference(readStoredThemePreference(), getSystemPrefersDark()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { applyResolvedTheme, getSystemPrefersDark, readStoredThemePreference, resolveThemePreference } from './app/theme'
import './index.css'

applyResolvedTheme(resolveThemePreference(readStoredThemePreference(), getSystemPrefersDark()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { useEffect, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { applyResolvedTheme, persistThemePreference, resolveThemePreference } from '../theme'
import { useAppStore } from '../../store/app-store'
import type { ThemePreference } from '../../types/state'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profiles', label: 'Profiles' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/import-export', label: 'Import / Export' },
]

const themePreferenceOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-app-primary text-app-primary-contrast' : 'text-app-text-subtle hover:bg-app-surface-subtle hover:text-app-text',
  ].join(' ')

export const AppShell = ({ children }: { children: ReactNode }) => {
  const themePreference = useAppStore((state) => state.ui.themePreference)
  const setThemePreference = useAppStore((state) => state.actions.setThemePreference)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (prefersDark: boolean) => {
      applyResolvedTheme(resolveThemePreference(themePreference, prefersDark))
    }

    applyTheme(mediaQuery.matches)
    persistThemePreference(themePreference)

    if (themePreference !== 'system') {
      return
    }

    const handleChange = (event: MediaQueryListEvent) => {
      applyTheme(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [themePreference])

  return (
    <div className="min-h-screen bg-app-canvas text-app-text">
      <header className="border-b border-app-border-muted bg-app-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="min-w-0">
            <p className="text-lg font-semibold uppercase tracking-[0.24em] text-app-primary sm:text-xl">Job Search Helper</p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <nav className="flex flex-wrap gap-2">
              {navigationItems.map((item) => (
                <NavLink key={item.to} className={navLinkClassName} to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <label className="flex items-center gap-2 self-start text-sm text-app-text-muted lg:self-end">
              <span className="font-medium text-app-text-subtle">Theme</span>
              <select
                className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-focus-ring"
                value={themePreference}
                onChange={(event) => setThemePreference(event.target.value as ThemePreference)}
              >
                {themePreferenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-7xl p-6 lg:p-10">
        {children}
      </main>
    </div>
  )
}

export const AppLayout = () => <AppShell><Outlet /></AppShell>

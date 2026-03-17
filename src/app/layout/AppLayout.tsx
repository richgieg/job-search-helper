import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { APP_NAME } from '../page-titles'
import { applyResolvedTheme, persistThemePreference, resolveThemePreference } from '../theme'
import { useSetThemePreference, useThemePreference } from '../../store/app-ui-store'
import type { ThemePreference } from '../../types/ui-state'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profiles', label: 'Profiles' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/import-export', label: 'Import / Export' },
  { to: '/about', label: 'About' },
]

const themePreferenceLabel: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

const getNextThemePreference = (themePreference: ThemePreference): ThemePreference => {
  switch (themePreference) {
    case 'light':
      return 'dark'
    case 'dark':
      return 'system'
    case 'system':
      return 'light'
    default:
      return 'light'
  }
}

const ThemeIcon = ({ themePreference }: { themePreference: ThemePreference }) => {
  switch (themePreference) {
    case 'light':
      return (
        <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )
    case 'dark':
      return (
        <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .13-.01.26-.01.39A7 7 0 0 0 20.61 12c.13 0 .26 0 .39-.01Z" />
        </svg>
      )
    case 'system':
      return (
        <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <rect height="14" rx="2" width="20" x="2" y="3" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      )
    default:
      return null
  }
}

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-app-primary text-app-primary-contrast' : 'text-app-text-subtle hover:bg-app-surface-subtle hover:text-app-text',
  ].join(' ')

export const AppShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const themePreference = useThemePreference()
  const setThemePreference = useSetThemePreference()
  const nextThemePreference = getNextThemePreference(themePreference)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      applyResolvedTheme(resolveThemePreference(themePreference, false))
      persistThemePreference(themePreference)
      return
    }

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

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileMenuOpen])

  return (
    <div className="min-h-screen bg-app-canvas text-app-text">
      <header className="border-b border-app-border-muted bg-app-surface">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Link className="text-lg font-semibold uppercase tracking-[0.24em] text-app-primary no-underline sm:text-xl" to="/">
                {APP_NAME}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <nav aria-label="Primary navigation" className="hidden flex-wrap gap-2 lg:flex">
                {navigationItems.map((item) => (
                  <NavLink key={item.to} className={navLinkClassName} to={item.to}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <button
                aria-controls="mobile-navigation"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-text-subtle transition hover:bg-app-surface-subtle hover:text-app-text focus-visible:ring-2 focus-visible:ring-app-focus-ring focus-visible:ring-offset-2 lg:hidden"
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
              >
                <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <>
                      <path d="M6 6l12 12" />
                      <path d="M18 6 6 18" />
                    </>
                  ) : (
                    <>
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </>
                  )}
                </svg>
              </button>

              <button
                aria-label={`Theme: ${themePreferenceLabel[themePreference]}. Switch to ${themePreferenceLabel[nextThemePreference]}.`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-text-subtle transition hover:bg-app-surface-subtle hover:text-app-text focus-visible:ring-2 focus-visible:ring-app-focus-ring focus-visible:ring-offset-2"
                title={`Theme: ${themePreferenceLabel[themePreference]}`}
                type="button"
                onClick={() => setThemePreference(nextThemePreference)}
              >
                <ThemeIcon themePreference={themePreference} />
              </button>
            </div>
          </div>

          {isMobileMenuOpen ? (
            <nav
              aria-label="Mobile navigation"
              className="mt-4 grid gap-2 rounded-2xl border border-app-border-muted bg-app-surface-subtle p-3 lg:hidden"
              id="mobile-navigation"
            >
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={navLinkClassName}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-7xl px-6 pt-6 pb-14 lg:px-10 lg:pt-10 lg:pb-18">
        {children}
      </main>
    </div>
  )
}

export const AppLayout = () => <AppShell><Outlet /></AppShell>

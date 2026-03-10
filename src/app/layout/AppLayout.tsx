import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profiles', label: 'Profiles' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/import-export', label: 'Import / Export' },
]

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-app-primary text-app-primary-contrast' : 'text-app-text-subtle hover:bg-app-surface-subtle hover:text-app-text',
  ].join(' ')

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-app-canvas text-app-text">
      <header className="border-b border-app-border-muted bg-app-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="min-w-0">
            <p className="text-lg font-semibold uppercase tracking-[0.24em] text-app-primary sm:text-xl">Job Search Helper</p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <NavLink key={item.to} className={navLinkClassName} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-7xl p-6 lg:p-10">
        {children}
      </main>
    </div>
  )
}

export const AppLayout = () => <AppShell><Outlet /></AppShell>

import { NavLink, Outlet } from 'react-router-dom'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profiles', label: 'Profiles' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/import-export', label: 'Import / Export' },
]

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-xl px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Job Search Helper</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Browser MVP</h1>
            <p className="mt-3 text-sm text-slate-600">
              React + Vite + TypeScript scaffold aligned to the planning documents.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 px-6 pb-6 lg:flex-col">
            {navigationItems.map((item) => (
              <NavLink key={item.to} className={navLinkClassName} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

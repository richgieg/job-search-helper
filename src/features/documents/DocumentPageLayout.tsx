import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface DocumentPageLayoutProps {
  title: string
  subtitle: string
  profileId: string
  activeDocument: 'resume' | 'application' | 'cover-letter'
  children: ReactNode
}

const documentLinks = [
  { key: 'cover-letter', label: 'Cover letter', to: (profileId: string) => `/previews/cover-letter/${profileId}` },
  { key: 'resume', label: 'Resume', to: (profileId: string) => `/previews/resume/${profileId}` },
  { key: 'application', label: 'Application', to: (profileId: string) => `/previews/application/${profileId}` },
] as const

export const DocumentPageLayout = ({ title, subtitle, profileId, activeDocument, children }: DocumentPageLayoutProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Generated preview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/profiles">
            Back to profiles
          </Link>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" onClick={() => window.print()} type="button">
            Print
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {documentLinks.map((item) => {
          const isActive = item.key === activeDocument
          return (
            <Link
              key={item.key}
              className={[
                'rounded-full px-4 py-2 text-sm font-medium transition',
                isActive ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
              ].join(' ')}
              to={item.to(profileId)}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}

export const PreviewNotFound = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-semibold text-slate-950">Preview unavailable</h1>
    <p className="mt-3 text-sm text-slate-600">{message}</p>
    <Link className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/profiles">
      Return to profiles
    </Link>
  </div>
)

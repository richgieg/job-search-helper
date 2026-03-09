import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface DocumentPageLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  eyebrow?: string
}

export const DocumentPageLayout = ({ title, subtitle, children, eyebrow = 'Generated preview' }: DocumentPageLayoutProps) => {
  return (
    <div className="space-y-8">
      <div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
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

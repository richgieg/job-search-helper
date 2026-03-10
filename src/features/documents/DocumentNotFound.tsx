import { Link } from 'react-router-dom'

export const DocumentNotFound = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-app-border-muted bg-app-surface p-8 shadow-sm">
    <h1 className="text-2xl font-semibold text-app-heading">Document unavailable</h1>
    <p className="mt-3 text-sm text-app-text-subtle">{message}</p>
    <Link className="mt-5 inline-flex rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to="/profiles">
      Return to profiles
    </Link>
  </div>
)

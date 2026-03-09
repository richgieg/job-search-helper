import { Link } from 'react-router-dom'

export const DocumentNotFound = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-semibold text-slate-950">Document unavailable</h1>
    <p className="mt-3 text-sm text-slate-600">{message}</p>
    <Link className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/profiles">
      Return to profiles
    </Link>
  </div>
)

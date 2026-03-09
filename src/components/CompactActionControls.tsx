type ActionButtonTone = 'neutral' | 'danger'

export const getActionIconButtonClassName = (tone: ActionButtonTone = 'neutral', disabled = false) =>
  [
    'inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    tone === 'danger'
      ? disabled
        ? 'cursor-not-allowed border-rose-200 bg-rose-50 text-rose-300 focus-visible:outline-rose-500'
        : 'border-rose-300 text-rose-700 hover:bg-rose-50 focus-visible:outline-rose-500'
      : disabled
        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 focus-visible:outline-sky-500'
        : 'border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-sky-500',
  ].join(' ')

interface ActionToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

export const ActionToggle = ({ checked, onChange, label, disabled = false }: ActionToggleProps) => (
  <label className={['relative inline-flex', disabled ? 'cursor-not-allowed' : 'cursor-pointer'].join(' ')}>
    <span className="sr-only">{label}</span>
    <input
      checked={checked}
      className="peer sr-only"
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
    <span
      aria-hidden="true"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-400 transition hover:bg-slate-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-500 peer-checked:border-sky-500 peer-checked:bg-sky-50 peer-checked:text-sky-700 peer-disabled:cursor-not-allowed peer-disabled:border-slate-200 peer-disabled:bg-slate-100 peer-disabled:text-slate-300"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
        <path d="M5 12.5 9.5 17 19 7" />
      </svg>
    </span>
  </label>
)

interface DeleteIconButtonProps {
  onDelete: () => void
  label: string
}

interface IconActionButtonProps {
  onClick: () => void
  label: string
  children: React.ReactNode
  tone?: ActionButtonTone
  disabled?: boolean
}

export const IconActionButton = ({ onClick, label, children, tone = 'neutral', disabled = false }: IconActionButtonProps) => (
  <button aria-label={label} className={getActionIconButtonClassName(tone, disabled)} disabled={disabled} onClick={onClick} type="button">
    {children}
  </button>
)

export const DeleteIconButton = ({ onDelete, label }: DeleteIconButtonProps) => (
  <IconActionButton label={label} onClick={onDelete} tone="danger">
    <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  </IconActionButton>
)

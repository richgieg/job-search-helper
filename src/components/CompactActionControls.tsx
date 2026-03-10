type ActionButtonTone = 'neutral' | 'danger' | 'primary'

export const getActionIconButtonClassName = (tone: ActionButtonTone = 'neutral', disabled = false) =>
  [
    'inline-flex h-10 w-10 items-center justify-center rounded-xl border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    tone === 'danger'
      ? disabled
        ? 'cursor-not-allowed border-app-danger-muted bg-app-danger-soft text-app-danger-contrast focus-visible:outline-app-danger'
        : 'border-app-danger-muted text-app-danger hover:bg-app-danger-soft focus-visible:outline-app-danger'
      : tone === 'primary'
        ? disabled
          ? 'cursor-not-allowed border-app-primary-muted bg-app-primary-muted text-app-primary-contrast focus-visible:outline-app-focus-ring'
          : 'border-app-primary bg-app-primary text-app-primary-contrast hover:bg-app-primary-hover hover:border-app-primary-hover focus-visible:outline-app-focus-ring'
        : disabled
          ? 'cursor-not-allowed border-app-border-muted bg-app-surface-subtle text-app-text-disabled focus-visible:outline-app-focus-ring'
          : 'border-app-border bg-app-surface text-app-text-muted hover:bg-app-surface-muted focus-visible:outline-app-focus-ring',
  ].join(' ')

interface ActionToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  showLabel?: boolean
}

export const ActionToggle = ({ checked, onChange, label, disabled = false, showLabel = false }: ActionToggleProps) => (
  <label className={['inline-flex items-center gap-3', disabled ? 'cursor-not-allowed' : 'cursor-pointer'].join(' ')}>
    <span className={showLabel ? 'text-sm font-medium text-app-text-muted' : 'sr-only'}>{label}</span>
    <input
      checked={checked}
      className="peer sr-only"
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      role="switch"
      type="checkbox"
    />
    <span
      aria-hidden="true"
      className="inline-flex h-7 w-12 shrink-0 items-center justify-start rounded-full border border-app-border bg-app-control-muted p-0.5 transition peer-focus-visible:ring-2 peer-focus-visible:ring-app-focus-ring peer-focus-visible:ring-offset-2 peer-checked:justify-end peer-checked:border-app-primary peer-checked:bg-app-primary peer-disabled:cursor-not-allowed peer-disabled:border-app-border-muted peer-disabled:bg-app-control-disabled"
    >
      <span className="inline-flex h-5.5 w-5.5 rounded-full bg-app-surface shadow-sm transition peer-disabled:bg-app-surface-muted" />
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

interface AddIconButtonProps {
  onAdd: () => void
  label: string
  disabled?: boolean
}

export const AddIconButton = ({ onAdd, label, disabled = false }: AddIconButtonProps) => (
  <IconActionButton disabled={disabled} label={label} onClick={onAdd} tone="primary">
    <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  </IconActionButton>
)

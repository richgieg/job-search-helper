interface ReorderButtonsProps {
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

const buttonClassName = (disabled: boolean) =>
  [
    'inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
    disabled
      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
      : 'border-slate-300 text-slate-700 hover:bg-slate-50',
  ].join(' ')

export const ReorderButtons = ({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }: ReorderButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        aria-label="Move up"
        className={buttonClassName(!canMoveUp)}
        disabled={!canMoveUp}
        onClick={onMoveUp}
        type="button"
      >
        <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
          <path d="m6 14 6-6 6 6" />
        </svg>
      </button>
      <button
        aria-label="Move down"
        className={buttonClassName(!canMoveDown)}
        disabled={!canMoveDown}
        onClick={onMoveDown}
        type="button"
      >
        <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
          <path d="m6 10 6 6 6-6" />
        </svg>
      </button>
    </div>
  )
}

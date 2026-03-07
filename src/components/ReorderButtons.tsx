interface ReorderButtonsProps {
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

const buttonClassName = (disabled: boolean) =>
  [
    'inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition',
    disabled
      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
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
        ↑
      </button>
      <button
        aria-label="Move down"
        className={buttonClassName(!canMoveDown)}
        disabled={!canMoveDown}
        onClick={onMoveDown}
        type="button"
      >
        ↓
      </button>
    </div>
  )
}

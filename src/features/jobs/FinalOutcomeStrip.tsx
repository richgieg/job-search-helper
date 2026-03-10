import type { FinalOutcomeStatus } from '../../types/state'

export type FinalOutcomeDraftStatus = '' | FinalOutcomeStatus

const finalOutcomeOptions: Array<{ value: FinalOutcomeDraftStatus; label: string }> = [
  { value: '', label: 'None' },
  { value: 'withdrew', label: 'Withdrew' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'offer_received', label: 'Offer received' },
  { value: 'offer_accepted', label: 'Offer accepted' },
]

export const FinalOutcomeStrip = ({
  name,
  value,
  disabled = false,
  onChange,
}: {
  name: string
  value: FinalOutcomeDraftStatus
  disabled?: boolean
  onChange: (value: FinalOutcomeDraftStatus) => void
}) => (
  <fieldset>
    <div className="mx-auto flex w-full max-w-4xl justify-center">
      <div className="flex w-full items-stretch justify-center gap-0">
        {finalOutcomeOptions.map((option, index) => {
          const checked = option.value === value
          const isFirst = index === 0
          const isLast = index === finalOutcomeOptions.length - 1

          return (
            <label
              key={option.value}
              className={[
                'relative flex min-w-0 flex-1',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                !isFirst ? '-ml-px' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                checked={checked}
                className="peer sr-only"
                disabled={disabled}
                name={name}
                type="radio"
                value={option.value}
                onChange={() => onChange(option.value)}
              />
              <span
                className={[
                  'flex w-full items-center justify-center border border-slate-300 px-3 py-2 text-center text-xs font-medium transition sm:text-sm',
                  'peer-focus-visible:z-10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-500',
                  isFirst ? 'rounded-l-xl' : '',
                  isLast ? 'rounded-r-xl' : '',
                  disabled
                    ? checked
                      ? 'border-slate-300 bg-slate-200 text-slate-500'
                      : 'bg-slate-50 text-slate-400'
                    : checked
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  </fieldset>
)

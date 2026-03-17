import type { FinalOutcomeStatus } from '../../types/state'
import { getFinalOutcomeSelectedClassName } from '../../features/jobs/job-status'

export type FinalOutcomeDraftStatus = '' | FinalOutcomeStatus

const finalOutcomeOptions: Array<{ value: FinalOutcomeDraftStatus; label: string }> = [
  { value: '', label: 'No outcome' },
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
          const selectedClassName = option.value ? getFinalOutcomeSelectedClassName(option.value) : 'border-app-border bg-app-surface-subtle text-app-text-muted'

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
                  'flex w-full items-center justify-center border border-app-border px-2 py-1.5 text-center text-[11px] leading-tight font-medium transition max-[430px]:px-1.5 max-[430px]:py-1 max-[430px]:text-[10px] sm:px-3 sm:py-2 sm:text-sm',
                  'peer-focus-visible:z-10 peer-focus-visible:ring-2 peer-focus-visible:ring-app-focus-ring peer-focus-visible:ring-offset-2',
                  isFirst ? 'rounded-l-xl' : '',
                  isLast ? 'rounded-r-xl' : '',
                  disabled
                    ? checked
                      ? 'border-app-border bg-app-surface-subtle text-app-text-subtle'
                      : 'bg-app-surface-muted text-app-text-disabled'
                    : checked
                      ? selectedClassName
                      : 'bg-app-surface text-app-text-muted hover:bg-app-surface-muted',
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

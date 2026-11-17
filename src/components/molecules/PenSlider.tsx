import { useId, type ReactNode } from 'react'

type PenSliderProps = {
  label: ReactNode
  ariaLabel: string
  valueText: ReactNode
  min: number
  max: number
  step: number
  value: number
  disabled: boolean
  onChange: (value: number) => void
}

export function PenSlider({ label, ariaLabel, valueText, min, max, step, value, disabled, onChange }: PenSliderProps) {
  const id = useId()

  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[15px] text-muted">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-w-0 flex-[1_1_220px] cursor-pointer accent-ink disabled:cursor-default disabled:opacity-60"
      />
      <output htmlFor={id} className="min-w-21 font-math text-[19px] text-ink">
        {valueText}
      </output>
    </div>
  )
}

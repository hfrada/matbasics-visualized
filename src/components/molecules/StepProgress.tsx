import type { ReactNode } from 'react'

type StepProgressProps = {
  total: number
  current: number
  caption?: ReactNode
  inline?: boolean
  compact?: boolean
}

const gap = 22

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <svg width={total * gap} height="20" viewBox={`0 0 ${total * gap} 20`} aria-hidden="true">
      {Array.from({ length: total }, (_, index) => {
        const cx = gap / 2 + index * gap
        return (
          <g key={index}>
            {index < current && <circle cx={cx} cy="10" r="3.5" className="fill-ink opacity-55" />}
            {index === current && <circle cx={cx} cy="10" r="4.5" className="fill-marker" />}
            <circle cx={cx} cy="10" r="6.5" strokeWidth="1.6" className="fill-none stroke-ink" />
          </g>
        )
      })}
    </svg>
  )
}

export function StepProgress({ total, current, caption, inline = false, compact = false }: StepProgressProps) {
  const count = (
    <span className="font-hand text-base text-muted">
      {current + 1}/{total}
    </span>
  )

  return (
    <div className={inline ? 'flex items-center gap-2' : 'pl-1'}>
      {!compact && <StepDots total={total} current={current} />}
      {inline ? (
        <span aria-live="polite">{count}</span>
      ) : (
        <p aria-live="polite" className={`font-hand text-2xl leading-snug ${compact ? '' : 'mt-2.5'}`}>
          <span className="mr-2">{count}</span>
          {caption}
        </p>
      )}
    </div>
  )
}

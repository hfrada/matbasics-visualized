import type { ReactNode } from 'react'

type StepProgressProps = {
  total: number
  current: number | null
  caption?: ReactNode
  idleText: string
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className="relative size-3.25 rounded-full border-[1.6px] border-ink">
          {index < current && <span className="absolute inset-0.5 rounded-full bg-ink opacity-55" />}
          {index === current && <span className="absolute inset-px rounded-full bg-marker" />}
        </span>
      ))}
    </div>
  )
}

export function StepProgress({ total, current, caption, idleText }: StepProgressProps) {
  return (
    <div aria-live="polite" className="pen-border relative flex min-h-16 items-center gap-3.5 bg-paper px-4 py-2.5">
      {current === null ? (
        <p className="text-[15px] text-muted">{idleText}</p>
      ) : (
        <>
          <span className="font-hand text-[30px] leading-none font-bold whitespace-nowrap">
            {current + 1}
            <span className="text-[22px] font-medium text-muted">/{total}</span>
          </span>
          <div className="grid min-w-0 gap-1">
            <StepDots total={total} current={current} />
            {caption && <p className="text-[17px] leading-normal [&_.katex]:text-[1.35em]!">{caption}</p>}
          </div>
        </>
      )}
    </div>
  )
}

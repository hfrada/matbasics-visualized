import type { KeyboardEvent, ReactNode } from 'react'

type FigureSideProps = {
  side: number
  label: string
  title: string
  expression: string
  textX: number
  textY: number
  anchor?: 'start' | 'middle' | 'end'
  hit: { x: number; y: number; width: number; height: number }
  selected: boolean
  faded: boolean
  interactive: boolean
  onPick: () => void
  children: ReactNode
}

export function FigureSide({
  side,
  label,
  title,
  expression,
  textX,
  textY,
  anchor = 'start',
  hit,
  selected,
  faded,
  interactive,
  onPick,
  children,
}: FigureSideProps) {
  function handleKeyDown(event: KeyboardEvent) {
    if (!interactive || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onPick()
  }

  return (
    <g
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-label={label}
      aria-pressed={selected}
      data-side={side}
      data-faded={faded || undefined}
      onClick={() => interactive && onPick()}
      onKeyDown={handleKeyDown}
      className={`group outline-none transition-opacity duration-300 motion-reduce:transition-none ${faded ? 'opacity-30' : ''} ${interactive ? 'cursor-pointer' : ''}`}
    >
      <rect {...hit} className="fill-transparent group-focus-visible:fill-highlight-soft" />
      <text x={textX} y={textY} textAnchor={anchor} className="fill-muted font-hand text-[21px] font-medium">
        {title}
      </text>
      <text x={textX} y={textY + 25} textAnchor={anchor} className="fill-ink font-math text-[19px]">
        {expression}
      </text>
      {children}
    </g>
  )
}

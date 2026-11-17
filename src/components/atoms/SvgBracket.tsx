import type { ReactNode } from 'react'

type SvgBracketProps = {
  from: number
  to: number
  y: number
  label: ReactNode
  tone: 'ink' | 'marker'
  labelBounds: [number, number]
}

export function SvgBracket({ from, to, y, label, tone, labelBounds }: SvgBracketProps) {
  const left = Math.min(from, to)
  const right = Math.max(from, to)
  const middle = Math.min(Math.max((left + right) / 2, labelBounds[0]), labelBounds[1])
  return (
    <>
      {right - left >= 1 && (
        <path
          d={`M${left} ${y - 7} V${y} H${right} V${y - 7}`}
          strokeWidth={1.6}
          className={`fill-none ${tone === 'ink' ? 'stroke-ink' : 'stroke-marker'}`}
        />
      )}
      <text x={middle} y={y + 19} textAnchor="middle" className={`font-math text-base ${tone === 'ink' ? 'fill-ink' : 'fill-marker'}`}>
        {label}
      </text>
    </>
  )
}

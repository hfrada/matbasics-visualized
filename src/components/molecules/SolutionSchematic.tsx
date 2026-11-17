import { solutionIntervals, type SolutionSet } from '../../lib/inequality'

type SolutionSchematicProps = {
  set: SolutionSet
  labels: string[] | null
  width: number
}

const axisY = 12
const inset = 8

export function SolutionSchematic({ set, labels, width }: SolutionSchematicProps) {
  const left = inset
  const right = width - inset
  const height = labels ? 42 : 24
  const bands: [number, number][] = []
  const marks: { x: number; closed: boolean }[] = []

  if (set.kind === 'points') {
    set.values.forEach((_, index) => marks.push({ x: (width * (index + 1)) / (set.values.length + 1), closed: true }))
  }
  for (const part of solutionIntervals(set)) {
    const bounded = part.low !== null && part.high !== null
    const split = set.kind === 'union'
    const start = part.low ? (bounded ? width * 0.32 : split ? width * 0.68 : width / 2) : left
    const end = part.high ? (bounded ? width * 0.68 : split ? width * 0.32 : width / 2) : right
    bands.push([start, end])
    if (part.low) marks.push({ x: start, closed: part.low.closed })
    if (part.high) marks.push({ x: end, closed: part.high.closed })
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="block overflow-visible">
      {bands.map(([start, end]) => (
        <rect key={start} x={start} y={axisY - 5} width={end - start} height={10} className="fill-highlight" />
      ))}
      <line x1={left} x2={right} y1={axisY} y2={axisY} strokeWidth={1.6} className="stroke-ink" />
      <path d={`M${right + 4} ${axisY} l-7 -4 v8 z`} className="fill-ink" />
      <path d={`M${left - 4} ${axisY} l7 -4 v8 z`} className="fill-ink" />
      {bands.map(([start, end]) => (
        <line key={start} x1={start} x2={end} y1={axisY} y2={axisY} strokeWidth={3} className="stroke-ink" />
      ))}
      {marks.map((mark, index) => (
        <g key={index}>
          <circle
            cx={mark.x}
            cy={axisY}
            r={4.5}
            strokeWidth={mark.closed ? 0 : 2}
            className={mark.closed ? 'fill-ink' : 'fill-paper stroke-ink'}
          />
          {labels && (
            <text x={mark.x} y={axisY + 24} textAnchor="middle" className="fill-muted font-math text-[14px]">
              {labels[index]}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

import { numberLabel } from '../../lib/numberLabel'
import { isMultipleOf, lineTicks } from '../../lib/numberLineLayout'

type SvgNumberLineProps = {
  y: number
  lo: number
  hi: number
  px: (value: number) => number
  tickSide: 'above' | 'below'
  hiddenLabels: number[]
  labelStep?: number
  unit?: number
  halfTicks?: boolean
  litLabels?: number[]
  markedLabels?: number[]
  faint?: boolean
  infinity?: boolean
}

export function SvgNumberLine({
  y,
  lo,
  hi,
  px,
  tickSide,
  hiddenLabels,
  labelStep = 5,
  unit = 1,
  halfTicks = false,
  litLabels = [],
  markedLabels = [],
  faint = false,
  infinity = false,
}: SvgNumberLineProps) {
  const left = px(lo)
  const right = px(hi)
  const ticks = lineTicks(lo, hi, unit)
  const halves = halfTicks ? ticks.slice(0, -1).map((tick) => tick + unit / 2) : []
  const labelled = ticks.filter((tick) => isMultipleOf(tick, labelStep) && !hiddenLabels.some((hidden) => Math.abs(hidden - tick) < 1e-9))
  const extra = [...litLabels, ...markedLabels].filter((value, index, all) => !labelled.includes(value) && all.indexOf(value) === index)
  const labels = [...labelled, ...extra]
  const labelY = tickSide === 'above' ? y - 12 : y + 22

  return (
    <g data-axis={faint ? 'faint' : 'on'} className={`transition-opacity duration-300 ${faint ? 'opacity-30' : ''}`}>
      <line x1={left - 14} x2={right + 14} y1={y} y2={y} strokeWidth={1.6} className="stroke-ink" />
      <path d={`M${right + 18} ${y} l-10 -5 v10 z`} className="fill-ink" />
      <path d={`M${left - 18} ${y} l10 -5 v10 z`} className="fill-ink" />
      {ticks.map((tick) => (
        <line key={tick} x1={px(tick)} x2={px(tick)} y1={y - 5} y2={y + 5} strokeWidth={1.3} className="stroke-ink" />
      ))}
      {halves.map((tick) => (
        <line key={tick} x1={px(tick)} x2={px(tick)} y1={y - 3} y2={y + 3} strokeWidth={1} className="stroke-ink opacity-60" />
      ))}
      {labels.map((value) => {
        const lit = litLabels.includes(value)
        const marked = !lit && markedLabels.includes(value)
        const highlightWidth = Math.max(26, numberLabel(value).length * 8 + 8)
        const tone = lit ? 'fill-ink font-bold dark:fill-paper' : marked ? 'fill-marker font-bold' : 'fill-muted'
        return (
          <g key={value} data-label={value} data-lit={lit || undefined} data-marked={marked || undefined}>
            {lit && (
              <rect x={px(value) - highlightWidth / 2} y={labelY - 16} width={highlightWidth} height={22} rx={3} className="fill-highlight" />
            )}
            <text x={px(value)} y={labelY} textAnchor="middle" className={`font-math text-[14px] ${tone}`}>
              {numberLabel(value)}
            </text>
          </g>
        )
      })}
      {infinity && (
        <>
          <text x={left - 24} y={y + 6} textAnchor="end" className="fill-muted font-math text-[17px]">
            −∞
          </text>
          <text x={right + 24} y={y + 6} className="fill-muted font-math text-[17px]">
            ∞
          </text>
        </>
      )}
    </g>
  )
}

import { useId } from 'react'
import { SvgResult } from '../atoms/SvgResult'
import { FigureSide } from '../molecules/FigureSide'
import { numberLabel } from '../../lib/numberLabel'

export type PlaneSide = {
  title: string
  expression: string
  label: string
  width: number
  height: number
  shown: boolean
  now: boolean
  result: string | null
  selected: boolean
  faded: boolean
}

type SignedAreaPlaneBoardProps = {
  sides: PlaneSide[]
  mirrorOn: boolean
  mirrorLabel: string
  resultLit: boolean
  interactive: boolean
  ariaLabel: string
  onPick: (side: number) => void
}

const width = 640
const unit = 28
const gridTop = 30

export function SignedAreaPlaneBoard({ sides, mirrorOn, mirrorLabel, resultLit, interactive, ariaLabel, onPick }: SignedAreaPlaneBoardProps) {
  const hatchId = `${useId()}-hatch`
  const values = sides.flatMap((side) => [side.width, side.height])
  const lo = Math.min(0, ...values) - 1
  const hi = Math.max(0, ...values) + 1
  const span = (hi - lo) * unit
  const gridLeft = width / 2 - span / 2
  const height = gridTop + span + 36
  const X = (x: number) => gridLeft + (x - lo) * unit
  const Y = (y: number) => gridTop + (hi - y) * unit
  const lines = Array.from({ length: hi - lo + 1 }, (_, index) => lo + index)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <defs>
        <pattern id={hatchId} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={8} height={8} className="fill-paper" />
          <line x1={0} y1={0} x2={0} y2={8} strokeWidth={2} className="stroke-marker opacity-55" />
        </pattern>
      </defs>
      {lines.map((line) => (
        <g key={line} className="stroke-faint opacity-45">
          <line x1={X(line)} x2={X(line)} y1={Y(hi)} y2={Y(lo)} />
          <line x1={X(lo)} x2={X(hi)} y1={Y(line)} y2={Y(line)} />
        </g>
      ))}
      <line x1={X(lo)} x2={X(hi) + 10} y1={Y(0)} y2={Y(0)} strokeWidth={1.6} className="stroke-ink" />
      <path d={`M${X(hi) + 14} ${Y(0)} l-10 -5 v10 z`} className="fill-ink" />
      <line x1={X(0)} x2={X(0)} y1={Y(lo)} y2={Y(hi) - 10} strokeWidth={1.6} className="stroke-ink" />
      <path d={`M${X(0)} ${Y(hi) - 14} l-5 10 h10 z`} className="fill-ink" />
      <text x={X(0) - 10} y={Y(0) + 20} textAnchor="middle" className="fill-muted font-math text-[15px]">
        0
      </text>
      {sides.map((side) => (
        <g key={`${side.width}-${side.height}`} className="fill-muted font-math text-[15px]">
          <text x={X(side.width)} y={side.height < 0 ? Y(0) - 9 : Y(0) + 20} textAnchor="middle">
            {numberLabel(side.width)}
          </text>
          <text x={side.width < 0 ? X(0) + 8 : X(0) - 8} y={Y(side.height) + 5} textAnchor={side.width < 0 ? 'start' : 'end'}>
            {numberLabel(side.height)}
          </text>
        </g>
      ))}
      {sides.map((side, index) => {
        const x = X(Math.min(0, side.width))
        const y = Y(Math.max(0, side.height))
        const across = Math.abs(side.width)
        const down = Math.abs(side.height)
        const negative = side.width * side.height < 0
        const towardRight = side.width > 0
        const labelX = towardRight ? X(hi) + 26 : X(lo) - 22
        const labelY = Y(side.height / 2) - 22
        const hit = {
          x: towardRight ? X(0) : 0,
          y: side.height < 0 ? Y(0) : 0,
          width: towardRight ? width - X(0) : X(0),
          height: side.height < 0 ? height - Y(0) : Y(0),
        }
        return (
          <FigureSide
            key={index}
            side={index}
            label={side.label}
            title={side.title}
            expression={side.expression}
            textX={labelX}
            textY={labelY}
            anchor={towardRight ? 'start' : 'end'}
            hit={hit}
            selected={side.selected}
            faded={side.faded}
            interactive={interactive}
            onPick={() => onPick(index)}
          >
            {side.shown && (
              <g data-rect={negative ? 'negative' : 'positive'} data-cells={across * down} data-now={side.now || undefined}>
                <rect
                  x={x}
                  y={y}
                  width={across * unit}
                  height={down * unit}
                  fill={negative ? `url(#${hatchId})` : undefined}
                  className={negative ? '' : 'fill-highlight-soft'}
                />
                {Array.from({ length: across - 1 }, (_, step) => (
                  <line key={`v${step}`} x1={x + (step + 1) * unit} x2={x + (step + 1) * unit} y1={y} y2={y + down * unit} className="stroke-ink opacity-45" />
                ))}
                {Array.from({ length: down - 1 }, (_, step) => (
                  <line key={`h${step}`} x1={x} x2={x + across * unit} y1={y + (step + 1) * unit} y2={y + (step + 1) * unit} className="stroke-ink opacity-45" />
                ))}
                <rect
                  x={x}
                  y={y}
                  width={across * unit}
                  height={down * unit}
                  strokeWidth={side.now ? 3 : 2}
                  className={`fill-none ${side.now || negative ? 'stroke-marker' : 'stroke-ink'}`}
                />
              </g>
            )}
            {side.result !== null && (
              <SvgResult x={labelX} y={labelY + 60} value={side.result} lit={resultLit} anchor={towardRight ? 'start' : 'end'} />
            )}
          </FigureSide>
        )
      })}
      <line
        data-mirror={mirrorOn ? 'on' : 'off'}
        x1={X(lo)}
        y1={Y(lo)}
        x2={X(hi)}
        y2={Y(hi)}
        strokeWidth={mirrorOn ? 2.6 : 1.6}
        strokeDasharray="6 5"
        className={`pointer-events-none ${mirrorOn ? 'stroke-marker' : 'stroke-muted'}`}
      />
      <text x={X(hi) + 8} y={Y(hi) + 6} className={`font-hand text-xl font-medium ${mirrorOn ? 'fill-marker' : 'fill-muted'}`}>
        {mirrorLabel}
      </text>
    </svg>
  )
}

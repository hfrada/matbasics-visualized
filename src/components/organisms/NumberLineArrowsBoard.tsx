import { SvgBrace } from '../atoms/SvgBrace'
import { FigureSide } from '../molecules/FigureSide'
import { numberLabel } from '../../lib/numberLabel'

export type LineArrow = { from: number; to: number; lane: number; label: string; now: boolean }
export type LineBrace = { from: number; to: number; label: string; now: boolean }
export type LineMark = { at: number; label: string; now: boolean }

export type LineSide = {
  title: string
  expression: string
  label: string
  started: boolean
  arrows: LineArrow[]
  braces: LineBrace[]
  marks: LineMark[]
  end: number | null
  selected: boolean
  faded: boolean
}

type NumberLineArrowsBoardProps = {
  lo: number
  hi: number
  ends: number[]
  sides: LineSide[]
  litEnd: number | null
  interactive: boolean
  ariaLabel: string
  onPick: (side: number) => void
}

const width = 640
const height = 314
const left = 172
const right = 612
const rowY = [86, 190]
const axisY = 274
const laneGap = 18

export function NumberLineArrowsBoard({ lo, hi, ends, sides, litEnd, interactive, ariaLabel, onPick }: NumberLineArrowsBoardProps) {
  const unit = (right - left) / (hi - lo)
  const px = (value: number) => left + (value - lo) * unit
  const ticks = Array.from({ length: hi - lo + 1 }, (_, index) => lo + index)
  for (const end of ends) if (!ticks.includes(end)) ticks.push(end)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <line x1={left - 16} x2={right + 16} y1={axisY} y2={axisY} strokeWidth={1.6} className="stroke-ink" />
      <path d={`M${right + 18} ${axisY} l-10 -5 v10 z`} className="fill-ink" />
      <path d={`M${left - 18} ${axisY} l10 -5 v10 z`} className="fill-ink" />
      {ticks.map((tick) => {
        const lit = tick === litEnd
        return (
          <g key={tick} data-tick={tick} data-lit={lit || undefined}>
            <line x1={px(tick)} x2={px(tick)} y1={axisY - 6} y2={axisY + 6} strokeWidth={1.3} className="stroke-ink" />
            {lit && <rect x={px(tick) - 17} y={axisY + 10} width={34} height={24} rx={3} className="fill-highlight" />}
            <text
              x={px(tick)}
              y={axisY + 28}
              textAnchor="middle"
              className={`font-math text-[15px] ${lit ? 'fill-ink font-bold dark:fill-paper' : 'fill-muted'}`}
            >
              {numberLabel(tick)}
            </text>
          </g>
        )
      })}
      {sides.map((side, index) => {
        const y = rowY[index]
        const lastArrow = side.arrows.at(-1)
        const endY = lastArrow ? y + lastArrow.lane * laneGap : y
        return (
          <FigureSide
            key={index}
            side={index}
            label={side.label}
            title={side.title}
            expression={side.expression}
            textX={14}
            textY={y - 6}
            hit={{ x: 0, y: y - 58, width, height: index === 0 ? 100 : 96 }}
            selected={side.selected}
            faded={side.faded}
            interactive={interactive}
            onPick={() => onPick(index)}
          >
            {side.started && <circle cx={px(0)} cy={y} r={4} strokeWidth={1.6} className="fill-paper stroke-ink" />}
            {side.braces.map((brace) => (
              <SvgBrace key={`${brace.from}-${brace.to}`} from={px(brace.from)} to={px(brace.to)} y={y - 30} label={brace.label} now={brace.now} />
            ))}
            {side.arrows.map((arrow) => {
              const arrowY = y + arrow.lane * laneGap
              const x1 = px(arrow.from)
              const x2 = px(arrow.to)
              const direction = Math.sign(x2 - x1)
              const tone = arrow.now ? 'stroke-marker' : 'stroke-ink'
              return (
                <g key={`${arrow.from}-${arrow.to}`} data-arrow={arrow.now ? 'now' : 'idle'}>
                  {arrow.lane > 0 && (
                    <line x1={x1} x2={x1} y1={y} y2={arrowY} strokeWidth={1.4} strokeDasharray="3 3" className="stroke-faint" />
                  )}
                  <line x1={x1} x2={x2 - direction * 8} y1={arrowY} y2={arrowY} strokeWidth={arrow.now ? 3 : 2.2} className={tone} />
                  <path d={`M${x2} ${arrowY} l${-direction * 11} -5.5 v11 z`} className={arrow.now ? 'fill-marker' : 'fill-ink'} />
                  <text
                    x={(x1 + x2) / 2}
                    y={arrow.lane > 0 ? arrowY + 22 : arrowY - 10}
                    textAnchor="middle"
                    className={`font-math text-[17px] ${arrow.now ? 'fill-marker' : 'fill-ink'}`}
                  >
                    {arrow.label}
                  </text>
                </g>
              )
            })}
            {side.marks.map((mark) => (
              <g key={mark.at} data-mark={mark.now ? 'now' : 'idle'}>
                <circle
                  cx={px(mark.at)}
                  cy={y}
                  r={9}
                  strokeWidth={mark.now ? 2.6 : 1.8}
                  className={`fill-none ${mark.now ? 'stroke-marker' : 'stroke-ink'}`}
                />
                {mark.label && (
                  <text
                    x={px(mark.at)}
                    y={y - 16}
                    textAnchor="middle"
                    className={`font-math text-[17px] ${mark.now ? 'fill-marker' : 'fill-ink'}`}
                  >
                    {mark.label}
                  </text>
                )}
              </g>
            ))}
            {side.end !== null && (
              <>
                <line
                  x1={px(side.end)}
                  x2={px(side.end)}
                  y1={endY + 6}
                  y2={axisY - 8}
                  strokeWidth={1.4}
                  strokeDasharray="4 4"
                  className="stroke-faint"
                />
                <circle data-end={side.end} cx={px(side.end)} cy={endY} r={4.5} className="fill-ink" />
              </>
            )}
          </FigureSide>
        )
      })}
    </svg>
  )
}

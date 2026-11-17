import { numberLabel } from '../../lib/numberLabel'
import { linePosition } from '../../lib/numberLineLayout'
import { SvgNumberLine } from '../atoms/SvgNumberLine'
import { SvgLinePoints } from '../molecules/SvgLinePoints'

type TransitiveArrowsBoardProps = {
  values: [number, number, number]
  shown: number
  now: number | null
  ariaLabel: string
}

const left = 64
const right = 584
const axisY = 150
const laneY = [106, 54]
const names = ['x', 'y', 'z']

export function TransitiveArrowsBoard({ values, shown, now, ariaLabel }: TransitiveArrowsBoardProps) {
  const [a, b, c] = values
  const lo = Math.min(0, a) - 2
  const hi = c + 2
  const px = linePosition(lo, hi, left, right)
  const arrows = [
    { from: a, to: b, lane: 0 },
    { from: b, to: c, lane: 0 },
    { from: a, to: c, lane: 1 },
  ]
  const finalIndex = arrows.length - 1

  return (
    <svg viewBox="0 24 640 206" role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <SvgNumberLine y={axisY} lo={lo} hi={hi} px={px} tickSide="below" hiddenLabels={values} />
      {arrows.slice(0, shown).map((arrow, index) => {
        const y = laneY[arrow.lane]
        const x1 = px(arrow.from) + 6
        const x2 = px(arrow.to) - 6
        const isNow = now === index
        const isFinal = index === finalIndex
        return (
          <g key={index} data-arrow={index} data-now={isNow || undefined}>
            {[arrow.from, arrow.to].map((end) => (
              <line
                key={end}
                x1={px(end)}
                x2={px(end)}
                y1={y}
                y2={axisY - 8}
                strokeWidth={1.4}
                strokeDasharray="4 4"
                className="stroke-faint"
              />
            ))}
            <line x1={x1} x2={x2 - 8} y1={y} y2={y} strokeWidth={isNow ? 3 : 2.2} className={isNow ? 'stroke-marker' : 'stroke-ink'} />
            <path d={`M${x2} ${y} l-10 -5 v10 z`} className={isNow ? 'fill-marker' : 'fill-ink'} />
            {isFinal && !isNow && <rect x={(x1 + x2) / 2 - 30} y={y - 30} width={60} height={26} rx={3} className="fill-highlight" />}
            <text
              x={(x1 + x2) / 2}
              y={y - 11}
              textAnchor="middle"
              className={`font-math text-[17px] ${isNow ? 'fill-marker' : isFinal ? 'fill-ink dark:fill-paper' : 'fill-ink'}`}
            >
              {`${numberLabel(arrow.from)} < ${numberLabel(arrow.to)}`}
            </text>
          </g>
        )
      })}
      <SvgLinePoints
        points={values.map((value, index) => ({ key: names[index], value, name: names[index], showValue: true, shape: 'dot' }))}
        px={px}
        axisY={axisY}
        side="below"
        left={left}
        right={right}
      />
    </svg>
  )
}

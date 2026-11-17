import { numberLabel } from '../../lib/numberLabel'
import { placeLabelRows } from '../../lib/numberLineLayout'
import { SvgMathName } from '../atoms/SvgMathName'

export type LinePoint = {
  key: string
  value: number
  name: string
  showValue: boolean
  shape: 'dot' | 'square'
}

type SvgLinePointsProps = {
  points: LinePoint[]
  px: (value: number) => number
  axisY: number
  side: 'above' | 'below'
  left: number
  right: number
}

const rowGap = 22

export function SvgLinePoints({ points, px, axisY, side, left, right }: SvgLinePointsProps) {
  const texts = points.map((point) => (point.showValue ? `${point.name} = ${numberLabel(point.value)}` : point.name))
  const rows = placeLabelRows(
    points.map((point, index) => ({ value: point.value, chars: texts[index].length })),
    px,
    left,
    right,
  )
  const direction = side === 'above' ? -1 : 1
  const marks = [...points].sort((a, b) => Number(b.shape === 'square') - Number(a.shape === 'square'))

  return (
    <g>
      {points.map((point, index) => {
        const { x, row } = rows[index]
        const baseline = side === 'above' ? axisY - 32 - row * rowGap : axisY + 46 + row * rowGap
        return (
          <g key={point.key}>
            <line
              x1={px(point.value)}
              x2={x}
              y1={axisY + direction * 8}
              y2={side === 'above' ? baseline + 5 : baseline - 15}
              strokeWidth={1}
              strokeDasharray="2 3"
              className="stroke-faint"
            />
            <text data-point={point.key} x={x} y={baseline} textAnchor="middle" className="fill-ink font-math text-[16px]">
              <SvgMathName name={point.name} />
              {point.showValue && ` = ${numberLabel(point.value)}`}
            </text>
          </g>
        )
      })}
      {marks.map((point) =>
        point.shape === 'square' ? (
          <rect
            key={point.key}
            x={px(point.value) - 6}
            y={axisY - 6}
            width={12}
            height={12}
            strokeWidth={2}
            className="fill-paper stroke-ink"
          />
        ) : (
          <circle key={point.key} cx={px(point.value)} cy={axisY} r={5} className="fill-ink" />
        ),
      )}
    </g>
  )
}

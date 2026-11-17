import { numberLabel } from '../../lib/numberLabel'
import { crowdedLabels, linePosition } from '../../lib/numberLineLayout'
import { SvgBracket } from '../atoms/SvgBracket'
import { SvgMathName } from '../atoms/SvgMathName'
import { SvgNumberLine } from '../atoms/SvgNumberLine'

type TriangleArrowsBoardProps = {
  a: number
  b: number
  sumShown: boolean
  sumMeasured: boolean
  absoluteShown: boolean
  gapShown: boolean
  ariaLabel: string
}

type ArrowLine = {
  key: 'sum' | 'absolute'
  name: string
  y: number
  first: number
  second: number
  names: [string, string]
  shown: boolean
  measured: boolean
  measure: string
}

const lo = -12
const hi = 12
const left = 110
const right = 610
const laneGap = 24
const px = linePosition(lo, hi, left, right)
const labelBounds: [number, number] = [60, 580]

function Arrow({ from, to, y, name, arrowKey }: { from: number; to: number; y: number; name: string; arrowKey: string }) {
  if (Math.abs(to - from) < 0.5) return null
  const direction = Math.sign(to - from)
  return (
    <g data-arrow={arrowKey}>
      <line x1={from} x2={to - direction * 8} y1={y} y2={y} strokeWidth={2.2} className="stroke-ink" />
      <path d={`M${to} ${y} l${-direction * 11} -5.5 v11 z`} className="fill-ink" />
      <text x={(from + to) / 2} y={y - 7} textAnchor="middle" className="fill-ink font-math text-base">
        <SvgMathName name={name} />
      </text>
    </g>
  )
}

export function TriangleArrowsBoard({ a, b, sumShown, sumMeasured, absoluteShown, gapShown, ariaLabel }: TriangleArrowsBoardProps) {
  const sum = a + b
  const leftSide = Math.abs(sum)
  const rightSide = Math.abs(a) + Math.abs(b)
  const lines: ArrowLine[] = [
    { key: 'sum', name: 'a + b', y: 76, first: a, second: b, names: ['a', 'b'], shown: sumShown, measured: sumMeasured, measure: `|a + b| = ${numberLabel(leftSide)}` },
    {
      key: 'absolute',
      name: '|a| + |b|',
      y: 216,
      first: Math.abs(a),
      second: Math.abs(b),
      names: ['|a|', '|b|'],
      shown: absoluteShown,
      measured: absoluteShown,
      measure: `|a| + |b| = ${numberLabel(rightSide)}`,
    },
  ]

  return (
    <svg viewBox="0 0 640 282" role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {lines.map((line) => {
        const end = line.first + line.second
        const firstY = line.y - laneGap + 2
        const secondY = firstY - laneGap
        const endY = line.second === 0 ? firstY : secondY
        const lit = line.shown ? [end] : []
        return (
          <g key={line.key} data-line={line.key} data-shown={line.shown || undefined}>
            <text x={8} y={line.y + 6} className="fill-muted font-math text-[18px]">
              <SvgMathName name={line.name} />
            </text>
            <SvgNumberLine
              y={line.y}
              lo={lo}
              hi={hi}
              px={px}
              tickSide="below"
              hiddenLabels={crowdedLabels(lit, lo, hi, 2, px)}
              labelStep={2}
              litLabels={lit}
            />
            {line.shown && (
              <>
                <Arrow from={px(0)} to={px(line.first)} y={firstY} name={line.names[0]} arrowKey={`${line.key}-first`} />
                {line.second !== 0 && (
                  <>
                    <line x1={px(line.first)} x2={px(line.first)} y1={firstY} y2={secondY} strokeWidth={1.4} strokeDasharray="4 4" className="stroke-faint" />
                    <Arrow from={px(line.first)} to={px(end)} y={secondY} name={line.names[1]} arrowKey={`${line.key}-second`} />
                  </>
                )}
                <line x1={px(end)} x2={px(end)} y1={endY} y2={line.y} strokeWidth={1.4} strokeDasharray="4 4" className="stroke-faint" />
                <circle data-end={line.key} cx={px(end)} cy={line.y} r={5.5} className="fill-ink" />
              </>
            )}
            {line.measured && (
              <g data-measure={line.key}>
                <SvgBracket
                  from={px(Math.min(0, end))}
                  to={px(Math.max(0, end))}
                  y={line.y + 38}
                  label={<SvgMathName name={line.measure} />}
                  tone="ink"
                  labelBounds={labelBounds}
                />
              </g>
            )}
          </g>
        )
      })}
      {gapShown && leftSide < rightSide && (
        <g data-gap={rightSide - leftSide}>
          <rect x={px(leftSide)} y={lines[1].y - 5} width={px(rightSide) - px(leftSide)} height={10} className="fill-marker opacity-40" />
          <circle cx={px(leftSide)} cy={lines[1].y} r={5} strokeWidth={2} className="fill-paper stroke-marker" />
        </g>
      )}
    </svg>
  )
}

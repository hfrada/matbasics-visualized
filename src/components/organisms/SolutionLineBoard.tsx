import { solutionEnds, solutionIntervals, type SolutionSet } from '../../lib/inequality'
import { numberLabel } from '../../lib/numberLabel'
import { crowdedLabels, linePosition } from '../../lib/numberLineLayout'
import { SvgBracket } from '../atoms/SvgBracket'
import { SvgMathName } from '../atoms/SvgMathName'
import { SvgNumberLine } from '../atoms/SvgNumberLine'

type SolutionLineBoardProps = {
  set: SolutionSet | null
  x: number
  satisfied: boolean
  ariaLabel: string
  lo?: number
  hi?: number
  rejected?: number[]
  distance?: number | null
}

const left = 60
const right = 584
const axisY = 64
const rayOverhang = 16
const labelBounds: [number, number] = [left, right]

function SetMarks({ set, px }: { set: SolutionSet; px: (value: number) => number }) {
  if (set.kind === 'points') {
    return set.values.map((value) => <circle key={value} data-end="closed" cx={px(value)} cy={axisY} r={6} className="fill-ink" />)
  }
  return solutionIntervals(set).map((part, partIndex) => {
    const start = part.low ? px(part.low.at) : left - rayOverhang
    const end = part.high ? px(part.high.at) : right + rayOverhang
    return (
      <g key={partIndex}>
        <line x1={start} x2={end} y1={axisY} y2={axisY} strokeWidth={4} className="stroke-ink" />
        {[part.low, part.high].map(
          (bound, index) =>
            bound && (
              <circle
                key={index}
                data-end={bound.closed ? 'closed' : 'open'}
                cx={px(bound.at)}
                cy={axisY}
                r={6}
                strokeWidth={bound.closed ? 0 : 2.2}
                className={bound.closed ? 'fill-ink' : 'fill-paper stroke-ink'}
              />
            ),
        )}
      </g>
    )
  })
}

function SetBand({ set, px }: { set: SolutionSet; px: (value: number) => number }) {
  if (set.kind === 'points') {
    return set.values.map((value) => <circle key={value} cx={px(value)} cy={axisY} r={12} className="fill-highlight" />)
  }
  return solutionIntervals(set).map((part, index) => {
    const start = part.low ? px(part.low.at) : left - rayOverhang
    const end = part.high ? px(part.high.at) : right + rayOverhang
    return <rect key={index} x={start} y={axisY - 8} width={end - start} height={16} className="fill-highlight" />
  })
}

export function SolutionLineBoard({ set, x, satisfied, ariaLabel, lo = -6, hi = 6, rejected = [], distance = null }: SolutionLineBoardProps) {
  const px = linePosition(lo, hi, left, right)
  const cx = px(x)
  const labelX = Math.min(Math.max(cx, left), right)
  const stroke = satisfied ? 'stroke-ink' : 'stroke-marker'
  const fill = satisfied ? 'fill-ink' : 'fill-marker'
  const ends = set ? solutionEnds(set) : []
  const marked = set ? rejected : []
  const height = distance === null ? 92 : 166

  return (
    <svg viewBox={`0 14 640 ${height}`} role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {set && (
        <g data-set={set.kind}>
          <SetBand set={set} px={px} />
        </g>
      )}
      <SvgNumberLine
        y={axisY}
        lo={lo}
        hi={hi}
        px={px}
        tickSide="below"
        hiddenLabels={crowdedLabels([...ends, ...marked], lo, hi, 1, px)}
        labelStep={1}
        halfTicks
        litLabels={ends}
        markedLabels={marked}
        infinity
      />
      {set && <SetMarks set={set} px={px} />}
      {marked.map((value) => (
        <g key={value} data-rejected={numberLabel(value)}>
          <line x1={px(value) - 6} x2={px(value) + 6} y1={axisY - 6} y2={axisY + 6} strokeWidth={2.6} strokeLinecap="round" className="stroke-marker" />
          <line x1={px(value) - 6} x2={px(value) + 6} y1={axisY + 6} y2={axisY - 6} strokeWidth={2.6} strokeLinecap="round" className="stroke-marker" />
        </g>
      ))}
      {distance !== null && (
        <>
          <g data-radius={distance}>
            <SvgBracket from={px(-distance)} to={px(0)} y={axisY + 48} label={numberLabel(distance)} tone="ink" labelBounds={labelBounds} />
            <SvgBracket from={px(0)} to={px(distance)} y={axisY + 48} label={numberLabel(distance)} tone="ink" labelBounds={labelBounds} />
          </g>
          <g data-distance={satisfied ? 'in' : 'out'}>
            <SvgBracket
              from={px(0)}
              to={cx}
              y={axisY + 86}
              label={<SvgMathName name={`|x| = ${numberLabel(Math.abs(x))}`} />}
              tone={satisfied ? 'ink' : 'marker'}
              labelBounds={labelBounds}
            />
          </g>
        </>
      )}
      <g data-probe={satisfied ? 'in' : 'out'}>
        <line x1={cx} x2={cx} y1={axisY - 10} y2={axisY - 1} strokeWidth={1.4} strokeDasharray="3 3" className={stroke} />
        <path d={`M${cx - 7} ${axisY - 22} h14 l-7 12 z`} className={fill} />
        <text x={labelX} y={axisY - 30} textAnchor="middle" className={`font-math text-[16px] ${fill}`}>
          <SvgMathName name="x" />
          {` = ${numberLabel(x)}`}
        </text>
      </g>
    </svg>
  )
}

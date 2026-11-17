import { numberLabel } from '../../lib/numberLabel'
import { crowdedLabels, linePosition } from '../../lib/numberLineLayout'
import { SvgBracket } from '../atoms/SvgBracket'
import { SvgMathName } from '../atoms/SvgMathName'
import { SvgNumberLine } from '../atoms/SvgNumberLine'

type MirrorLineBoardProps = {
  a: number
  mirrored: boolean
  measured: boolean
  ariaLabel: string
}

const lo = -6
const hi = 6
const left = 60
const right = 584
const axisY = 84
const nameY = axisY - 14
const arcY = axisY - 30
const px = linePosition(lo, hi, left, right)

export function MirrorLineBoard({ a, mirrored, measured, ariaLabel }: MirrorLineBoardProps) {
  const negative = a < 0
  const showMirror = negative && mirrored
  const lit = showMirror ? [a, -a] : [a]
  const start = px(a)
  const middle = px(0)
  const end = px(-a) - 3
  const top = axisY - 34 - Math.min(40, 10 + Math.abs(a) * 5)
  const angle = (Math.atan2(arcY - 1 - top, end - middle) * 180) / Math.PI

  return (
    <svg viewBox="0 0 640 160" role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <SvgNumberLine
        y={axisY}
        lo={lo}
        hi={hi}
        px={px}
        tickSide="below"
        hiddenLabels={crowdedLabels(lit, lo, hi, 1, px)}
        labelStep={1}
        halfTicks
        litLabels={lit}
        infinity
      />
      {showMirror && (
        <g data-mirror="on">
          <path
            d={`M${start} ${arcY} Q${middle} ${top} ${end} ${arcY - 1}`}
            strokeWidth={1.8}
            strokeDasharray="5 4"
            className="fill-none stroke-ink"
          />
          <path d="M0 0 l-10 -5 v10 z" transform={`translate(${end} ${arcY - 1}) rotate(${angle})`} className="fill-ink" />
          <circle data-point="mirror" cx={px(-a)} cy={axisY} r={6} strokeWidth={2.2} className="fill-paper stroke-ink" />
          <text x={px(-a)} y={nameY} textAnchor="middle" className="fill-ink font-math text-[17px]">
            <SvgMathName name="−a" />
          </text>
        </g>
      )}
      <circle data-point="a" cx={start} cy={axisY} r={6} className="fill-ink" />
      <text x={start} y={nameY} textAnchor="middle" className="fill-ink font-math text-[17px]">
        <SvgMathName name="a" />
      </text>
      {measured && (
        <g data-distance={numberLabel(Math.abs(a))}>
          <SvgBracket
            from={px(Math.min(a, 0))}
            to={px(Math.max(a, 0))}
            y={axisY + 48}
            label={<SvgMathName name={`|a| = ${numberLabel(Math.abs(a))}`} />}
            tone="ink"
            labelBounds={[left, right]}
          />
        </g>
      )}
    </svg>
  )
}

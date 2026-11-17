import { linePosition } from '../../lib/numberLineLayout'
import { SvgMathName } from '../atoms/SvgMathName'
import { SvgNumberLine } from '../atoms/SvgNumberLine'
import { SvgLinePoints } from '../molecules/SvgLinePoints'

export type TrichotomyRegions =
  | { kind: 'around'; left: string; right: string }
  | { kind: 'halves'; negative: string; positive: string }

type TrichotomyLineBoardProps = {
  reference: number
  referenceName: string
  x: number
  chips: [string, string, string]
  regions: TrichotomyRegions
  ariaLabel: string
}

const lo = -10
const hi = 10
const left = 64
const right = 584
const axisY = 132
const regionY = 100
const px = linePosition(lo, hi, left, right)

export function TrichotomyLineBoard({ reference, referenceName, x, chips, regions, ariaLabel }: TrichotomyLineBoardProps) {
  const relation = Math.sign(x - reference)
  const centers = [(lo + reference) / 2, reference, (reference + hi) / 2]
  const regionClass = 'font-hand text-[21px] font-medium'

  return (
    <svg viewBox="0 20 640 200" role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {chips.map((chip, index) => {
        const on = index === relation + 1
        const cx = px(centers[index])
        const width = chip.length * 10 + 22
        return (
          <g key={chip} data-chip={index} data-on={on}>
            {on && <rect x={cx - width / 2} y={30} width={width} height={34} rx={3} className="fill-highlight" />}
            <text
              x={cx}
              y={54}
              textAnchor="middle"
              className={`font-math text-[20px] transition-opacity duration-300 ${on ? 'fill-ink dark:fill-paper' : 'fill-ink opacity-30'}`}
            >
              <SvgMathName name={chip} />
            </text>
          </g>
        )
      })}
      {regions.kind === 'halves' ? (
        <>
          <text
            data-region="negative"
            x={px((lo + reference) / 2)}
            y={regionY}
            textAnchor="middle"
            className={`${regionClass} ${relation < 0 ? 'fill-ink font-bold' : 'fill-muted'}`}
          >
            {regions.negative}
          </text>
          <text
            data-region="positive"
            x={px((reference + hi) / 2)}
            y={regionY}
            textAnchor="middle"
            className={`${regionClass} ${relation > 0 ? 'fill-ink font-bold' : 'fill-muted'}`}
          >
            {regions.positive}
          </text>
        </>
      ) : (
        <>
          <text x={px(reference) - 18} y={regionY} textAnchor="end" className={`${regionClass} fill-muted`}>
            {regions.left}
          </text>
          <text x={px(reference) + 18} y={regionY} className={`${regionClass} fill-muted`}>
            {regions.right}
          </text>
        </>
      )}
      <text x={right + 6} y={axisY - 14} className="fill-ink font-math text-[19px]">
        ℝ
      </text>
      <SvgNumberLine y={axisY} lo={lo} hi={hi} px={px} tickSide="below" hiddenLabels={[x, reference]} infinity />
      <SvgLinePoints
        points={[
          { key: 'reference', value: reference, name: referenceName, showValue: referenceName !== '0', shape: 'square' },
          { key: 'x', value: x, name: 'x', showValue: true, shape: 'dot' },
        ]}
        px={px}
        axisY={axisY}
        side="below"
        left={left}
        right={right}
      />
    </svg>
  )
}

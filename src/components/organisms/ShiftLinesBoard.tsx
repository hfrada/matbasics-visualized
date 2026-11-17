import { linePosition, segmentCrossing } from '../../lib/numberLineLayout'
import { SvgNumberLine } from '../atoms/SvgNumberLine'
import { SvgLinePoints } from '../molecules/SvgLinePoints'

type ShiftLinesBoardProps = {
  values: [number, number]
  moved: [number, number] | null
  names: [string, string]
  range: [number, number]
  direction: 'down' | 'up'
  operationLabel: string
  titles: [string, string]
  crossLabel: string
  meetLabel: string
  ariaLabel: string
}

const left = 150
const right = 590
const topY = 118
const bottomY = 240
const flowX = 44
const linkInset = 8
const headLength = 11
const headHalf = 5

type Point = { x: number; y: number }

function Link({ from, to, headAtEnd, crossed }: { from: Point; to: Point; headAtEnd: boolean; crossed: boolean }) {
  const [head, tail] = headAtEnd ? [to, from] : [from, to]
  const length = Math.hypot(head.x - tail.x, head.y - tail.y)
  const dx = (head.x - tail.x) / length
  const dy = (head.y - tail.y) / length
  const base = { x: head.x - dx * headLength, y: head.y - dy * headLength }
  return (
    <g data-link={crossed ? 'crossed' : 'straight'}>
      <line
        x1={tail.x}
        y1={tail.y}
        x2={base.x}
        y2={base.y}
        strokeWidth={crossed ? 2.4 : 1.8}
        className={crossed ? 'stroke-marker' : 'stroke-ink'}
      />
      <path
        d={`M${head.x} ${head.y} L${base.x - dy * headHalf} ${base.y + dx * headHalf} L${base.x + dy * headHalf} ${base.y - dx * headHalf} Z`}
        className={crossed ? 'fill-marker' : 'fill-ink'}
      />
    </g>
  )
}

function Band({ from, to, y, px }: { from: number; to: number; y: number; px: (value: number) => number }) {
  if (from === to) return null
  return <rect data-band x={px(Math.min(from, to))} y={y - 4} width={Math.abs(px(to) - px(from))} height={8} className="fill-highlight opacity-85" />
}

export function ShiftLinesBoard({
  values,
  moved,
  names,
  range,
  direction,
  operationLabel,
  titles,
  crossLabel,
  meetLabel,
  ariaLabel,
}: ShiftLinesBoardProps) {
  const [lo, hi] = range
  const px = linePosition(lo, hi, left, right)
  const links = moved
    ? values.map((value, index): [Point, Point] => [
        { x: px(value), y: topY + linkInset },
        { x: px(moved[index]), y: bottomY - linkInset },
      ])
    : []
  const crossing = links.length === 2 ? segmentCrossing(links[0], links[1]) : null
  const meeting = moved !== null && moved[0] === moved[1]

  return (
    <svg viewBox="0 36 640 290" role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <text x={14} y={topY + 7} className="fill-muted font-hand text-[21px] font-medium">
        {titles[0]}
      </text>
      <text x={14} y={bottomY + 7} className="fill-muted font-hand text-[21px] font-medium">
        {titles[1]}
      </text>
      <Band from={values[0]} to={values[1]} y={topY} px={px} />
      {moved && <Band from={moved[0]} to={moved[1]} y={bottomY} px={px} />}
      <SvgNumberLine y={topY} lo={lo} hi={hi} px={px} tickSide="above" hiddenLabels={values} />
      <SvgNumberLine y={bottomY} lo={lo} hi={hi} px={px} tickSide="below" hiddenLabels={moved ?? []} faint={!moved} />
      {moved && (
        <g data-flow={direction}>
          {direction === 'up' ? (
            <>
              <line x1={flowX} x2={flowX} y1={bottomY - 24} y2={topY + 34} strokeWidth={1.8} className="stroke-muted" />
              <path d={`M${flowX} ${topY + 22} l-6 12 h12 z`} className="fill-muted" />
            </>
          ) : (
            <>
              <line x1={flowX} x2={flowX} y1={topY + 24} y2={bottomY - 34} strokeWidth={1.8} className="stroke-muted" />
              <path d={`M${flowX} ${bottomY - 22} l-6 -12 h12 z`} className="fill-muted" />
            </>
          )}
          <text x={flowX + 14} y={(topY + bottomY) / 2 + 6} className="fill-ink font-math text-[19px]">
            {operationLabel}
          </text>
        </g>
      )}
      {links.map(([from, to], index) => (
        <Link key={index} from={from} to={to} headAtEnd={direction === 'down'} crossed={crossing !== null} />
      ))}
      {crossing && (
        <g data-cross>
          <circle cx={crossing.x} cy={crossing.y} r={8} strokeWidth={2.4} className="fill-none stroke-marker" />
          <text x={crossing.x + 14} y={crossing.y + 6} className="fill-marker font-hand text-[22px] font-bold">
            {crossLabel}
          </text>
        </g>
      )}
      {meeting && (
        <text data-meet x={px(moved[0]) + 14} y={bottomY - 22} className="fill-muted font-hand text-[20px] font-medium">
          {meetLabel}
        </text>
      )}
      <SvgLinePoints
        points={values.map((value, index) => ({ key: ['x', 'y'][index], value, name: ['x', 'y'][index], showValue: true, shape: 'dot' }))}
        px={px}
        axisY={topY}
        side="above"
        left={left}
        right={right}
      />
      {moved && (
        <SvgLinePoints
          points={moved.map((value, index) => ({ key: `moved-${index}`, value, name: names[index], showValue: true, shape: 'dot' }))}
          px={px}
          axisY={bottomY}
          side="below"
          left={left}
          right={right}
        />
      )}
    </svg>
  )
}

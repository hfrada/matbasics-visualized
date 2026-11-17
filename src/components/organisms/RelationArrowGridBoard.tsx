import type { KeyboardEvent } from 'react'

export type RelationMember = { label: string; tex: string; kind: 'word' | 'number' | 'letter'; value?: number }
export type RelationSet = { name: string; members: RelationMember[] }
export type RelationPair = { i: number; j: number; holds: boolean; checked: boolean }

type RelationArrowGridBoardProps = {
  first: RelationSet
  second: RelationSet
  pairs: RelationPair[]
  focus: RelationPair | null
  interactive: boolean
  onPick: (pair: RelationPair) => void
  ariaLabel: string
}

const width = 680
const height = 340
const centerY = 175
const leftX = 80
const rightX = 270
const arrowFrom = 118
const arrowTo = 212
const gridLeft = 446
const gridBottom = 292

const labelWidth = (member: RelationMember) => member.label.length * (member.kind === 'word' ? 7.8 : 10) + 4
const memberClass: Record<RelationMember['kind'], string> = {
  word: 'font-sans text-[15px]',
  number: 'font-math text-[18px]',
  letter: 'font-math-italic text-[18px] italic',
}

function Arrow({ x1, y1, x2, y2, now }: { x1: number; y1: number; x2: number; y2: number; now: boolean }) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const size = 10
  const corner = (turn: number) => `${x2 - size * Math.cos(angle + turn)} ${y2 - size * Math.sin(angle + turn)}`
  const lineEndX = x2 - size * 0.7 * Math.cos(angle)
  const lineEndY = y2 - size * 0.7 * Math.sin(angle)
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={lineEndX}
        y2={lineEndY}
        strokeWidth={now ? 2.2 : 1.8}
        strokeDasharray={now ? '6 4' : undefined}
        className={now ? 'stroke-marker' : 'stroke-ink'}
      />
      <path d={`M${x2} ${y2} L${corner(0.38)} L${corner(-0.38)} Z`} className={now ? 'fill-marker' : 'fill-ink'} />
    </>
  )
}

function MemberLabel({ member, x, y, anchor, lit }: { member: RelationMember; x: number; y: number; anchor: 'middle' | 'end'; lit: boolean }) {
  const size = labelWidth(member)
  const left = anchor === 'middle' ? x - size / 2 : x - size
  return (
    <g data-member={member.label} data-lit={lit || undefined}>
      {lit && <rect x={left - 3} y={y - 16} width={size + 6} height={22} rx={3} className="fill-highlight" />}
      <text x={x} y={y} textAnchor={anchor} className={`${memberClass[member.kind]} fill-ink ${lit ? 'dark:fill-paper' : ''}`}>
        {member.label}
      </text>
    </g>
  )
}

export function RelationArrowGridBoard({ first, second, pairs, focus, interactive, onPick, ariaLabel }: RelationArrowGridBoardProps) {
  const firstCount = first.members.length
  const secondCount = second.members.length
  const memberY = (count: number, index: number) => centerY + (index - (count - 1) / 2) * 50
  const leftY = (i: number) => memberY(firstCount, i)
  const rightY = (j: number) => memberY(secondCount, j)
  const leftRadius = firstCount * 25 + 18
  const rightRadius = secondCount * 25 + 18
  const columnX = (i: number) => (firstCount === 1 ? 560 : 486 + i * Math.min(70, 174 / (firstCount - 1)))
  const rowY = (j: number) => (secondCount === 1 ? centerY : 258 - j * Math.min(84, 180 / (secondCount - 1)))
  const isFocus = (pair: RelationPair) => focus !== null && focus.i === pair.i && focus.j === pair.j
  const pairName = (pair: RelationPair) => `(${first.members[pair.i].label}, ${second.members[pair.j].label})`

  function onKey(event: KeyboardEvent, pair: RelationPair) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onPick(pair)
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <g data-arrows>
        <ellipse cx={leftX} cy={centerY} rx={52} ry={leftRadius} strokeWidth={1.6} className="fill-none stroke-ink" />
        <ellipse cx={rightX} cy={centerY} rx={68} ry={rightRadius} strokeWidth={1.6} className="fill-none stroke-ink" />
        <text x={leftX} y={centerY - leftRadius - 10} textAnchor="middle" className="fill-ink font-math-italic text-[21px] italic">
          {first.name}
        </text>
        <text x={rightX} y={centerY - rightRadius - 10} textAnchor="middle" className="fill-ink font-math-italic text-[21px] italic">
          {second.name}
        </text>
        {pairs
          .filter((pair) => pair.holds && pair.checked && !isFocus(pair))
          .map((pair) => (
            <g key={`${pair.i}-${pair.j}`} data-arrow={`${pair.i}-${pair.j}`}>
              <Arrow x1={arrowFrom} y1={leftY(pair.i)} x2={arrowTo} y2={rightY(pair.j)} now={false} />
            </g>
          ))}
        {focus && (
          <g data-arrow={`${focus.i}-${focus.j}`} data-now>
            <Arrow x1={arrowFrom} y1={leftY(focus.i)} x2={arrowTo} y2={rightY(focus.j)} now />
          </g>
        )}
        {first.members.map((member, i) => (
          <MemberLabel key={i} member={member} x={leftX} y={leftY(i) + 6} anchor="middle" lit={focus?.i === i} />
        ))}
        {second.members.map((member, j) => (
          <MemberLabel key={j} member={member} x={rightX} y={rightY(j) + 6} anchor="middle" lit={focus?.j === j} />
        ))}
      </g>
      <g data-grid>
        <text x={560} y={34} textAnchor="middle" className="fill-ink font-math text-[20px]">
          <tspan className="font-math-italic italic">{first.name}</tspan> × <tspan className="font-math-italic italic">{second.name}</tspan>
        </text>
        {first.members.map((_, i) => (
          <line key={i} x1={columnX(i)} x2={columnX(i)} y1={gridBottom} y2={rowY(secondCount - 1)} strokeDasharray="3 4" className="stroke-faint" />
        ))}
        {second.members.map((_, j) => (
          <line key={j} x1={gridLeft} x2={columnX(firstCount - 1)} y1={rowY(j)} y2={rowY(j)} strokeDasharray="3 4" className="stroke-faint" />
        ))}
        <line x1={gridLeft} y1={gridBottom} x2={676} y2={gridBottom} strokeWidth={1.6} className="stroke-ink" />
        <line x1={gridLeft} y1={gridBottom} x2={gridLeft} y2={54} strokeWidth={1.6} className="stroke-ink" />
        {first.members.map((member, i) => (
          <MemberLabel key={i} member={member} x={columnX(i)} y={318} anchor="middle" lit={focus?.i === i} />
        ))}
        {second.members.map((member, j) => (
          <MemberLabel key={j} member={member} x={434} y={rowY(j) + 6} anchor="end" lit={focus?.j === j} />
        ))}
        {pairs.map((pair) => {
          const cx = columnX(pair.i)
          const cy = rowY(pair.j)
          const now = isFocus(pair)
          return (
            <g
              key={`${pair.i}-${pair.j}`}
              data-pair={`${pair.i}-${pair.j}`}
              data-in={pair.holds}
              data-checked={pair.checked}
              data-focus={now || undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={pairName(pair)}
              aria-pressed={interactive ? now : undefined}
              onClick={interactive ? () => onPick(pair) : undefined}
              onKeyDown={interactive ? (event) => onKey(event, pair) : undefined}
              className={interactive ? 'cursor-pointer outline-none' : ''}
            >
              {pair.checked && pair.holds && (
                <>
                  <circle cx={cx} cy={cy} r={11} className="fill-highlight" />
                  <circle cx={cx} cy={cy} r={5.5} className="fill-ink" />
                </>
              )}
              {pair.checked && !pair.holds && (
                <path d={`M${cx - 5} ${cy - 5} L${cx + 5} ${cy + 5} M${cx - 5} ${cy + 5} L${cx + 5} ${cy - 5}`} strokeWidth={1.8} className="stroke-muted" />
              )}
              {!pair.checked && <circle cx={cx} cy={cy} r={5} strokeWidth={1.5} className="fill-paper stroke-faint" />}
              {now && <circle cx={cx} cy={cy} r={15} strokeWidth={2.4} className="fill-none stroke-marker" />}
              <circle cx={cx} cy={cy} r={18} className="fill-transparent" />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

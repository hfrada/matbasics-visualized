import { useId, type KeyboardEvent } from 'react'
import {
  pairPieces,
  pairPlain,
  pairPosition,
  type Member,
  type NamedSet,
  type TextPiece,
} from '../../lib/cartesianProduct'

export type GridHighlight = {
  points: number[]
  columns: number[]
  rows: number[]
  vertical: boolean
  horizontal: boolean
}

type CartesianGridBoardProps = {
  first: NamedSet
  second: NamedSet
  shown: number
  highlight: GridHighlight
  interactive: boolean
  onSelectPoint: (index: number) => void
  onSelectColumn: (index: number) => void
  onSelectRow: (index: number) => void
}

type Layout = {
  width: number
  height: number
  originX: number
  originY: number
  unit: number | null
  columnX: (index: number) => number
  rowY: (index: number) => number
  chipRadius: number
  chipFont: number
  labelFont: number
  separator: string
}

const planeUnit = 56

function layoutOf(first: NamedSet, second: NamedSet): Layout {
  const numeric = [...first.members, ...second.members].every((member) => member.value !== undefined)
  if (!numeric) {
    const originX = 110
    const originY = 320
    const columnGap = 450 / (first.members.length + 0.6)
    const rowGap = 260 / (second.members.length + 0.6)
    return {
      width: 640,
      height: 380,
      originX,
      originY,
      unit: null,
      columnX: (index) => originX + (index + 1) * columnGap,
      rowY: (index) => originY - (index + 1) * rowGap,
      chipRadius: 20,
      chipFont: 22,
      labelFont: 17,
      separator: ', ',
    }
  }
  const xs = first.members.map((member) => member.value ?? 0)
  const ys = second.members.map((member) => member.value ?? 0)
  const middleX = (Math.min(...xs) + Math.max(...xs)) / 2
  const middleY = (Math.min(...ys) + Math.max(...ys)) / 2
  const originX = 320 - middleX * planeUnit
  const originY = 205 + middleY * planeUnit
  return {
    width: 640,
    height: 400,
    originX,
    originY,
    unit: planeUnit,
    columnX: (index) => originX + xs[index] * planeUnit,
    rowY: (index) => originY - ys[index] * planeUnit,
    chipRadius: 16,
    chipFont: 17,
    labelFont: 13,
    separator: ',',
  }
}

function gridSteps(origin: number, unit: number, limit: number) {
  const start = origin - Math.floor(origin / unit) * unit
  return Array.from({ length: Math.ceil((limit - start) / unit) }, (_, index) => start + index * unit)
}

function PieceSpans({ pieces, shift }: { pieces: TextPiece[]; shift: number }) {
  return (
    <>
      {pieces.map((piece, index) => {
        const lowered = index > 0 && Boolean(pieces[index - 1].subscript)
        const dy = piece.subscript && !lowered ? shift : !piece.subscript && lowered ? -shift : undefined
        return (
          <tspan
            key={index}
            dy={dy}
            fontSize={piece.subscript ? '0.7em' : undefined}
            className={piece.italic ? 'font-math-italic italic' : undefined}
          >
            {piece.text}
          </tspan>
        )
      })}
    </>
  )
}

export function CartesianGridBoard({
  first,
  second,
  shown,
  highlight,
  interactive,
  onSelectPoint,
  onSelectColumn,
  onSelectRow,
}: CartesianGridBoardProps) {
  const arrowId = `${useId()}-arrow`
  const layout = layoutOf(first, second)
  const { width, height, originX, originY, unit } = layout
  const rowCount = second.members.length
  const total = first.members.length * rowCount
  const xs = first.members.map((_, index) => layout.columnX(index))
  const ys = second.members.map((_, index) => layout.rowY(index))
  const guideTop = Math.min(originY, ...ys)
  const guideBottom = Math.max(originY, ...ys)
  const guideLeft = Math.min(originX, ...xs)
  const guideRight = Math.max(originX, ...xs)
  const axisLeft = unit ? 14 : originX
  const axisBottom = unit ? height - 14 : originY

  function activate(event: KeyboardEvent, action: () => void) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    action()
  }

  function chip(member: Member, set: NamedSet, x: number, y: number, glow: boolean, onSelect: () => void) {
    return (
      <g
        key={`${set.name}-${member.tex}`}
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-label={`${member.plain} ∈ ${set.name}`}
        aria-pressed={glow}
        onClick={() => interactive && onSelect()}
        onKeyDown={(event) => interactive && activate(event, onSelect)}
        transform={`translate(${x} ${y})`}
        className={`outline-none ${interactive ? 'cursor-pointer' : ''}`}
      >
        <circle
          r={layout.chipRadius + 3}
          className={`fill-highlight transition-opacity ${glow ? 'opacity-85' : 'opacity-0'}`}
        />
        <circle r={layout.chipRadius + 1} cx="1.5" cy="1.5" strokeWidth="1" className="fill-none stroke-ink opacity-35" />
        <circle r={layout.chipRadius} strokeWidth="1.8" className="fill-paper stroke-ink" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: layout.chipFont }}
          className="pointer-events-none fill-ink font-math"
        >
          <PieceSpans pieces={member.pieces} shift={layout.chipFont * 0.22} />
        </text>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full">
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto">
          <path d="M1 1 L9 5 L1 9" strokeWidth="1.6" className="fill-none stroke-ink" />
        </marker>
      </defs>

      {unit && (
        <g className="stroke-grid">
          {gridSteps(originX, unit, width).map((x) => (
            <line key={`x-${x}`} x1={x} y1="0" x2={x} y2={height} />
          ))}
          {gridSteps(originY, unit, height).map((y) => (
            <line key={`y-${y}`} x1="0" y1={y} x2={width} y2={y} />
          ))}
        </g>
      )}

      <g strokeWidth="1.4" strokeDasharray="5 5" className="stroke-faint">
        {xs.map((x) => (
          <line key={`column-${x}`} x1={x} y1={guideTop} x2={x} y2={guideBottom} />
        ))}
        {ys.map((y) => (
          <line key={`row-${y}`} x1={guideLeft} y1={y} x2={guideRight} y2={y} />
        ))}
      </g>

      <g strokeWidth="11" strokeLinecap="round" className="stroke-highlight opacity-60">
        {highlight.points.map((index) => {
          const { column, row } = pairPosition(index, rowCount)
          return (
            <g key={index}>
              {highlight.vertical && <line x1={xs[column]} y1={originY} x2={xs[column]} y2={ys[row]} />}
              {highlight.horizontal && <line x1={originX} y1={ys[row]} x2={xs[column]} y2={ys[row]} />}
            </g>
          )
        })}
      </g>

      <line
        x1={axisLeft}
        y1={originY}
        x2={width - 14}
        y2={originY}
        strokeWidth="2"
        markerEnd={`url(#${arrowId})`}
        className="stroke-ink"
      />
      <line
        x1={originX}
        y1={axisBottom}
        x2={originX}
        y2="14"
        strokeWidth="2"
        markerEnd={`url(#${arrowId})`}
        className="stroke-ink"
      />
      {unit && (
        <g strokeWidth="1.5" className="stroke-ink">
          {gridSteps(originX, unit, width - 20).map((x) => (
            <line key={`tick-x-${x}`} x1={x} y1={originY - 5} x2={x} y2={originY + 5} />
          ))}
          {gridSteps(originY, unit, height)
            .filter((y) => y > 20)
            .map((y) => (
              <line key={`tick-y-${y}`} x1={originX - 5} y1={y} x2={originX + 5} y2={y} />
            ))}
        </g>
      )}
      {unit && (
        <text x={originX - 8} y={originY + 18} textAnchor="end" className="fill-muted font-math text-[15px]">
          0
        </text>
      )}
      <text x={width - 16} y={originY - 14} textAnchor="end" className="fill-ink font-math-italic text-[28px] italic">
        {first.name}
      </text>
      <text x={originX - 14} y="34" textAnchor="end" className="fill-ink font-math-italic text-[28px] italic">
        {second.name}
      </text>

      {Array.from({ length: total }, (_, index) => {
        const { column, row } = pairPosition(index, rowCount)
        const cx = xs[column]
        const cy = ys[row]
        const x = first.members[column]
        const y = second.members[row]
        const marked = highlight.points.includes(index)
        return (
          <g
            key={index}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={pairPlain(x, y)}
            aria-pressed={marked}
            onClick={() => interactive && onSelectPoint(index)}
            onKeyDown={(event) => interactive && activate(event, () => onSelectPoint(index))}
            className={`group outline-none ${interactive ? 'cursor-pointer' : ''}`}
          >
            <circle
              cx={cx}
              cy={cy}
              r="15"
              className={`fill-highlight-soft transition-opacity ${interactive ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100' : 'opacity-0'}`}
            />
            {index < shown ? (
              <>
                <circle cx={cx} cy={cy} r="5.5" className="animate-fade-in fill-ink" />
                <text
                  x={cx}
                  y={cy - 13}
                  textAnchor="middle"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  style={{ fontSize: layout.labelFont, paintOrder: 'stroke' }}
                  className="animate-fade-in pointer-events-none fill-ink stroke-paper font-math"
                >
                  <PieceSpans pieces={pairPieces(x, y, layout.separator)} shift={layout.labelFont * 0.22} />
                </text>
              </>
            ) : (
              <circle cx={cx} cy={cy} r="4.5" strokeWidth="1.4" className="fill-none stroke-faint" />
            )}
            {marked && <circle cx={cx} cy={cy} r="11" strokeWidth="2" className="fill-none stroke-marker" />}
          </g>
        )
      })}

      {first.members.map((member, index) =>
        chip(member, first, xs[index], originY, highlight.columns.includes(index), () => onSelectColumn(index)),
      )}
      {second.members.map((member, index) =>
        chip(member, second, originX, ys[index], highlight.rows.includes(index), () => onSelectRow(index)),
      )}
    </svg>
  )
}

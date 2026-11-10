import type { KeyboardEvent } from 'react'
import { leafMembers, leafText } from '../../lib/powerSet'

type PowerSetTreeBoardProps = {
  members: string[]
  italic: boolean
  level: number
  listed: number
  active: number | null
  choicesLabel: string
  interactive: boolean
  onSelect: (leaf: number) => void
}

const top = 56
const rootX = 40
const treeWidth = 400

function pathOf(n: number, leaf: number) {
  return Array.from({ length: n + 1 }, (_, level) => leaf >> (n - level))
}

export function PowerSetTreeBoard({
  members,
  italic,
  level,
  listed,
  active,
  choicesLabel,
  interactive,
  onSelect,
}: PowerSetTreeBoardProps) {
  const n = members.length
  const leaves = 2 ** n
  const dense = n >= 4
  const height = dense ? 470 : 380
  const rowHeight = (height - top - 24) / leaves
  const columnWidth = treeWidth / n
  const leafFont = dense ? 15 : 19
  const edgeFont = dense ? 13 : 16
  const memberClass = italic ? 'font-math-italic italic' : 'font-math'
  const path = active === null ? null : pathOf(n, active)
  const grown = level === n

  const x = (depth: number) => rootX + depth * columnWidth
  const y = (depth: number, index: number) => {
    const span = 2 ** (n - depth)
    return top + (index * span + span / 2) * rowHeight
  }

  const edges = Array.from({ length: level }, (_, depth) =>
    Array.from({ length: 2 ** depth }, (_, parent) =>
      [0, 1].map((choice) => {
        const child = 2 * parent + choice
        return {
          key: `${depth}-${child}`,
          depth,
          inside: choice === 1,
          x1: x(depth),
          y1: y(depth, parent),
          x2: x(depth + 1),
          y2: y(depth + 1, child),
          onPath: path !== null && path[depth] === parent && path[depth + 1] === child,
          labeled: choice === 1 && rowHeight * 2 ** (n - depth - 1) >= 20,
        }
      }),
    ).flat(),
  ).flat()

  const nodes = Array.from({ length: Math.min(level + 1, n) }, (_, depth) =>
    Array.from({ length: 2 ** depth }, (_, index) => ({ key: `${depth}-${index}`, cx: x(depth), cy: y(depth, index) })),
  ).flat()

  function handleKeyDown(event: KeyboardEvent, leaf: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(leaf)
  }

  function setLabel(items: string[]) {
    if (items.length === 0) return '∅'
    return (
      <>
        {'{'}
        {items.map((item, index) => (
          <tspan key={item} className={memberClass}>
            {index > 0 && <tspan className="font-math not-italic">, </tspan>}
            {item}
          </tspan>
        ))}
        {'}'}
      </>
    )
  }

  return (
    <svg viewBox={`0 0 640 ${height}`} className="block h-auto w-full">
      {members.map((member, index) => {
        const cx = (x(index) + x(index + 1)) / 2
        return (
          <g key={member}>
            <text x={cx} y="26" textAnchor="middle" className={`fill-ink text-[22px] ${memberClass}`}>
              {member}
            </text>
            {index < level && (
              <text x={cx} y="46" textAnchor="middle" className="animate-fade-in fill-muted font-hand text-[19px]">
                {choicesLabel}
              </text>
            )}
          </g>
        )
      })}

      {edges
        .filter((edge) => edge.onPath)
        .map((edge) => (
          <line
            key={`path-${edge.key}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            strokeWidth="9"
            strokeLinecap="round"
            className="stroke-highlight"
          />
        ))}

      {edges.map((edge) => (
        <g key={edge.key} className="animate-fade-in">
          <line
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            strokeWidth={edge.inside ? 2 : 1.6}
            strokeDasharray={edge.inside ? undefined : '5 5'}
            className={edge.inside ? 'stroke-ink' : 'stroke-faint'}
          />
          {edge.labeled && (
            <text
              x={(edge.x1 + edge.x2) / 2 - 6}
              y={(edge.y1 + edge.y2) / 2 + 16}
              style={{ fontSize: edgeFont }}
              className={`fill-ink ${memberClass}`}
            >
              {members[edge.depth]}
            </text>
          )}
        </g>
      ))}

      {nodes.map((node) => (
        <circle
          key={node.key}
          cx={node.cx}
          cy={node.cy}
          r="5"
          strokeWidth="2"
          className="animate-fade-in fill-paper stroke-ink"
        />
      ))}

      {grown &&
        Array.from({ length: leaves }, (_, leaf) => {
          const cx = x(n)
          const cy = y(n, leaf)
          const items = leafMembers(members, leaf)
          const text = leafText(items)
          const shown = leaf < listed
          const current = leaf === active
          return (
            <g
              key={leaf}
              role="button"
              tabIndex={interactive ? 0 : -1}
              aria-label={text}
              aria-pressed={current}
              onClick={() => interactive && onSelect(leaf)}
              onKeyDown={(event) => interactive && handleKeyDown(event, leaf)}
              className={`group outline-none ${interactive ? 'cursor-pointer' : ''}`}
            >
              <rect
                x={cx - 8}
                y={cy - rowHeight / 2 + 1}
                width="176"
                height={rowHeight - 2}
                rx="4"
                className={`fill-highlight-soft transition-opacity ${interactive ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100' : 'opacity-0'}`}
              />
              {current && (
                <rect
                  x={cx + 8}
                  y={cy - leafFont * 0.75}
                  width={text.length * leafFont * 0.5 + 16}
                  height={leafFont * 1.5}
                  rx="4"
                  className="fill-highlight opacity-90"
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r="5"
                strokeWidth="2"
                className={`stroke-ink ${shown ? 'fill-ink' : 'fill-paper'}`}
              />
              {shown && (
                <text
                  x={cx + 16}
                  y={cy + leafFont * 0.35}
                  style={{ fontSize: leafFont }}
                  className="animate-fade-in pointer-events-none fill-ink font-math"
                >
                  {setLabel(items)}
                </text>
              )}
            </g>
          )
        })}
    </svg>
  )
}

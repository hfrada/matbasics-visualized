import type { KeyboardEvent } from 'react'

export type HasseEdgeTone = 'plain' | 'now' | 'path'
export type HasseEdge = { from: number; to: number; shortcut: boolean; tone: HasseEdgeTone }
export type HasseNodeTone = 'focus' | 'lit' | 'ring'

type HasseDiagramBoardProps = {
  labels: string[]
  levels: number[]
  edges: HasseEdge[]
  loops: number[]
  arrows: boolean
  tones: Partial<Record<number, HasseNodeTone>>
  interactive: boolean
  onPick: (index: number) => void
  ariaLabel: string
}

type Point = { x: number; y: number }

const width = 680
const centerX = 340
const nodeHeight = 30
const head = 10

const fixed = (value: number) => Number(value.toFixed(2))
const nodeWidth = (label: string) => Math.max(34, label.length * 9.5 + 16)

function headPath(tip: Point, direction: Point) {
  const corner = (turn: number) => {
    const x = direction.x * Math.cos(turn) - direction.y * Math.sin(turn)
    const y = direction.x * Math.sin(turn) + direction.y * Math.cos(turn)
    return `${fixed(tip.x - head * x)} ${fixed(tip.y - head * y)}`
  }
  return `M${fixed(tip.x)} ${fixed(tip.y)} L${corner(0.38)} L${corner(-0.38)} Z`
}

function distanceToSegment(point: Point, from: Point, to: Point) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const t = Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(point.x - from.x - t * dx, point.y - from.y - t * dy)
}

function edgeExit(center: Point, toward: Point, label: string) {
  const dx = toward.x - center.x
  const dy = toward.y - center.y
  const halfWidth = nodeWidth(label) / 2 + 2
  const halfHeight = nodeHeight / 2 + 2
  const scale = Math.min(halfWidth / Math.abs(dx || 1e-9), halfHeight / Math.abs(dy || 1e-9))
  return { x: center.x + dx * scale, y: center.y + dy * scale }
}

export function HasseDiagramBoard({ labels, levels, edges, loops, arrows, tones, interactive, onPick, ariaLabel }: HasseDiagramBoardProps) {
  const top = Math.max(0, ...levels)
  const levelGap = top === 0 ? 0 : Math.min(86, 240 / top)
  const height = top * levelGap + 110
  const middleY = height / 2
  const points: Point[] = labels.map((_, index) => {
    const row = labels.map((__, other) => other).filter((other) => levels[other] === levels[index])
    const slot = row.indexOf(index)
    const gap = row.length === 1 ? 0 : Math.min(200, 560 / (row.length - 1))
    return { x: centerX + (slot - (row.length - 1) / 2) * gap, y: middleY + (top * levelGap) / 2 - levels[index] * levelGap }
  })

  function edgeGeometry(edge: HasseEdge) {
    const from = points[edge.from]
    const to = points[edge.to]
    const blocked = points.some((point, index) => index !== edge.from && index !== edge.to && distanceToSegment(point, from, to) < 26)
    const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
    const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
    const normal = { x: (to.y - from.y) / length, y: -(to.x - from.x) / length }
    const bulge = blocked ? (levels[edge.from] % 2 === 0 ? -1 : 1) * (20 + 0.3 * length) : 0
    const control = { x: middle.x + normal.x * bulge, y: middle.y + normal.y * bulge }
    const start = edgeExit(from, control, labels[edge.from])
    const tip = edgeExit(to, control, labels[edge.to])
    const tipLength = Math.hypot(tip.x - control.x, tip.y - control.y) || 1
    const direction = { x: (tip.x - control.x) / tipLength, y: (tip.y - control.y) / tipLength }
    const end = arrows ? { x: tip.x - direction.x * head * 0.7, y: tip.y - direction.y * head * 0.7 } : tip
    return {
      line: `M${fixed(start.x)} ${fixed(start.y)} Q${fixed(control.x)} ${fixed(control.y)} ${fixed(end.x)} ${fixed(end.y)}`,
      head: headPath(tip, direction),
    }
  }

  function loopPath(index: number) {
    const { x, y } = points[index]
    const left = x - nodeWidth(labels[index]) / 2
    const startY = y - 6
    const endY = y + 6
    return {
      line: `M${fixed(left)} ${fixed(startY)} C${fixed(left - 26)} ${fixed(startY - 22)} ${fixed(left - 30)} ${fixed(endY + 10)} ${fixed(left - 7)} ${fixed(endY + 1)}`,
      head: headPath({ x: left - 1, y: endY - 1 }, { x: 0.9, y: -0.44 }),
    }
  }

  function onKey(event: KeyboardEvent, index: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onPick(index)
  }

  const ordered = [...edges].sort((p, q) => Number(p.tone !== 'plain') - Number(q.tone !== 'plain'))
  const strokeClass: Record<HasseEdgeTone, string> = { plain: 'stroke-ink', now: 'stroke-marker', path: 'stroke-ink' }
  const fillClass: Record<HasseEdgeTone, string> = { plain: 'fill-ink', now: 'fill-marker', path: 'fill-ink' }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {loops.map((index) => {
        const loop = loopPath(index)
        return (
          <g key={`loop${index}`} data-loop={index}>
            <path d={loop.line} strokeWidth={1.5} className="fill-none stroke-ink" />
            <path d={loop.head} className="fill-ink" />
          </g>
        )
      })}
      {ordered.map((edge) => {
        const geometry = edgeGeometry(edge)
        return (
          <g key={`${edge.from}-${edge.to}`} data-hasse-edge={`${edge.from}-${edge.to}`} data-shortcut={edge.shortcut || undefined} data-tone={edge.tone}>
            <path
              d={geometry.line}
              strokeWidth={edge.tone === 'path' ? 2.8 : edge.tone === 'now' ? 2.2 : 1.6}
              strokeDasharray={edge.tone === 'now' ? '6 4' : undefined}
              className={`fill-none ${strokeClass[edge.tone]}`}
            />
            {arrows && <path d={geometry.head} className={fillClass[edge.tone]} />}
          </g>
        )
      })}
      {labels.map((label, index) => {
        const { x, y } = points[index]
        const size = nodeWidth(label)
        const tone = tones[index]
        const lit = tone === 'lit' || tone === 'focus' || tone === 'ring'
        return (
          <g
            key={index}
            data-hasse-node={index}
            data-level={levels[index]}
            data-node-tone={tone}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? label : undefined}
            aria-pressed={interactive ? tone === 'focus' : undefined}
            onClick={interactive ? () => onPick(index) : undefined}
            onKeyDown={interactive ? (event) => onKey(event, index) : undefined}
            className={interactive ? 'cursor-pointer outline-none' : ''}
          >
            {tone === 'ring' && (
              <rect x={x - size / 2 - 6} y={y - nodeHeight / 2 - 6} width={size + 12} height={nodeHeight + 12} rx={(nodeHeight + 12) / 2} strokeWidth={2.4} className="fill-none stroke-ink" />
            )}
            <rect
              x={x - size / 2}
              y={y - nodeHeight / 2}
              width={size}
              height={nodeHeight}
              rx={nodeHeight / 2}
              strokeWidth={tone === 'focus' ? 2.6 : 1.6}
              className={`${lit ? 'fill-highlight' : 'fill-paper'} ${tone === 'focus' ? 'stroke-marker' : 'stroke-ink'}`}
            />
            <text x={x} y={y + 6} textAnchor="middle" className={`fill-ink font-math text-[17px] ${lit ? 'dark:fill-paper' : ''}`}>
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

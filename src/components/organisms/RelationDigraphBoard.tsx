import type { IndexPair, RelationMatrix } from '../../lib/relationProperties'

export type DigraphMarkTone = 'now' | 'need' | 'missing'
export type DigraphMark = { pair: IndexPair; tone: DigraphMarkTone }

type RelationDigraphBoardProps = {
  name: string
  labels: string[]
  matrix: RelationMatrix
  marks: DigraphMark[]
  litNodes: number[]
  ariaLabel: string
}

type Point = { x: number; y: number }

const width = 680
const height = 340
const graphCenter: Point = { x: 186, y: 180 }
const graphRadius = 112
const nodeRadius = 17
const gridCenter: Point = { x: 566, y: 166 }
const head = 10

const keyOf = ([i, j]: IndexPair) => `${i}-${j}`
const unit = (from: Point, to: Point) => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
}
const along = (point: Point, direction: Point, distance: number) => ({ x: point.x + direction.x * distance, y: point.y + direction.y * distance })
const fixed = (value: number) => Number(value.toFixed(2))

function nodePoint(index: number, count: number): Point {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
  return { x: graphCenter.x + graphRadius * Math.cos(angle), y: graphCenter.y + graphRadius * Math.sin(angle) }
}

function headPath(tip: Point, direction: Point) {
  const corner = (turn: number) => {
    const cos = Math.cos(turn)
    const sin = Math.sin(turn)
    const x = direction.x * cos - direction.y * sin
    const y = direction.x * sin + direction.y * cos
    return `${fixed(tip.x - head * x)} ${fixed(tip.y - head * y)}`
  }
  return `M${fixed(tip.x)} ${fixed(tip.y)} L${corner(0.38)} L${corner(-0.38)} Z`
}

function edgeGeometry(from: Point, to: Point, curved: boolean) {
  const direction = unit(from, to)
  const normal = { x: direction.y, y: -direction.x }
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  const control = curved ? along(middle, normal, 26) : middle
  const start = along(from, unit(from, control), nodeRadius)
  const tip = along(to, unit(to, control), nodeRadius + 1)
  const end = unit(control, tip)
  const lineEnd = along(tip, end, -head * 0.7)
  return {
    line: curved
      ? `M${fixed(start.x)} ${fixed(start.y)} Q${fixed(control.x)} ${fixed(control.y)} ${fixed(lineEnd.x)} ${fixed(lineEnd.y)}`
      : `M${fixed(start.x)} ${fixed(start.y)} L${fixed(lineEnd.x)} ${fixed(lineEnd.y)}`,
    head: headPath(tip, end),
  }
}

function loopGeometry(node: Point) {
  const outward = unit(graphCenter, node)
  const loopRadius = 12
  const distance = nodeRadius + 8
  const center = along(node, outward, distance)
  const towardNode = Math.atan2(-outward.y, -outward.x)
  const half = Math.acos((distance ** 2 + loopRadius ** 2 - nodeRadius ** 2) / (2 * distance * loopRadius))
  const points = Array.from({ length: 25 }, (_, index) => {
    const angle = towardNode + half + ((2 * Math.PI - 2 * half) * index) / 24
    return { x: center.x + loopRadius * Math.cos(angle), y: center.y + loopRadius * Math.sin(angle) }
  })
  const tip = points[points.length - 1]
  const direction = unit(points[points.length - 3], tip)
  const lineEnd = along(tip, direction, -head * 0.7)
  return {
    line: `M${points
      .slice(0, -2)
      .map((point) => `${fixed(point.x)} ${fixed(point.y)}`)
      .join(' L')} L${fixed(lineEnd.x)} ${fixed(lineEnd.y)}`,
    head: headPath(tip, direction),
  }
}

export function RelationDigraphBoard({ name, labels, matrix, marks, litNodes, ariaLabel }: RelationDigraphBoardProps) {
  const count = labels.length
  const nodes = labels.map((_, index) => nodePoint(index, count))
  const step = count === 1 ? 0 : Math.min(44, 176 / (count - 1))
  const columnX = (i: number) => gridCenter.x + (i - (count - 1) / 2) * step
  const rowY = (j: number) => gridCenter.y + ((count - 1) / 2 - j) * step
  const axisLeft = columnX(0) - 28
  const axisBottom = rowY(0) + 28
  const markOf = (pair: IndexPair) => marks.find((mark) => keyOf(mark.pair) === keyOf(pair))?.tone ?? null
  const ghosts = marks.filter((mark) => mark.tone === 'missing').map((mark) => mark.pair)
  const drawn = (i: number, j: number) => matrix[i][j] || ghosts.some(([a, b]) => a === i && b === j)
  const edges: IndexPair[] = matrix.flatMap((row, i) => row.flatMap((inR, j) => (inR ? [[i, j] as IndexPair] : [])))
  const lit = (index: number) => litNodes.includes(index)

  function edgePaths([i, j]: IndexPair) {
    return i === j ? loopGeometry(nodes[i]) : edgeGeometry(nodes[i], nodes[j], drawn(j, i))
  }

  const stroke = (tone: DigraphMarkTone | null) => (tone === 'now' ? 'stroke-marker' : 'stroke-ink')
  const fill = (tone: DigraphMarkTone | null) => (tone === 'now' ? 'fill-marker' : 'fill-ink')
  const ordered = [...edges].sort((p, q) => Number(markOf(p) !== null) - Number(markOf(q) !== null))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <g data-graph>
        <text x={24} y={40} className="fill-ink font-math-italic text-[21px] italic">
          {name}
        </text>
        {ordered.map((pair) => {
          const tone = markOf(pair)
          const paths = edgePaths(pair)
          return (
            <g key={keyOf(pair)} data-edge={keyOf(pair)} data-tone={tone ?? undefined}>
              <path
                d={paths.line}
                strokeWidth={tone === 'need' ? 2.8 : tone === 'now' ? 2.2 : 1.6}
                strokeDasharray={tone === 'now' ? '6 4' : undefined}
                className={`fill-none ${stroke(tone)}`}
              />
              <path d={paths.head} className={fill(tone)} />
            </g>
          )
        })}
        {ghosts.map((pair) => {
          const paths = edgePaths(pair)
          return (
            <g key={keyOf(pair)} data-ghost={keyOf(pair)}>
              <path d={paths.line} strokeWidth={2} strokeDasharray="3 4" className="fill-none stroke-marker" />
              <path d={paths.head} className="fill-none stroke-marker" strokeWidth={1.4} />
            </g>
          )
        })}
        {nodes.map((node, index) => (
          <g key={index} data-node={index} data-lit={lit(index) || undefined}>
            <circle cx={node.x} cy={node.y} r={nodeRadius} strokeWidth={1.6} className={`stroke-ink ${lit(index) ? 'fill-highlight' : 'fill-paper'}`} />
            <text x={node.x} y={node.y + 6} textAnchor="middle" className={`fill-ink font-math text-[18px] ${lit(index) ? 'dark:fill-paper' : ''}`}>
              {labels[index]}
            </text>
          </g>
        ))}
      </g>
      <g data-grid>
        <text x={gridCenter.x} y={30} textAnchor="middle" className="fill-ink font-math text-[20px]">
          <tspan className="font-math-italic italic">{name}</tspan> × <tspan className="font-math-italic italic">{name}</tspan>
        </text>
        {labels.map((_, i) => (
          <line key={`c${i}`} x1={columnX(i)} x2={columnX(i)} y1={axisBottom} y2={rowY(count - 1) - 10} strokeDasharray="3 4" className="stroke-faint" />
        ))}
        {labels.map((_, j) => (
          <line key={`r${j}`} x1={axisLeft} x2={columnX(count - 1) + 10} y1={rowY(j)} y2={rowY(j)} strokeDasharray="3 4" className="stroke-faint" />
        ))}
        <line
          data-diagonal
          x1={columnX(0) - 16}
          y1={rowY(0) + 16}
          x2={columnX(count - 1) + 16}
          y2={rowY(count - 1) - 16}
          strokeWidth={1.4}
          strokeDasharray="8 5"
          className="stroke-muted"
        />
        <line x1={axisLeft} y1={axisBottom} x2={columnX(count - 1) + 24} y2={axisBottom} strokeWidth={1.6} className="stroke-ink" />
        <line x1={axisLeft} y1={axisBottom} x2={axisLeft} y2={rowY(count - 1) - 24} strokeWidth={1.6} className="stroke-ink" />
        {labels.map((label, i) => (
          <text key={`x${i}`} data-axis-x={i} data-lit={lit(i) || undefined} x={columnX(i)} y={axisBottom + 24} textAnchor="middle" className="fill-ink font-math text-[17px]">
            {label}
          </text>
        ))}
        {labels.map((label, j) => (
          <text key={`y${j}`} data-axis-y={j} data-lit={lit(j) || undefined} x={axisLeft - 12} y={rowY(j) + 6} textAnchor="end" className="fill-ink font-math text-[17px]">
            {label}
          </text>
        ))}
        {matrix.flatMap((row, i) =>
          row.map((inR, j) => {
            const cx = columnX(i)
            const cy = rowY(j)
            const pair: IndexPair = [i, j]
            const tone = markOf(pair)
            return (
              <g
                key={keyOf(pair)}
                data-cell={keyOf(pair)}
                data-in={inR}
                data-tone={tone ?? undefined}
              >
                {inR ? (
                  <>
                    <circle cx={cx} cy={cy} r={10} className="fill-highlight" />
                    <circle cx={cx} cy={cy} r={5} className="fill-ink" />
                  </>
                ) : (
                  <circle cx={cx} cy={cy} r={4.5} strokeWidth={1.5} className="fill-paper stroke-faint" />
                )}
                {tone === 'now' && <circle cx={cx} cy={cy} r={14} strokeWidth={2.4} className="fill-none stroke-marker" />}
                {tone === 'need' && <circle cx={cx} cy={cy} r={14} strokeWidth={2.6} className="fill-none stroke-ink" />}
                {tone === 'missing' && <circle cx={cx} cy={cy} r={14} strokeWidth={2.2} strokeDasharray="3 3" className="fill-none stroke-marker" />}
              </g>
            )
          }),
        )}
      </g>
    </svg>
  )
}

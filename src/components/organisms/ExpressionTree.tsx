import { connectiveGlyph, evaluate, partsOf, type LogicExpression, type TruthAssignment } from '../../lib/logicExpression'

type ExpressionTreeProps = {
  expression: LogicExpression
  stepOf: (expression: LogicExpression) => number
  current: number | null
  comparing: boolean
  values: TruthAssignment | null
  truthLabel: (value: boolean) => string
  label: string
  caption?: string
}

type PlacedNode = {
  expression: LogicExpression
  depth: number
  x: number
  parent: PlacedNode | null
  children: PlacedNode[]
}

const unit = 64
const level = 58
const padX = 48
const padY = 30
const radius = 19
const letterRadius = 17

function placeTree(expression: LogicExpression) {
  const placed: PlacedNode[] = []
  let leaves = 0
  const place = (node: LogicExpression, depth: number, parent: PlacedNode | null): PlacedNode => {
    const item: PlacedNode = { expression: node, depth, x: 0, parent, children: [] }
    item.children = partsOf(node).map((part) => place(part, depth + 1, item))
    item.x = item.children.length
      ? item.children.reduce((sum, child) => sum + child.x, 0) / item.children.length
      : leaves++
    placed.push(item)
    return item
  }
  place(expression, 0, null)
  const depth = Math.max(...placed.map((item) => item.depth))
  return { placed, width: (leaves - 1) * unit + padX * 2, height: depth * level + padY * 2 }
}

const centerX = (item: PlacedNode) => padX + item.x * unit
const centerY = (item: PlacedNode) => padY + item.depth * level

export function ExpressionTree({
  expression,
  stepOf,
  current,
  comparing,
  values,
  truthLabel,
  label,
  caption,
}: ExpressionTreeProps) {
  const { placed, width, height } = placeTree(expression)
  const statusOf = (item: PlacedNode) => {
    if (item.expression.kind === 'letter') return 'idle'
    const step = stepOf(item.expression)
    if ((current !== null && step === current) || (comparing && item.depth === 0)) return 'now'
    if (current !== null && step > current) return 'pending'
    return 'idle'
  }

  return (
    <figure className="m-0 flex max-w-full flex-col items-center gap-1">
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block h-auto max-w-full overflow-visible"
      >
        {placed.flatMap((item) =>
          item.children.map((child) => {
            const dx = centerX(child) - centerX(item)
            const dy = centerY(child) - centerY(item)
            const length = Math.hypot(dx, dy)
            const start = radius + 2
            const end = (child.expression.kind === 'letter' ? letterRadius : radius) + 2
            const status = statusOf(item)
            const on = status === 'now' && !comparing
            return (
              <line
                key={`${centerX(item)}-${centerY(item)}-${centerX(child)}-${centerY(child)}`}
                data-on={on || undefined}
                x1={centerX(item) + (dx / length) * start}
                y1={centerY(item) + (dy / length) * start}
                x2={centerX(child) - (dx / length) * end}
                y2={centerY(child) - (dy / length) * end}
                strokeWidth={on ? 2.6 : 1.6}
                className={`transition-opacity duration-300 ${on ? 'stroke-marker' : 'stroke-ink'} ${status === 'pending' ? 'opacity-30' : ''}`}
              />
            )
          }),
        )}
        {placed.map((item) => {
          const x = centerX(item)
          const y = centerY(item)
          const value = values ? evaluate(item.expression, values) : null
          const towardRight = item.parent !== null && centerX(item.parent) <= x
          const isLetter = item.expression.kind === 'letter'
          const offset = isLetter ? letterRadius : radius + 4
          const badge = value !== null ? truthLabel(value) : isLetter ? '' : String(stepOf(item.expression) + 1)
          const badgeTone = value === null ? 'fill-muted' : value ? 'fill-ink' : 'fill-marker'
          const status = statusOf(item)
          const glyphTone = value === true ? 'fill-ink dark:fill-paper' : value === false ? 'fill-marker' : 'fill-ink'
          return (
            <g
              key={`${x}-${y}`}
              data-tree-node={isLetter ? 'letter' : 'connective'}
              data-status={status}
              data-value={value === null ? undefined : String(value)}
              className={`transition-opacity duration-300 ${status === 'pending' ? 'opacity-30' : ''}`}
            >
              {item.expression.kind === 'letter' ? (
                <>
                  <rect
                    x={x - 13}
                    y={y - 16}
                    width={26}
                    height={32}
                    rx={4}
                    className={`transition-[fill] duration-300 ${value === true ? 'fill-highlight' : 'fill-transparent'}`}
                  />
                  <text x={x} y={y} dy=".35em" textAnchor="middle" className={`font-math-italic text-[23px] italic ${glyphTone}`}>
                    {item.expression.name}
                  </text>
                </>
              ) : (
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    strokeWidth={status === 'now' || value === false ? 2.6 : 2}
                    className={`transition-[fill,stroke] duration-300 ${value === true ? 'fill-highlight' : status === 'now' ? 'fill-highlight-soft' : 'fill-paper'} ${status === 'now' || value === false ? 'stroke-marker' : 'stroke-ink'}`}
                  />
                  <text x={x} y={y} dy=".35em" textAnchor="middle" className={`font-math text-[21px] ${glyphTone}`}>
                    {connectiveGlyph[item.expression.kind]}
                  </text>
                </>
              )}
              {badge && (
                <text
                  data-badge
                  x={towardRight ? x + offset : x - offset}
                  y={y - 12}
                  textAnchor={towardRight ? 'start' : 'end'}
                  className={`font-hand text-xl font-bold ${badgeTone}`}
                >
                  {badge}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {caption && <figcaption className="font-hand text-xl leading-none text-muted">{caption}</figcaption>}
    </figure>
  )
}

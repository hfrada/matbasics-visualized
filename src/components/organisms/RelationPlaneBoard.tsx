import { multiples, range, type Coordinate, type PlaneView } from '../../lib/relation'

export type PlaneRegion = { x: Coordinate; y: Coordinate }
export type PlaneBand = { from: Coordinate; to: Coordinate; gapAtFrom?: boolean }
export type PlaneVertical = { x: number; tone: 'probe' | 'none' | 'zero' }
export type PlaneProbe = { at: Coordinate; holds: boolean; label: string }
export type PlaneNote = { x: number; text: string }

type RelationPlaneBoardProps = {
  view: PlaneView
  axisNames: [string, string]
  litX: number[]
  litY: number[]
  lattice: Coordinate[]
  dots: Coordinate[]
  misses: Coordinate[]
  rings: Coordinate[]
  regions: PlaneRegion[]
  bands: PlaneBand[]
  curve: boolean
  openDots: Coordinate[]
  shadows: PlaneBand[]
  verticals: PlaneVertical[]
  probe: PlaneProbe | null
  note: PlaneNote | null
  axisLabel: (value: number) => string
  ariaLabel: string
}

type Box = [number, number, number, number]

const width = 680
const height = 340
const plotHeight = 280
const top = 24
const bandGap = 8
const textBox = (text: string) => text.length * 8.5 + 4
const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]
const key = ([x, y]: Coordinate) => `${x},${y}`

const verticalClass: Record<PlaneVertical['tone'], { stroke: string; width: number }> = {
  probe: { stroke: 'stroke-ink', width: 1.4 },
  none: { stroke: 'stroke-marker', width: 1.4 },
  zero: { stroke: 'stroke-marker', width: 2.2 },
}

export function RelationPlaneBoard({
  view,
  axisNames,
  litX,
  litY,
  lattice,
  dots,
  misses,
  rings,
  regions,
  bands,
  curve,
  openDots,
  shadows,
  verticals,
  probe,
  note,
  axisLabel,
  ariaLabel,
}: RelationPlaneBoardProps) {
  const plotWidth = view.width
  const left = (width - plotWidth) / 2 + 10
  const px = (x: number) => left + ((x - view.x[0]) / (view.x[1] - view.x[0])) * plotWidth
  const py = (y: number) => top + plotHeight - ((y - view.y[0]) / (view.y[1] - view.y[0])) * plotHeight
  const xTicks = multiples(view.x[0], view.x[1], view.xStep)
  const yTicks = multiples(view.y[0], view.y[1], view.yStep)
  const x0 = px(0)
  const y0 = py(0)

  function bandEnds({ from, to, gapAtFrom }: PlaneBand) {
    let x1 = px(from[0])
    let y1 = py(from[1])
    const x2 = px(to[0])
    const y2 = py(to[1])
    if (gapAtFrom) {
      const length = Math.hypot(x2 - x1, y2 - y1) || 1
      x1 += ((x2 - x1) / length) * bandGap
      y1 += ((y2 - y1) / length) * bandGap
    }
    return { x1, y1, x2, y2 }
  }

  function probeSpot(target: PlaneProbe) {
    const cx = px(target.at[0])
    const cy = py(target.at[1])
    const labelWidth = target.label.length * 8.6
    const blocked: Box[] = [
      [left + plotWidth + 6, y0 - 28, left + plotWidth + 28, y0 - 4],
      [x0 + 6, top - 20, x0 + 28, top + 4],
      ...xTicks.map((value): Box => {
        const size = textBox(axisLabel(value))
        return [px(value) - size / 2, y0 + 5, px(value) + size / 2, y0 + 24]
      }),
      ...yTicks.map((value): Box => [x0 - 8 - textBox(axisLabel(value)), py(value) - 9, x0 - 6, py(value) + 7]),
    ]
    const candidates = [
      [1, -1],
      [-1, -1],
      [1, 1],
      [-1, 1],
      [1, 0],
      [-1, 0],
    ].map(([sx, sy]) => {
      const lx = cx + sx * (sy === 0 ? 15 : 13)
      const ly = sy < 0 ? cy - 13 : sy > 0 ? cy + 26 : cy + 5
      const box: Box = sx > 0 ? [lx, ly - 13, lx + labelWidth, ly + 3] : [lx - labelWidth, ly - 13, lx, ly + 3]
      return { lx, ly, anchor: sx > 0 ? ('start' as const) : ('end' as const), box }
    })
    const fits = (box: Box) => box[0] >= 4 && box[2] <= width - 4 && box[1] >= top - 14 && box[3] <= top + plotHeight + 14
    return (
      candidates.find((candidate) => fits(candidate.box) && !blocked.some((other) => overlaps(candidate.box, other))) ??
      candidates.find((candidate) => fits(candidate.box)) ??
      candidates[0]
    )
  }

  const curvePath = () => {
    const branch = (sign: number) =>
      range(0, 75)
        .map((k) => {
          const x = sign * (0.25 + k * 0.05)
          return `${px(x)} ${py(1 / x)}`
        })
        .join(' L')
    return `M${branch(1)} M${branch(-1)}`
  }

  const spot = probe ? probeSpot(probe) : null
  const noteRight = note !== null && px(note.x) > left + plotWidth * 0.65

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {xTicks.map((value) => (
        <line key={`gx${value}`} x1={px(value)} x2={px(value)} y1={top} y2={top + plotHeight} strokeWidth={1} className="stroke-grid" />
      ))}
      {yTicks.map((value) => (
        <line key={`gy${value}`} x1={left} x2={left + plotWidth} y1={py(value)} y2={py(value)} strokeWidth={1} className="stroke-grid" />
      ))}
      <g data-axes>
        <line x1={left} x2={left + plotWidth + 12} y1={y0} y2={y0} strokeWidth={1.6} className="stroke-ink" />
        <path d={`M${left + plotWidth + 18} ${y0} l-9 -4.5 v9 Z`} className="fill-ink" />
        <line x1={x0} x2={x0} y1={top + plotHeight} y2={top - 6} strokeWidth={1.6} className="stroke-ink" />
        <path d={`M${x0} ${top - 12} l-4.5 9 h9 Z`} className="fill-ink" />
        <text x={left + plotWidth + 10} y={y0 - 10} className="fill-ink font-math-italic text-[18px] italic">
          {axisNames[0]}
        </text>
        <text x={x0 + 10} y={top - 2} className="fill-ink font-math-italic text-[18px] italic">
          {axisNames[1]}
        </text>
        {xTicks
          .filter((value) => value !== 0)
          .map((value) => {
            const label = axisLabel(value)
            const lit = litX.includes(value)
            return (
              <g key={`tx${value}`} data-tick-x={value} data-lit={lit || undefined}>
                {lit && <rect x={px(value) - label.length * 4.5 - 3} y={y0 + 5} width={label.length * 9 + 6} height={18} rx={3} className="fill-highlight" />}
                <line x1={px(value)} x2={px(value)} y1={y0 - 4} y2={y0 + 4} strokeWidth={1.3} className="stroke-ink" />
                <text
                  x={px(value)}
                  y={y0 + 19}
                  textAnchor="middle"
                  className={`font-math text-[14px] ${lit ? 'fill-ink font-bold dark:fill-paper' : 'fill-muted'}`}
                >
                  {label}
                </text>
              </g>
            )
          })}
        {yTicks
          .filter((value) => value !== 0)
          .map((value) => {
            const label = axisLabel(value)
            const lit = litY.includes(value)
            return (
              <g key={`ty${value}`} data-tick-y={value} data-lit={lit || undefined}>
                {lit && (
                  <rect x={x0 - 8 - label.length * 9 - 3} y={py(value) - 10} width={label.length * 9 + 6} height={18} rx={3} className="fill-highlight" />
                )}
                <line x1={x0 - 4} x2={x0 + 4} y1={py(value)} y2={py(value)} strokeWidth={1.3} className="stroke-ink" />
                <text
                  x={x0 - 8}
                  y={py(value) + 5}
                  textAnchor="end"
                  className={`font-math text-[14px] ${lit ? 'fill-ink font-bold dark:fill-paper' : 'fill-muted'}`}
                >
                  {label}
                </text>
              </g>
            )
          })}
        <text x={x0 - 8} y={y0 + 19} textAnchor="end" className="fill-muted font-math text-[14px]">
          0
        </text>
      </g>
      {regions.map((region) => (
        <rect
          key={`${key(region.x)}|${key(region.y)}`}
          data-region={`${key(region.x)}|${key(region.y)}`}
          x={Math.min(px(region.x[0]), px(region.x[1]))}
          y={Math.min(py(region.y[0]), py(region.y[1]))}
          width={Math.abs(px(region.x[1]) - px(region.x[0]))}
          height={Math.abs(py(region.y[1]) - py(region.y[0]))}
          className="fill-highlight opacity-40"
        />
      ))}
      {bands.map((band) => {
        const ends = bandEnds(band)
        return (
          <line
            key={`${key(band.from)}|${key(band.to)}`}
            data-band={`${key(band.from)}|${key(band.to)}`}
            {...ends}
            strokeWidth={7}
            strokeLinecap="round"
            className="stroke-highlight"
          />
        )
      })}
      {curve && (
        <g data-curve>
          <path d={curvePath()} strokeWidth={7} strokeLinecap="round" className="fill-none stroke-highlight" />
          <path d={curvePath()} strokeWidth={1.8} className="fill-none stroke-ink" />
        </g>
      )}
      {lattice.map((point) => (
        <circle key={key(point)} data-lattice={key(point)} cx={px(point[0])} cy={py(point[1])} r={2.2} className="fill-faint" />
      ))}
      {verticals.map((vertical) => (
        <line
          key={`${vertical.tone}${vertical.x}`}
          data-vertical={vertical.tone}
          data-x={vertical.x}
          x1={px(vertical.x)}
          x2={px(vertical.x)}
          y1={top}
          y2={top + plotHeight}
          strokeWidth={verticalClass[vertical.tone].width}
          strokeDasharray="6 4"
          className={verticalClass[vertical.tone].stroke}
        />
      ))}
      {shadows.map((shadow) => (
        <line
          key={`${key(shadow.from)}|${key(shadow.to)}`}
          data-shadow={`${key(shadow.from)}|${key(shadow.to)}`}
          x1={px(shadow.from[0])}
          y1={py(shadow.from[1])}
          x2={px(shadow.to[0])}
          y2={py(shadow.to[1])}
          strokeWidth={1.1}
          strokeDasharray="3 3"
          className="stroke-muted"
        />
      ))}
      {dots.map((point) => (
        <g key={key(point)} data-dot={key(point)}>
          <circle cx={px(point[0])} cy={py(point[1])} r={7.5} className="fill-highlight" />
          <circle cx={px(point[0])} cy={py(point[1])} r={3.6} className="fill-ink" />
        </g>
      ))}
      {misses.map((point) => {
        const cx = px(point[0])
        const cy = py(point[1])
        return (
          <path
            key={key(point)}
            data-miss={key(point)}
            d={`M${cx - 5} ${cy - 5} L${cx + 5} ${cy + 5} M${cx - 5} ${cy + 5} L${cx + 5} ${cy - 5}`}
            strokeWidth={1.8}
            className="stroke-muted"
          />
        )
      })}
      {openDots.map((point) => (
        <circle key={key(point)} data-open={key(point)} cx={px(point[0])} cy={py(point[1])} r={5} strokeWidth={1.8} className="fill-paper stroke-ink" />
      ))}
      {rings.map((point) => (
        <circle key={key(point)} data-ring={key(point)} cx={px(point[0])} cy={py(point[1])} r={13} strokeWidth={2.4} className="fill-none stroke-marker" />
      ))}
      {probe && spot && (
        <g data-probe={key(probe.at)} data-in={probe.holds}>
          <circle cx={px(probe.at[0])} cy={py(probe.at[1])} r={9} strokeWidth={2.2} className={`fill-none ${probe.holds ? 'stroke-ink' : 'stroke-marker'}`} />
          <text x={spot.lx} y={spot.ly} textAnchor={spot.anchor} className={`font-math text-[15px] ${probe.holds ? 'fill-ink' : 'fill-marker'}`}>
            {probe.label}
          </text>
        </g>
      )}
      {note && (
        <text
          data-note={note.x}
          x={px(note.x) + (noteRight ? -10 : 10)}
          y={top + 40}
          textAnchor={noteRight ? 'end' : 'start'}
          className="fill-marker font-math text-[15px]"
        >
          {note.text}
        </text>
      )}
    </svg>
  )
}

import type { CSSProperties, KeyboardEvent } from 'react'
import { MathTex } from '../atoms/MathTex'

export type Placement = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
export type Coordinate = [number, number]

export type PlaneWindow = {
  x: Coordinate
  y: Coordinate
}

export type PlanePoint = {
  id: number
  x: number
  y: number
  labelTex: string
  placement: Placement
  ariaLabel: string
  result: boolean
  marked: boolean
  guide: 'none' | 'faint' | 'picked'
}

export type PlaneWalk = {
  from: Coordinate
  to: Coordinate
  labelTex?: string
  placement: Placement
  labelAt: number
  shift: number
  now: boolean
}

export type PlaneMirror = {
  from: Coordinate
  to: Coordinate
  now: boolean
}

export type PlaneMark = {
  tex: string
  now: boolean
}

type ComplexPlaneBoardProps = {
  window: PlaneWindow
  ariaLabel: string
  points: PlanePoint[]
  walks: PlaneWalk[]
  mirrors: PlaneMirror[]
  rays: { from: Coordinate; to: Coordinate }[]
  marks: PlaneMark[]
  interactive: boolean
  onSelectPoint: (id: number) => void
}

const width = 640
const height = 400

const placementTransform: Record<Placement | 'end', string> = {
  n: 'translate(-50%, calc(-100% - 9px))',
  s: 'translate(-50%, 9px)',
  e: 'translate(11px, -50%)',
  w: 'translate(calc(-100% - 11px), -50%)',
  ne: 'translate(7px, calc(-100% - 7px))',
  nw: 'translate(calc(-100% - 7px), calc(-100% - 7px))',
  se: 'translate(7px, 7px)',
  sw: 'translate(calc(-100% - 7px), 7px)',
  end: 'translate(-100%, 8px)',
}

const paperGlow = '0 0 3px var(--color-paper), 0 0 3px var(--color-paper), 0 0 3px var(--color-paper)'

const walkGlowClass = 'stroke-highlight opacity-60'
const walkLineClass = 'fill-none stroke-ink'
const mirrorLineClass = 'fill-none stroke-ink'
const guideLineClass = 'fill-none stroke-faint'

function layoutOf(window: PlaneWindow) {
  const [x0, x1] = window.x
  const [y0, y1] = window.y
  const unit = Math.min(56, 580 / (x1 - x0), 350 / (y1 - y0))
  const originX = 320 - ((x0 + x1) / 2) * unit
  const originY = 205 + ((y0 + y1) / 2) * unit
  return { unit, originX, originY, toX: (x: number) => originX + x * unit, toY: (y: number) => originY - y * unit }
}

function integersBetween(low: number, high: number) {
  const first = Math.ceil(low)
  return Array.from({ length: Math.max(0, Math.floor(high) - first + 1) }, (_, index) => first + index)
}

function numberText(value: number) {
  return value < 0 ? `−${-value}` : `${value}`
}

function ArrowHead({ x, y, dx, dy, now }: { x: number; y: number; dx: number; dy: number; now: boolean }) {
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const size = 7
  const left = [x - ux * size - uy * size * 0.7, y - uy * size + ux * size * 0.7]
  const right = [x - ux * size + uy * size * 0.7, y - uy * size - ux * size * 0.7]
  return (
    <path
      d={`M${left[0]} ${left[1]} L${x} ${y} L${right[0]} ${right[1]}`}
      strokeWidth="1.6"
      className={`fill-none ${now ? 'stroke-marker' : 'stroke-ink'}`}
    />
  )
}

function Label({
  x,
  y,
  tex,
  placement,
  className,
  style,
}: {
  x: number
  y: number
  tex: string
  placement: Placement | 'end'
  className: string
  style?: CSSProperties
}) {
  return (
    <foreignObject x={x - 160} y={y - 30} width="320" height="60" overflow="visible" className="pointer-events-none">
      <div className="relative h-15 w-80">
        <div
          className={`absolute top-1/2 left-1/2 rounded px-1 py-0.5 leading-none whitespace-nowrap ${className}`}
          style={{ transform: placementTransform[placement], ...style }}
        >
          <MathTex tex={tex} />
        </div>
      </div>
    </foreignObject>
  )
}

export function PlaneSwatch({ kind }: { kind: 'walk' | 'mirror' | 'guide' | 'result' }) {
  if (kind === 'result') {
    return (
      <svg width="44" height="22" viewBox="0 0 44 22" aria-hidden="true">
        <circle cx="22" cy="11" r="10" className="fill-highlight opacity-85" />
        <circle cx="22" cy="11" r="5.5" className="fill-ink" />
      </svg>
    )
  }
  return (
    <svg width="44" height="14" viewBox="0 0 44 14" aria-hidden="true">
      {kind === 'walk' && (
        <line x1="4" y1="7" x2="40" y2="7" strokeWidth="11" strokeLinecap="round" className={walkGlowClass} />
      )}
      {kind === 'walk' && <line x1="4" y1="7" x2="38" y2="7" strokeWidth="1.8" className={walkLineClass} />}
      {kind === 'mirror' && (
        <line
          x1="4"
          y1="7"
          x2="38"
          y2="7"
          strokeWidth="1.6"
          strokeDasharray="2 4"
          strokeLinecap="round"
          className={mirrorLineClass}
        />
      )}
      {kind === 'guide' && (
        <line x1="4" y1="7" x2="40" y2="7" strokeWidth="1.4" strokeDasharray="5 5" className={guideLineClass} />
      )}
      {kind !== 'guide' && <ArrowHead x={39} y={7} dx={1} dy={0} now={false} />}
    </svg>
  )
}

export function ComplexPlaneBoard({
  window,
  ariaLabel,
  points,
  walks,
  mirrors,
  rays,
  marks,
  interactive,
  onSelectPoint,
}: ComplexPlaneBoardProps) {
  const { unit, originX, originY, toX, toY } = layoutOf(window)
  const gridXs = integersBetween(-originX / unit, (width - originX) / unit).map(toX)
  const gridYs = integersBetween((originY - height) / unit, originY / unit).map(toY)
  const tickXs = integersBetween((20 - originX) / unit, (width - 30 - originX) / unit).filter((k) => k !== 0)
  const tickYs = integersBetween((originY - (height - 18)) / unit, (originY - 30) / unit).filter((k) => k !== 0)

  function activate(event: KeyboardEvent, id: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelectPoint(id)
  }

  function walkEnds(walk: PlaneWalk) {
    return {
      x1: toX(walk.from[0]) + walk.shift,
      y1: toY(walk.from[1]),
      x2: toX(walk.to[0]) + walk.shift,
      y2: toY(walk.to[1]),
    }
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel} className="block h-auto w-full">
      <g className="stroke-grid">
        {gridXs.map((x) => (
          <line key={`x-${x}`} x1={x} y1="0" x2={x} y2={height} />
        ))}
        {gridYs.map((y) => (
          <line key={`y-${y}`} x1="0" y1={y} x2={width} y2={y} />
        ))}
      </g>

      <g strokeWidth="1.4" strokeDasharray="5 5" fill="none">
        {points
          .filter((point) => point.guide !== 'none')
          .map((point) => (
            <path
              key={point.id}
              d={`M${toX(point.x)} ${toY(point.y)} L${toX(point.x)} ${originY} M${toX(point.x)} ${toY(point.y)} L${originX} ${toY(point.y)}`}
              className={point.guide === 'picked' ? 'stroke-marker' : 'stroke-faint'}
            />
          ))}
      </g>

      {rays.map((ray, index) => (
        <line
          key={index}
          x1={toX(ray.from[0])}
          y1={toY(ray.from[1])}
          x2={toX(ray.to[0])}
          y2={toY(ray.to[1])}
          strokeWidth="1.4"
          strokeDasharray="6 4"
          className="stroke-muted"
        />
      ))}

      {walks.map((walk, index) => {
        const { x1, y1, x2, y2 } = walkEnds(walk)
        return (
          <g key={index}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="11" strokeLinecap="round" className={walkGlowClass} />
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth="1.8"
              className={walk.now ? 'fill-none stroke-marker' : walkLineClass}
            />
            <ArrowHead x={x2} y={y2} dx={x2 - x1} dy={y2 - y1} now={walk.now} />
          </g>
        )
      })}

      {mirrors.map((mirror, index) => {
        const x = toX(mirror.from[0])
        const y1 = toY(mirror.from[1])
        const y2 = toY(mirror.to[1])
        const direction = Math.sign(y2 - y1)
        const stroke = mirror.now ? 'stroke-marker' : 'stroke-ink'
        return (
          <g key={index}>
            <line
              x1={x}
              y1={y1 + direction * 8}
              x2={x}
              y2={y2 - direction * 8}
              strokeWidth="1.6"
              strokeDasharray="2 4"
              strokeLinecap="round"
              className={`fill-none ${stroke}`}
            />
            <ArrowHead x={x} y={y2 - direction * 8} dx={0} dy={y2 - y1} now={mirror.now} />
            <path
              d={`M${x - 6} ${originY - 6} L${x - 6} ${originY} M${x - 6} ${originY - 6} L${x} ${originY - 6}`}
              strokeWidth="1.6"
              className={`fill-none ${stroke}`}
            />
          </g>
        )
      })}

      <line x1="14" y1={originY} x2={width - 16} y2={originY} strokeWidth="2" className="stroke-ink" />
      <ArrowHead x={width - 14} y={originY} dx={1} dy={0} now={false} />
      <line x1={originX} y1={height - 14} x2={originX} y2="16" strokeWidth="2" className="stroke-ink" />
      <ArrowHead x={originX} y={14} dx={0} dy={-1} now={false} />
      <g strokeWidth="1.5" className="stroke-ink">
        {tickXs.map((k) => (
          <line key={`tick-x-${k}`} x1={toX(k)} y1={originY - 5} x2={toX(k)} y2={originY + 5} />
        ))}
        {tickYs.map((k) => (
          <line key={`tick-y-${k}`} x1={originX - 5} y1={toY(k)} x2={originX + 5} y2={toY(k)} />
        ))}
      </g>
      <g className="fill-muted font-math text-[13px]">
        {tickXs.map((k) => (
          <text key={`label-x-${k}`} x={toX(k)} y={originY + 20} textAnchor="middle">
            {numberText(k)}
          </text>
        ))}
        {tickYs.map((k) => (
          <text key={`label-y-${k}`} x={originX - 9} y={toY(k) + 4.5} textAnchor="end">
            {numberText(k)}
          </text>
        ))}
        <text x={originX - 9} y={originY + 20} textAnchor="end">
          0
        </text>
      </g>
      <Label x={width - 22} y={originY} tex="\mathrm{Re}(z)" placement="nw" className="text-[17px] text-ink" />
      <Label x={originX} y={6} tex="\mathrm{Im}(z)" placement="se" className="text-[17px] text-ink" />

      {marks.map((mark) => (
        <Label
          key={mark.tex}
          x={width - 20}
          y={originY + 18}
          tex={mark.tex}
          placement="end"
          className={`text-sm ${mark.now ? 'text-marker' : 'text-muted'}`}
        />
      ))}

      {walks.map((walk, index) => {
        if (!walk.labelTex) return null
        const { x1, y1, x2, y2 } = walkEnds(walk)
        return (
          <Label
            key={index}
            x={x1 + (x2 - x1) * walk.labelAt}
            y={y1 + (y2 - y1) * walk.labelAt}
            tex={walk.labelTex}
            placement={walk.placement}
            className={`text-sm ${walk.now ? 'text-marker' : 'text-ink'}`}
            style={{ textShadow: paperGlow }}
          />
        )
      })}

      {points.map((point) => {
        const cx = toX(point.x)
        const cy = toY(point.y)
        return (
          <g
            key={point.id}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={point.ariaLabel}
            aria-pressed={point.marked}
            onClick={() => interactive && onSelectPoint(point.id)}
            onKeyDown={(event) => interactive && activate(event, point.id)}
            className={`group outline-none ${interactive ? 'cursor-pointer' : ''}`}
          >
            <circle
              cx={cx}
              cy={cy}
              r="15"
              className={`fill-highlight-soft transition-opacity ${interactive ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100' : 'opacity-0'}`}
            />
            {point.result && <circle cx={cx} cy={cy} r="10" className="animate-fade-in fill-highlight opacity-85" />}
            <circle cx={cx} cy={cy} r="5.5" className="animate-fade-in fill-ink" />
            {point.marked && <circle cx={cx} cy={cy} r="11" strokeWidth="2" className="fill-none stroke-marker" />}
          </g>
        )
      })}

      {points.map((point) => (
        <Label
          key={point.id}
          x={toX(point.x)}
          y={toY(point.y)}
          tex={point.labelTex}
          placement={point.placement}
          className={`bg-paper/85 text-[15px] ${point.marked ? 'text-marker' : 'text-ink'}`}
        />
      ))}
    </svg>
  )
}

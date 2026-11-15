import { Fragment } from 'react'
import { MathTex } from '../atoms/MathTex'

export type LineKind = 'guide' | 'dense' | 'solid' | 'plane'
export type LinePointStatus = 'plain' | 'glow' | 'selected' | 'lit' | 'hidden'
export type LabelPlacement = 'above' | 'below'
export type RowVisibility = 'shown' | 'hidden' | 'faded'

export type LinePoint = {
  id: number
  x: number
  y: number
  labelTex: string | null
  placement: LabelPlacement
  ariaLabel: string
  status: LinePointStatus
}

export type LineRow = {
  id: number
  labelTex: string
  name: string
  ariaLabel: string
  kind: LineKind
  marked: boolean
  visibility: RowVisibility
  highlightX: number | null
  holes: number[]
  points: LinePoint[]
}

type NumberLinesBoardProps = {
  rows: LineRow[]
  interactive: boolean
  onSelectPoint: (id: number) => void
  onSelectRow: (id: number) => void
}

const xMin = -3.5
const xSpan = 7
const planeTop = 2.4
const planeSpan = 3
const ticks = [-3, -2, -1, 0, 1, 2, 3]
const denseSteps = 6

export const guideLineClass = 'absolute border-t-[1.5px] border-dashed border-faint'
export const realLineClass = 'absolute -mt-[1.5px] h-[3px] rounded-sm bg-ink'
export const tinyDotClass = 'absolute -mt-[1.5px] -ml-[1.5px] size-[3px] rounded-full bg-ink opacity-50'
export const holeClass = 'absolute -mt-[5.5px] -ml-[5.5px] size-[11px] rounded-full border-[1.8px] border-marker bg-paper'

function xPercent(x: number) {
  return ((x - xMin) / xSpan) * 100
}

function yPercent(row: LineRow, y: number) {
  return row.kind === 'plane' ? ((planeTop - y) / planeSpan) * 100 : 50
}

function denseDots(row: LineRow) {
  const dots: number[] = []
  const limit = Math.floor((xSpan / 2) * denseSteps)
  for (let step = -limit; step <= limit; step++) {
    const x = step / denseSteps
    if (step % denseSteps === 0) continue
    if (row.holes.some((hole) => Math.abs(hole - x) < 0.06)) continue
    if (row.points.some((point) => Math.abs(point.x - x) < 1e-9)) continue
    dots.push(x)
  }
  return dots
}

const visibilityClass: Record<RowVisibility, string> = {
  shown: '',
  hidden: 'invisible',
  faded: 'opacity-20',
}

export function NumberLinesBoard({ rows, interactive, onSelectPoint, onSelectRow }: NumberLinesBoardProps) {
  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] sm:grid-cols-[92px_minmax(0,1fr)]">
      {rows.map((row) => {
        const fade = `transition-opacity duration-300 ${visibilityClass[row.visibility]}`
        const axisTop = `${yPercent(row, 0)}%`
        return (
          <Fragment key={row.id}>
            <div className={`flex items-center ${fade}`}>
              <button
                type="button"
                aria-label={row.ariaLabel}
                disabled={!interactive}
                onClick={() => onSelectRow(row.id)}
                className={`rounded-[3px] px-1.5 font-hand text-2xl whitespace-nowrap ${interactive ? 'cursor-pointer' : ''} ${row.marked ? 'marker-highlight dark:text-paper' : 'hover:bg-highlight-soft'}`}
              >
                <MathTex tex={row.labelTex} className="text-[0.85em]" />
                <span className="hidden sm:inline"> {row.name}</span>
              </button>
            </div>
            <div className={`relative mx-3.5 ${row.kind === 'plane' ? 'aspect-[7/3]' : 'h-16.5'} ${fade}`}>
              {ticks.map((tick) => (
                <span
                  key={`v${tick}`}
                  className="absolute inset-y-0 border-l border-dashed border-faint opacity-45"
                  style={{ left: `${xPercent(tick)}%` }}
                />
              ))}
              {row.kind === 'plane' &&
                [1, 2].map((y) => (
                  <span
                    key={`h${y}`}
                    className="absolute inset-x-0 border-t border-dashed border-faint opacity-45"
                    style={{ top: `${yPercent(row, y)}%` }}
                  />
                ))}
              {row.highlightX !== null && (
                <span
                  className="absolute inset-y-0 -ml-[3px] w-1.5 bg-highlight opacity-60"
                  style={{ left: `${xPercent(row.highlightX)}%` }}
                />
              )}
              <span
                className={`-inset-x-2.5 ${row.kind === 'guide' || row.kind === 'dense' ? guideLineClass : realLineClass}`}
                style={{ top: axisTop }}
              />
              {row.kind === 'dense' &&
                denseDots(row).map((x) => (
                  <span key={`d${x}`} className={tinyDotClass} style={{ left: `${xPercent(x)}%`, top: '50%' }} />
                ))}
              {row.holes.map((x) => (
                <span key={`o${x}`} className={holeClass} style={{ left: `${xPercent(x)}%`, top: '50%' }} />
              ))}
              {row.points.map((point) => {
                const glowing = point.status === 'glow'
                const label =
                  row.kind === 'plane'
                    ? 'top-1/2 left-5 -translate-y-1/2'
                    : `left-1/2 -translate-x-1/2 ${point.placement === 'above' ? 'bottom-4.5' : 'top-4.5'}`
                return (
                  <button
                    key={point.id}
                    type="button"
                    aria-label={point.ariaLabel}
                    disabled={!interactive}
                    onClick={() => onSelectPoint(point.id)}
                    className={`group absolute -mt-2.5 -ml-2.5 size-5 ${interactive ? 'cursor-pointer' : ''} ${point.status === 'hidden' ? 'invisible' : ''}`}
                    style={{ left: `${xPercent(point.x)}%`, top: `${yPercent(row, point.y)}%` }}
                  >
                    <span
                      className={`absolute top-[5px] left-[5px] size-2.5 rounded-full bg-ink ${glowing || point.status === 'lit' ? 'shadow-[0_0_0_5px_var(--color-highlight)]' : ''}`}
                    />
                    {point.status === 'selected' && (
                      <span className="absolute -inset-[3px] rounded-full border-2 border-marker" />
                    )}
                    {point.labelTex !== null && (
                      <span
                        className={`absolute rounded-[3px] px-[3px] text-[15px] whitespace-nowrap ${label} ${glowing ? 'bg-highlight dark:text-paper' : 'group-hover:bg-highlight-soft'}`}
                      >
                        <MathTex tex={point.labelTex} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Fragment>
        )
      })}
      <div />
      <div className="relative mx-3.5 h-7.5">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute top-0.5 -translate-x-1/2 text-[14px] text-muted"
            style={{ left: `${xPercent(tick)}%` }}
          >
            <MathTex tex={String(tick)} />
          </span>
        ))}
      </div>
    </div>
  )
}

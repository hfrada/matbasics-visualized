import { SvgBrace } from '../atoms/SvgBrace'
import { SvgResult } from '../atoms/SvgResult'
import { FigureSide } from '../molecules/FigureSide'

export type AreaShape =
  | { kind: 'rect'; x: number; width: number; height: number; label: string; stackedHalves: boolean; now: boolean }
  | { kind: 'brace'; x: number; width: number; lift: number; label: string; now: boolean }
  | { kind: 'segment'; from: number; to: number; now: boolean }

export type AreaSide = {
  title: string
  expression: string
  label: string
  shapes: AreaShape[]
  extent: { width: number; height: number }
  result: string | null
  selected: boolean
  faded: boolean
}

type AreaRowsBoardProps = {
  sides: AreaSide[]
  resultLit: boolean
  interactive: boolean
  ariaLabel: string
  onPick: (side: number) => void
}

const width = 640
const height = 262
const unit = 48
const left = 176
const rowBase = [118, 232]

function RectShape({ shape, base }: { shape: Extract<AreaShape, { kind: 'rect' }>; base: number }) {
  const x = left + shape.x * unit
  const across = shape.width * unit
  const tall = shape.height * unit
  const top = base - tall
  return (
    <g data-area-rect={shape.now ? 'now' : 'idle'} data-cells={shape.width * shape.height}>
      <rect x={x} y={top} width={across} height={tall} className="fill-highlight-soft" />
      {Array.from({ length: Math.ceil(shape.width) - 1 }, (_, step) => (
        <line key={`v${step}`} x1={x + (step + 1) * unit} x2={x + (step + 1) * unit} y1={top} y2={base} className="stroke-ink opacity-45" />
      ))}
      {Array.from({ length: Math.ceil(shape.height) - 1 }, (_, step) => (
        <line key={`h${step}`} x1={x} x2={x + across} y1={base - (step + 1) * unit} y2={base - (step + 1) * unit} className="stroke-ink opacity-45" />
      ))}
      {shape.stackedHalves && (
        <line x1={x} x2={x + across} y1={base - tall / 2} y2={base - tall / 2} strokeWidth={1.3} strokeDasharray="4 3" className="stroke-ink" />
      )}
      <rect
        x={x}
        y={top}
        width={across}
        height={tall}
        strokeWidth={shape.now ? 3 : 2}
        className={`fill-none ${shape.now ? 'stroke-marker' : 'stroke-ink'}`}
      />
      {shape.label && (
        <text
          x={x + across / 2}
          y={top - 10}
          textAnchor="middle"
          className={`font-math text-base ${shape.now ? 'fill-marker' : 'fill-muted'}`}
        >
          {shape.label}
        </text>
      )}
    </g>
  )
}

function SegmentShape({ shape, base }: { shape: Extract<AreaShape, { kind: 'segment' }>; base: number }) {
  const y = base - 16
  const ticks = Array.from({ length: shape.to - shape.from + 1 }, (_, index) => shape.from + index)
  return (
    <g data-segment={shape.now ? 'now' : 'idle'}>
      <line x1={left - 14} x2={left + shape.to * unit + 14} y1={y} y2={y} strokeWidth={1.2} className="stroke-ink" />
      <line
        x1={left + shape.from * unit}
        x2={left + shape.to * unit}
        y1={y}
        y2={y}
        strokeWidth={4}
        strokeLinecap="round"
        className={shape.now ? 'stroke-marker' : 'stroke-ink'}
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={left + tick * unit} x2={left + tick * unit} y1={y - 7} y2={y + 7} strokeWidth={1.3} className="stroke-ink" />
          <text x={left + tick * unit} y={y + 26} textAnchor="middle" className="fill-muted font-math text-[15px]">
            {tick}
          </text>
        </g>
      ))}
    </g>
  )
}

export function AreaRowsBoard({ sides, resultLit, interactive, ariaLabel, onPick }: AreaRowsBoardProps) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {sides.map((side, index) => {
        const base = rowBase[index]
        return (
          <FigureSide
            key={index}
            side={index}
            label={side.label}
            title={side.title}
            expression={side.expression}
            textX={14}
            textY={base - 30}
            hit={{ x: 0, y: base - 86, width, height: index === 0 ? 104 : 110 }}
            selected={side.selected}
            faded={side.faded}
            interactive={interactive}
            onPick={() => onPick(index)}
          >
            {side.shapes.map((shape, position) => {
              if (shape.kind === 'rect') return <RectShape key={position} shape={shape} base={base} />
              if (shape.kind === 'segment') return <SegmentShape key={position} shape={shape} base={base} />
              const y = base - shape.lift * unit - 8
              return (
                <SvgBrace
                  key={position}
                  from={left + shape.x * unit}
                  to={left + (shape.x + shape.width) * unit}
                  y={y}
                  label={shape.label}
                  now={shape.now}
                />
              )
            })}
            {side.result !== null && (
              <SvgResult
                x={left + side.extent.width * unit + 30}
                y={base - (Math.max(side.extent.height, 0.5) * unit) / 2 + 9}
                value={side.result}
                lit={resultLit}
              />
            )}
          </FigureSide>
        )
      })}
    </svg>
  )
}

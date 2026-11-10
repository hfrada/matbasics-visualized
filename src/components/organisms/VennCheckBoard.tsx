import { useId, type KeyboardEvent } from 'react'

export type VennShape = {
  name: string
  cx: number
  cy: number
  rx: number
  ry: number
  rotate?: number
  dashed?: boolean
  labelX: number
  labelY: number
}

export type VennMark = {
  text: string
  tone: 'ink' | 'muted' | 'marker'
  below: boolean
}

export type VennChip = {
  label: string
  x: number
  y: number
  glow: boolean
  counter: boolean
  selected: boolean
  marks: VennMark[]
}

type VennCheckBoardProps = {
  shapes: VennShape[]
  chips: VennChip[]
  universe: boolean
  outsideLabel: string | null
  interactive: boolean
  onSelect: (index: number) => void
}

const universeBox = { x: 20, y: 30, width: 600, height: 330 }

const toneClass = {
  ink: 'fill-ink',
  muted: 'fill-muted',
  marker: 'fill-marker',
}

function rotation(shape: VennShape) {
  return shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined
}

export function VennCheckBoard({ shapes, chips, universe, outsideLabel, interactive, onSelect }: VennCheckBoardProps) {
  const id = useId()
  const hatchId = `${id}-hatch`
  const maskId = `${id}-outside`

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(index)
  }

  return (
    <svg viewBox="0 0 640 380" className="block h-auto w-full">
      <defs>
        <pattern id={hatchId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" strokeWidth="2" className="stroke-muted opacity-45" />
        </pattern>
        <mask id={maskId}>
          <rect {...universeBox} fill="white" />
          {shapes.map((shape) => (
            <ellipse
              key={shape.name}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              transform={rotation(shape)}
              fill="black"
            />
          ))}
        </mask>
      </defs>

      {universe && outsideLabel && (
        <g className="animate-fade-in">
          <rect {...universeBox} fill={`url(#${hatchId})`} mask={`url(#${maskId})`} />
          <text x="560" y="350" className="fill-marker font-math-italic text-[28px] italic">
            {outsideLabel}
            <tspan dy="-12" className="font-math text-[18px] not-italic">
              C
            </tspan>
          </text>
        </g>
      )}
      {universe && (
        <>
          <rect {...universeBox} x={23} y={33} rx="4" strokeWidth="1" className="fill-none stroke-faint" />
          <rect {...universeBox} rx="4" strokeWidth="2" className="fill-none stroke-ink" />
          <text x="28" y="22" className="fill-ink font-math-italic text-[28px] italic">
            S
          </text>
        </>
      )}

      {shapes.map((shape) => {
        const stroke = shape.dashed ? 'stroke-muted' : 'stroke-ink'
        const dash = shape.dashed ? '8 6' : undefined
        const rotate = rotation(shape)
        return (
          <g key={shape.name}>
            <ellipse
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              transform={`translate(3 3) ${rotate ?? ''}`}
              strokeWidth="1"
              strokeDasharray={dash}
              className="fill-none stroke-faint"
            />
            <ellipse
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              transform={rotate}
              strokeWidth="2"
              strokeDasharray={dash}
              className={`fill-none ${stroke}`}
            />
            <text
              x={shape.labelX}
              y={shape.labelY}
              className={`font-math-italic text-[28px] italic ${shape.dashed ? 'fill-muted' : 'fill-ink'}`}
            >
              {shape.name}
            </text>
          </g>
        )
      })}

      {chips.map((chip, index) => (
        <g
          key={chip.label}
          role="button"
          tabIndex={interactive ? 0 : -1}
          aria-label={chip.label}
          aria-pressed={chip.selected}
          onClick={() => interactive && onSelect(index)}
          onKeyDown={(event) => interactive && handleKeyDown(event, index)}
          transform={`translate(${chip.x} ${chip.y})`}
          className={`outline-none ${interactive ? 'cursor-pointer' : ''}`}
        >
          <circle r="23" className={`fill-highlight transition-opacity ${chip.glow ? 'opacity-85' : 'opacity-0'}`} />
          <circle r="21" cx="1.5" cy="1.5" strokeWidth="1" className="fill-none stroke-ink opacity-35" />
          <circle
            r="20"
            strokeWidth={chip.selected ? 2.5 : 1.8}
            className={`fill-paper ${chip.selected ? 'stroke-marker' : 'stroke-ink'}`}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none fill-ink font-math text-[22px]"
          >
            {chip.label}
          </text>
          {chip.counter && (
            <ellipse
              rx="31"
              ry="28"
              transform="rotate(-12)"
              strokeWidth="3"
              className="animate-fade-in fill-none stroke-marker"
            />
          )}
          {chip.marks.map((mark) => (
            <text
              key={mark.text}
              y={mark.below ? 44 : -32}
              textAnchor="middle"
              className={`animate-fade-in pointer-events-none font-math text-[17px] ${toneClass[mark.tone]}`}
            >
              {mark.text}
            </text>
          ))}
        </g>
      ))}
    </svg>
  )
}

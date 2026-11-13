import { useId, type KeyboardEvent } from 'react'

export type RegionKey = 'onlyA' | 'both' | 'onlyB' | 'outside'

type RegionPaint = {
  className: string
  fill?: string
}

export type RegionChip = {
  value: number
  x: number
  y: number
  faded: boolean
  selected: boolean
}

type VennRegionBoardProps = {
  shaded: RegionKey[]
  checking: RegionKey | null
  chips: RegionChip[]
  interactive: boolean
  onSelect: (value: number) => void
}

const universeBox = { x: 20, y: 30, width: 600, height: 330 }
const circleA = { cx: 250, cy: 195, r: 125 }
const circleB = { cx: 390, cy: 195, r: 125 }
const labels = [
  { name: 'A', circle: circleA, x: 150, y: 88 },
  { name: 'B', circle: circleB, x: 470, y: 88 },
]

export function VennRegionBoard({ shaded, checking, chips, interactive, onSelect }: VennRegionBoardProps) {
  const id = useId()
  const hatchId = `${id}-hatch`
  const clipB = `${id}-clip-b`
  const withoutA = `${id}-without-a`
  const withoutB = `${id}-without-b`
  const outside = `${id}-outside`

  function region(key: RegionKey, paint: RegionPaint) {
    if (key === 'onlyA') return <circle {...circleA} mask={`url(#${withoutB})`} {...paint} />
    if (key === 'both') return <circle {...circleA} clipPath={`url(#${clipB})`} {...paint} />
    if (key === 'onlyB') return <circle {...circleB} mask={`url(#${withoutA})`} {...paint} />
    return <rect {...universeBox} mask={`url(#${outside})`} {...paint} />
  }

  function handleKeyDown(event: KeyboardEvent, value: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(value)
  }

  return (
    <svg viewBox="0 0 640 380" className="block h-auto w-full">
      <defs>
        <pattern id={hatchId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" strokeWidth="2" className="stroke-marker opacity-55" />
        </pattern>
        <clipPath id={clipB}>
          <circle {...circleB} />
        </clipPath>
        <mask id={withoutA}>
          <rect {...universeBox} fill="white" />
          <circle {...circleA} fill="black" />
        </mask>
        <mask id={withoutB}>
          <rect {...universeBox} fill="white" />
          <circle {...circleB} fill="black" />
        </mask>
        <mask id={outside}>
          <rect {...universeBox} fill="white" />
          <circle {...circleA} fill="black" />
          <circle {...circleB} fill="black" />
        </mask>
      </defs>

      {shaded.map((key) => (
        <g key={key}>{region(key, { className: 'animate-fade-in fill-highlight opacity-55' })}</g>
      ))}
      {checking && <g key={`checking-${checking}`}>{region(checking, { fill: `url(#${hatchId})`, className: 'animate-fade-in' })}</g>}

      <rect {...universeBox} x={23} y={33} rx="4" strokeWidth="1" className="fill-none stroke-faint" />
      <rect {...universeBox} rx="4" strokeWidth="2" className="fill-none stroke-ink" />
      <text x="28" y="22" className="fill-ink font-math-italic text-[28px] italic">
        S
      </text>

      {labels.map(({ name, circle, x, y }) => (
        <g key={name}>
          <circle {...circle} transform="translate(3 3)" strokeWidth="1" className="fill-none stroke-faint" />
          <circle {...circle} strokeWidth="2" className="fill-none stroke-ink" />
          <text x={x} y={y} className="fill-ink font-math-italic text-[28px] italic">
            {name}
          </text>
        </g>
      ))}

      {chips.map((chip) => (
        <g
          key={chip.value}
          role="button"
          tabIndex={interactive ? 0 : -1}
          aria-label={`${chip.value}`}
          aria-pressed={chip.selected}
          onClick={() => interactive && onSelect(chip.value)}
          onKeyDown={(event) => interactive && handleKeyDown(event, chip.value)}
          transform={`translate(${chip.x} ${chip.y})`}
          className={`outline-none transition-opacity duration-300 ${chip.faded ? 'opacity-40' : ''} ${interactive ? 'cursor-pointer' : ''}`}
        >
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
            {chip.value}
          </text>
        </g>
      ))}
    </svg>
  )
}

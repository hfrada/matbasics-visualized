import type { KeyboardEvent } from 'react'

export type BoardChip = {
  label: string
  italic: boolean
  status: 'waiting' | 'member' | 'rejected'
  checking: boolean
  slot: number | null
  selected: boolean
}

type SetListingBoardProps = {
  chips: BoardChip[]
  memberCount: number
  continuation: string[]
  emptyResult: boolean
  trayLabel: string
  interactive: boolean
  onSelect: (index: number) => void
}

const listY = 310
const columns = 7

function slotX(slot: number) {
  return 62 + slot * 46
}

function homePosition(index: number) {
  const column = index % columns
  const row = Math.floor(index / columns)
  return {
    x: 62 + column * 84 + (row % 2) * 36 + ((index * 37) % 23) - 11,
    y: 72 + row * 58 + ((index * 53) % 19) - 9,
  }
}

export function SetListingBoard({
  chips,
  memberCount,
  continuation,
  emptyResult,
  trayLabel,
  interactive,
  onSelect,
}: SetListingBoardProps) {
  const usedSlots = memberCount + continuation.length + (continuation.length > 0 ? 1 : 0)
  const closingX = slotX(usedSlots || 0.4) - 22

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(index)
  }

  return (
    <svg viewBox="0 0 640 380" className="block h-auto w-full">
      <text x="16" y="26" className="fill-muted font-hand text-xl">
        {trayLabel}
      </text>
      <line x1="16" y1="236" x2="624" y2="236" strokeDasharray="4 6" className="stroke-faint" />
      <text x="12" y="330" className="fill-ink font-math text-[64px]">
        {'{'}
      </text>

      {continuation.map((label, offset) => (
        <g key={label} transform={`translate(${slotX(memberCount + offset)} ${listY})`} className="animate-fade-in">
          <circle r="20" strokeWidth="1.8" strokeDasharray="4 4" className="fill-paper stroke-ink" />
          <text textAnchor="middle" dominantBaseline="central" className="fill-muted font-math text-[22px]">
            {label}
          </text>
        </g>
      ))}
      {continuation.length > 0 && (
        <text x={slotX(memberCount + continuation.length) - 8} y={listY + 8} className="fill-ink font-math text-[26px]">
          …
        </text>
      )}

      {chips.map(
        (chip) =>
          chip.status === 'member' &&
          chip.slot !== null && (
            <text
              key={`copy-${chip.label}`}
              x={slotX(chip.slot)}
              y={listY + 8}
              textAnchor="middle"
              className={`animate-fade-in fill-ink text-[22px] ${chip.italic ? 'font-math-italic italic' : 'font-math'}`}
            >
              {chip.label}
            </text>
          ),
      )}

      {chips.map((chip, index) => {
        const { x, y } = homePosition(index)
        const marked = chip.checking || chip.status === 'member'
        return (
          <g
            key={chip.label}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={chip.label}
            aria-pressed={chip.selected}
            onClick={() => interactive && onSelect(index)}
            onKeyDown={(event) => interactive && handleKeyDown(event, index)}
            style={{ transform: `translate(${x}px, ${y}px)` }}
            className={`transition-opacity duration-300 outline-none motion-reduce:transition-none ${chip.status === 'rejected' ? 'opacity-30' : ''} ${interactive ? 'cursor-pointer' : ''}`}
          >
            <circle r="23" className={`fill-highlight transition-opacity ${marked ? 'opacity-85' : 'opacity-0'}`} />
            <circle r="21" cx="1.5" cy="1.5" strokeWidth="1" className="fill-none stroke-ink opacity-35" />
            <circle
              r="20"
              strokeWidth={chip.selected ? 2.5 : 1.8}
              className={`fill-paper ${chip.selected ? 'stroke-marker' : 'stroke-ink'}`}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className={`pointer-events-none fill-ink text-[22px] ${chip.italic ? 'font-math-italic italic' : 'font-math'}`}
            >
              {chip.label}
            </text>
          </g>
        )
      })}

      <text x={closingX} y="330" className="fill-ink font-math text-[64px]">
        {'}'}
      </text>
      {emptyResult && (
        <text x={closingX + 32} y={listY + 8} className="fill-ink font-math text-[26px]">
          = ∅
        </text>
      )}
    </svg>
  )
}

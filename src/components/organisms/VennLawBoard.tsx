import { useId, type MouseEvent, type ReactNode } from 'react'

type Circle = { cx: number; cy: number; r: number }

type VennLayout = {
  circles: Circle[]
  labels: { x: number; y: number }[]
}

type VennLawBoardProps = {
  names: string[]
  shaded: boolean[][]
  hatched: boolean[] | null
  mini?: boolean
  onSelect?: (memberships: boolean[]) => void
}

const universeBox = { x: 12, y: 30, width: 376, height: 262 }

const layouts: Record<number, VennLayout> = {
  2: {
    circles: [
      { cx: 158, cy: 165, r: 92 },
      { cx: 242, cy: 165, r: 92 },
    ],
    labels: [
      { x: 64, y: 86 },
      { x: 322, y: 86 },
    ],
  },
  3: {
    circles: [
      { cx: 160, cy: 132, r: 80 },
      { cx: 240, cy: 132, r: 80 },
      { cx: 200, cy: 204, r: 80 },
    ],
    labels: [
      { x: 70, y: 78 },
      { x: 318, y: 78 },
      { x: 108, y: 286 },
    ],
  },
}

export function VennLawBoard({ names, shaded, hatched, mini = false, onSelect }: VennLawBoardProps) {
  const id = useId()
  const layout = layouts[names.length]
  const hatchId = `${id}-hatch`
  const insideId = (index: number) => `${id}-inside-${index}`
  const outsideId = (index: number) => `${id}-outside-${index}`

  function region(memberships: boolean[], paint: ReactNode) {
    return memberships.reduce<ReactNode>(
      (inner, inside, index) =>
        inside ? (
          <g clipPath={`url(#${insideId(index)})`}>{inner}</g>
        ) : (
          <g mask={`url(#${outsideId(index)})`}>{inner}</g>
        ),
      paint,
    )
  }

  function handleClick(event: MouseEvent<SVGSVGElement>) {
    if (!onSelect) return
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const insideBox =
      point.x >= universeBox.x &&
      point.x <= universeBox.x + universeBox.width &&
      point.y >= universeBox.y &&
      point.y <= universeBox.y + universeBox.height
    if (!insideBox) return
    onSelect(layout.circles.map(({ cx, cy, r }) => Math.hypot(point.x - cx, point.y - cy) <= r))
  }

  return (
    <svg
      viewBox="0 0 400 300"
      className={`block h-auto w-full ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      aria-hidden={mini}
    >
      <defs>
        <pattern id={hatchId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" strokeWidth="2.4" className="stroke-marker opacity-70" />
        </pattern>
        {layout.circles.map((circle, index) => (
          <g key={index}>
            <clipPath id={insideId(index)}>
              <circle {...circle} />
            </clipPath>
            <mask id={outsideId(index)}>
              <rect {...universeBox} fill="white" />
              <circle {...circle} fill="black" />
            </mask>
          </g>
        ))}
      </defs>

      {shaded.map((memberships) => (
        <g key={memberships.join()}>
          {region(memberships, <rect {...universeBox} className="animate-fade-in fill-highlight opacity-55" />)}
        </g>
      ))}
      {hatched && (
        <g key={`hatch-${hatched.join()}`}>
          {region(hatched, <rect {...universeBox} fill={`url(#${hatchId})`} className="animate-fade-in" />)}
        </g>
      )}

      <rect {...universeBox} x={15} y={33} rx="4" strokeWidth="1" className="fill-none stroke-faint" />
      <rect {...universeBox} rx="4" strokeWidth="2" className="fill-none stroke-ink" />
      {!mini && (
        <text x="16" y="22" className="fill-ink font-math-italic text-[24px] italic">
          S
        </text>
      )}

      {layout.circles.map((circle, index) => (
        <g key={names[index]}>
          <circle {...circle} transform="translate(3 3)" strokeWidth="1" className="fill-none stroke-faint" />
          <circle {...circle} strokeWidth={mini ? 4 : 2} className="fill-none stroke-ink" />
          {!mini && (
            <text
              x={layout.labels[index].x}
              y={layout.labels[index].y}
              className="fill-ink font-math-italic text-[26px] italic"
            >
              {names[index]}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

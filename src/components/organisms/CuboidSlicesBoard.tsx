import { SvgResult } from '../atoms/SvgResult'
import { FigureSide } from '../molecules/FigureSide'

export type CuboidPart = { shown: boolean; now: boolean }

export type CuboidSide = {
  title: string
  expression: string
  label: string
  split: 'layers' | 'slices'
  parts: CuboidPart[]
  note: string | null
  result: string | null
  selected: boolean
  faded: boolean
}

type CuboidSize = { width: number; depth: number; height: number }

type CuboidSlicesBoardProps = {
  size: CuboidSize
  sides: CuboidSide[]
  resultLit: boolean
  interactive: boolean
  ariaLabel: string
  onPick: (side: number) => void
}

type Block = { w0: number; w1: number; d0: number; d1: number; z0: number; z1: number }
type Point = readonly [number, number]

const width = 640
const height = 330
const cube = 24
const across = Math.cos(Math.PI / 6) * cube
const down = cube / 2
const layerGap = 0.75
const sliceGap = 0.6
const centers = [166, 476]
const figureTop = 84

const project = (w: number, d: number, z: number) => [(w - d) * across, (w + d) * down - z * cube]

function blocksOf(split: CuboidSide['split'], size: CuboidSize): Block[] {
  if (split === 'layers') {
    return Array.from({ length: size.height }, (_, index) => ({
      w0: 0,
      w1: size.width,
      d0: 0,
      d1: size.depth,
      z0: index * (1 + layerGap),
      z1: index * (1 + layerGap) + 1,
    }))
  }
  return Array.from({ length: size.depth }, (_, index) => ({
    w0: 0,
    w1: size.width,
    d0: index * (1 + sliceGap),
    d1: index * (1 + sliceGap) + 1,
    z0: 0,
    z1: size.height,
  }))
}

function between(from: number, to: number) {
  return Array.from({ length: Math.max(0, Math.round(to - from) - 1) }, (_, index) => from + index + 1)
}

function BlockShape({ block, offset, now }: { block: Block; offset: [number, number]; now: boolean }) {
  const { w0, w1, d0, d1, z0, z1 } = block
  const point = (w: number, d: number, z: number): Point => {
    const [x, y] = project(w, d, z)
    return [x + offset[0], y + offset[1]]
  }
  const polygon = (corners: Point[]) => corners.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const faces = [
    { name: 'top', points: polygon([point(w0, d0, z1), point(w1, d0, z1), point(w1, d1, z1), point(w0, d1, z1)]), tint: 'fill-highlight-soft' },
    { name: 'front', points: polygon([point(w0, d1, z0), point(w1, d1, z0), point(w1, d1, z1), point(w0, d1, z1)]), tint: 'fill-none' },
    { name: 'right', points: polygon([point(w1, d0, z0), point(w1, d1, z0), point(w1, d1, z1), point(w1, d0, z1)]), tint: 'fill-ink opacity-10' },
  ]
  const segments: (readonly [Point, Point])[] = [
    ...between(w0, w1).flatMap((w) => [
      [point(w, d0, z1), point(w, d1, z1)] as const,
      [point(w, d1, z0), point(w, d1, z1)] as const,
    ]),
    ...between(d0, d1).flatMap((d) => [
      [point(w0, d, z1), point(w1, d, z1)] as const,
      [point(w1, d, z0), point(w1, d, z1)] as const,
    ]),
    ...between(z0, z1).flatMap((z) => [
      [point(w0, d1, z), point(w1, d1, z)] as const,
      [point(w1, d0, z), point(w1, d1, z)] as const,
    ]),
  ]
  return (
    <g data-cuboid-part={now ? 'now' : 'idle'}>
      {faces.map((face) => (
        <g key={face.name}>
          <polygon points={face.points} className="fill-paper" />
          <polygon points={face.points} className={face.tint} />
        </g>
      ))}
      {segments.map(([start, end]) => (
        <line key={`${start.join()}-${end.join()}`} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} className="stroke-ink opacity-50" />
      ))}
      {faces.map((face) => (
        <polygon
          key={face.name}
          points={face.points}
          strokeWidth={now ? 2.6 : 1.8}
          strokeLinejoin="round"
          className={`fill-none ${now ? 'stroke-marker' : 'stroke-ink'}`}
        />
      ))}
    </g>
  )
}

export function CuboidSlicesBoard({ size, sides, resultLit, interactive, ariaLabel, onPick }: CuboidSlicesBoardProps) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {sides.map((side, index) => {
        const blocks = blocksOf(side.split, size)
        const corners = blocks.flatMap((block) =>
          [block.w0, block.w1].flatMap((w) => [block.d0, block.d1].flatMap((d) => [block.z0, block.z1].map((z) => project(w, d, z)))),
        )
        const xs = corners.map(([x]) => x)
        const ys = corners.map(([, y]) => y)
        const center = centers[index]
        const offset: [number, number] = [center - (Math.min(...xs) + Math.max(...xs)) / 2, figureTop - Math.min(...ys)]
        const bottom = offset[1] + Math.max(...ys)
        return (
          <FigureSide
            key={index}
            side={index}
            label={side.label}
            title={side.title}
            expression={side.expression}
            textX={center}
            textY={26}
            anchor="middle"
            hit={{ x: index * (width / 2), y: 0, width: width / 2, height }}
            selected={side.selected}
            faded={side.faded}
            interactive={interactive}
            onPick={() => onPick(index)}
          >
            {blocks.map((block, part) =>
              side.parts[part]?.shown ? <BlockShape key={part} block={block} offset={offset} now={side.parts[part].now} /> : null,
            )}
            {side.note !== null && (
              <text x={center} y={bottom + 30} textAnchor="middle" className="fill-muted font-hand text-xl font-medium">
                {side.note}
              </text>
            )}
            {side.result !== null && <SvgResult x={center - 24} y={bottom + 66} value={side.result} lit={resultLit} />}
          </FigureSide>
        )
      })}
    </svg>
  )
}

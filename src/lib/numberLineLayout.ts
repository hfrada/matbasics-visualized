import { numberLabel } from './numberLabel'

export type LabelRowInput = { value: number; chars: number }
export type LabelRow = { x: number; row: number }

const charWidth = 8.4
const labelGap = 6
const overhang = 34

export function linePosition(lo: number, hi: number, left: number, right: number) {
  const unit = (right - left) / (hi - lo)
  return (value: number) => left + (value - lo) * unit
}

export function placeLabelRows(points: LabelRowInput[], px: (value: number) => number, left: number, right: number) {
  const placed: { x: number; row: number; width: number }[] = []
  const rows: LabelRow[] = []
  const order = points.map((point, index) => ({ point, index })).sort((a, b) => a.point.value - b.point.value)
  for (const { point, index } of order) {
    const width = point.chars * charWidth + labelGap
    const x = Math.min(Math.max(px(point.value), left - overhang + width / 2), right + overhang - width / 2)
    let row = 0
    while (placed.some((other) => other.row === row && Math.abs(other.x - x) < (other.width + width) / 2 + labelGap)) row += 1
    placed.push({ x, row, width })
    rows[index] = { x, row }
  }
  return rows
}

const tickLabelCharWidth = 8
const tickLabelGap = 3

export function lineTicks(lo: number, hi: number, unit = 1) {
  return Array.from({ length: Math.round((hi - lo) / unit) + 1 }, (_, index) => lo + index * unit)
}

export const isMultipleOf = (value: number, step: number) => Math.abs(value / step - Math.round(value / step)) < 1e-9

export function crowdedLabels(shown: number[], lo: number, hi: number, step: number, px: (value: number) => number, unit = 1) {
  const widthOf = (value: number) => numberLabel(value).length * tickLabelCharWidth
  const hidden: number[] = []
  for (const tick of lineTicks(lo, hi, unit)) {
    if (!isMultipleOf(tick, step) || shown.some((value) => Math.abs(value - tick) < 1e-9)) continue
    const crowded = shown.some((value) => Math.abs(px(value) - px(tick)) < (widthOf(value) + widthOf(tick)) / 2 + tickLabelGap)
    if (crowded) hidden.push(tick)
  }
  return hidden
}

type Point = { x: number; y: number }

export function segmentCrossing(a: [Point, Point], b: [Point, Point]): Point | null {
  const r = { x: a[1].x - a[0].x, y: a[1].y - a[0].y }
  const s = { x: b[1].x - b[0].x, y: b[1].y - b[0].y }
  const denominator = r.x * s.y - r.y * s.x
  if (Math.abs(denominator) < 1e-9) return null
  const qp = { x: b[0].x - a[0].x, y: b[0].y - a[0].y }
  const t = (qp.x * s.y - qp.y * s.x) / denominator
  const u = (qp.x * r.y - qp.y * r.x) / denominator
  const inside = (value: number) => value > 1e-6 && value < 1 - 1e-6
  return inside(t) && inside(u) ? { x: a[0].x + t * r.x, y: a[0].y + t * r.y } : null
}

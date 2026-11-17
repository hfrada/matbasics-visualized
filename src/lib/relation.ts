import { fraction, fractionTex } from './fraction'

export type Coordinate = [number, number]
export type PlaneView = { x: Coordinate; y: Coordinate; width: number; xStep: number; yStep: number }

const epsilon = 1e-9
const denominators = [1, 2, 3, 4]

export const near = (a: number, b: number) => Math.abs(a - b) < epsilon

export function range(from: number, to: number) {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index)
}

export function multiples(lo: number, hi: number, step: number) {
  return range(Math.ceil(lo / step - epsilon), Math.floor(hi / step + epsilon)).map((k) => k * step)
}

export function valueTex(value: number) {
  const denominator = denominators.find((candidate) => near(value * candidate, Math.round(value * candidate))) ?? 1
  return fractionTex(fraction(Math.round(value * denominator), denominator))
}

export const groupedTex = (value: number) => (value < -epsilon ? `(${valueTex(value)})` : valueTex(value))

export function inView(view: PlaneView, [x, y]: Coordinate) {
  return x >= view.x[0] - epsilon && x <= view.x[1] + epsilon && y >= view.y[0] - epsilon && y <= view.y[1] + epsilon
}

export function pairsWhere(first: number[], second: number[], holds: (a: number, b: number) => boolean): Coordinate[] {
  return first.flatMap((a) => second.filter((b) => holds(a, b)).map((b): Coordinate => [a, b]))
}

export function uniqueSorted(values: number[]) {
  return [...new Set(values)].sort((p, q) => p - q)
}

export function setTex(values: number[]) {
  return values.length === 0 ? '\\varnothing' : `\\{${values.map(valueTex).join(', ')}\\}`
}

export type IntervalSet = {
  kind: 'interval'
  lo: number
  hi: number
  loClosed: boolean
  hiClosed: boolean
}

export type SequenceSet = {
  kind: 'sequence'
  term: (n: number) => number
  index: (value: number) => number
  sup: number | null
  inf: number | null
}

export type BoundedSet = IntervalSet | SequenceSet

export type Witness = { value: number; n: number | null }

const tolerance = 1e-9
const searchLimit = 100000

export function boundedInterval(lo: number, hi: number, loClosed = false, hiClosed = false): IntervalSet {
  return { kind: 'interval', lo, hi, loClosed, hiClosed }
}

export function supremumOf(set: BoundedSet) {
  if (set.kind === 'sequence') return set.sup
  return Number.isFinite(set.hi) ? set.hi : null
}

export function infimumOf(set: BoundedSet) {
  if (set.kind === 'sequence') return set.inf
  return Number.isFinite(set.lo) ? set.lo : null
}

export function indexInSequence(set: SequenceSet, value: number) {
  const n = set.index(value)
  if (!Number.isFinite(n) || n < 1 - tolerance) return null
  const rounded = Math.round(n)
  return Math.abs(n - rounded) < 1e-6 ? rounded : null
}

export function inBoundedSet(set: BoundedSet, value: number) {
  if (set.kind === 'sequence') return indexInSequence(set, value) !== null
  const aboveLow = set.lo === -Infinity || value > set.lo + tolerance || (set.loClosed && Math.abs(value - set.lo) < tolerance)
  const belowHigh = set.hi === Infinity || value < set.hi - tolerance || (set.hiClosed && Math.abs(value - set.hi) < tolerance)
  return aboveLow && belowHigh
}

export function isUpperBound(set: BoundedSet, value: number) {
  const sup = supremumOf(set)
  return sup !== null && value >= sup - tolerance
}

export function isLowerBound(set: BoundedSet, value: number) {
  const inf = infimumOf(set)
  return inf !== null && value <= inf + tolerance
}

function firstTerm(set: SequenceSet, passes: (value: number) => boolean): Witness | null {
  for (let n = 1; n < searchLimit; n += 1) {
    const value = set.term(n)
    if (passes(value)) return { value, n }
  }
  return null
}

export function memberAbove(set: BoundedSet, value: number): Witness | null {
  if (isUpperBound(set, value)) return null
  if (set.kind === 'sequence') return firstTerm(set, (term) => term > value + tolerance)
  const base = Math.max(value, set.lo)
  if (set.hi === Infinity) return { value: Math.floor(base) + 1, n: null }
  return { value: set.hiClosed ? set.hi : (base + set.hi) / 2, n: null }
}

export function memberBelow(set: BoundedSet, value: number): Witness | null {
  if (isLowerBound(set, value)) return null
  if (set.kind === 'sequence') return firstTerm(set, (term) => term < value - tolerance)
  const base = Math.min(value, set.hi)
  if (set.lo === -Infinity) return { value: Math.ceil(base) - 1, n: null }
  return { value: set.loClosed ? set.lo : (base + set.lo) / 2, n: null }
}

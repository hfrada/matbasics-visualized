import { numberTex } from './numberLabel'

export type Relation = '<' | '<=' | '>' | '>=' | '='
export type Polynomial = number[]
export type Term = Polynomial | { absolute: Polynomial }
export type RelationChain = { sides: Term[]; relations: Relation[] }
export type SolutionEnd = { at: number; closed: boolean }
export type SolutionInterval = { kind: 'interval'; low: SolutionEnd | null; high: SolutionEnd | null }
export type SolutionSet =
  | SolutionInterval
  | { kind: 'union'; parts: SolutionInterval[] }
  | { kind: 'points'; values: number[] }
  | { kind: 'empty' }

const tolerance = 1e-9

const relationTex: Record<Relation, string> = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge', '=': '=' }

const relationHolds: Record<Relation, (left: number, right: number) => boolean> = {
  '<': (left, right) => left < right - tolerance,
  '<=': (left, right) => left <= right + tolerance,
  '>': (left, right) => left > right + tolerance,
  '>=': (left, right) => left >= right - tolerance,
  '=': (left, right) => Math.abs(left - right) < tolerance,
}

export function absolute(polynomial: Polynomial): Term {
  return { absolute: polynomial }
}

export function chain(first: Term, ...rest: (Relation | Term)[]): RelationChain {
  const sides = [first]
  const relations: Relation[] = []
  for (const item of rest) {
    if (typeof item === 'string') relations.push(item)
    else sides.push(item)
  }
  return { sides, relations }
}

export function evaluatePolynomial(polynomial: Polynomial, x: number) {
  return polynomial.reduce((sum, coefficient, power) => sum + coefficient * x ** power, 0)
}

function evaluateTerm(term: Term, x: number) {
  if (Array.isArray(term)) {
    const value = evaluatePolynomial(term, x)
    return { value, tex: numberTex(value) }
  }
  const inner = evaluatePolynomial(term.absolute, x)
  return { value: Math.abs(inner), tex: `\\lvert ${numberTex(inner)} \\rvert` }
}

function evaluateChain({ sides, relations }: RelationChain, x: number) {
  const terms = sides.map((side) => evaluateTerm(side, x))
  const holds = relations.every((relation, index) => relationHolds[relation](terms[index].value, terms[index + 1].value))
  const tex = terms.map((term, index) => (index < relations.length ? `${term.tex} ${relationTex[relations[index]]} ` : term.tex)).join('')
  return { holds, tex }
}

export function evaluateAlternatives(alternatives: RelationChain[], x: number, orWord: string) {
  const results = alternatives.map((alternative) => evaluateChain(alternative, x))
  return {
    holds: results.some((result) => result.holds),
    tex: results.map((result) => result.tex).join(`\\ \\text{${orWord}}\\ `),
  }
}

export function solutionIntervals(set: SolutionSet): SolutionInterval[] {
  if (set.kind === 'interval') return [set]
  if (set.kind === 'union') return set.parts
  return []
}

function inInterval({ low, high }: SolutionInterval, x: number) {
  const aboveLow = !low || (low.closed ? x >= low.at - tolerance : x > low.at + tolerance)
  const belowHigh = !high || (high.closed ? x <= high.at + tolerance : x < high.at - tolerance)
  return aboveLow && belowHigh
}

export function inSolutionSet(set: SolutionSet, x: number) {
  if (set.kind === 'points') return set.values.some((value) => Math.abs(value - x) < tolerance)
  return solutionIntervals(set).some((part) => inInterval(part, x))
}

export function solutionEnds(set: SolutionSet) {
  if (set.kind === 'points') return set.values
  return solutionIntervals(set).flatMap((part) => [part.low, part.high].flatMap((end) => (end ? [end.at] : [])))
}

import { numberLabel } from './numberLabel'

export type Fraction = { numerator: number; denominator: number }
export type Sequence = { start: number; term: (n: number) => Fraction }
export type Relation = 'less' | 'greater' | 'equal'
export type MonotoneProperty = 'increasing' | 'decreasing' | 'nonIncreasing' | 'nonDecreasing'

const tolerance = 1e-9
const searchLimit = 20000
const glyphDenominators = [2, 3, 4, 8]
const minusSign = '−'

const greatestDivisor = (a: number, b: number): number => (b === 0 ? Math.abs(a) : greatestDivisor(b, a % b))

export function fraction(numerator: number, denominator = 1): Fraction {
  const sign = denominator < 0 ? -1 : 1
  const divisor = greatestDivisor(Math.abs(numerator), Math.abs(denominator)) || 1
  return { numerator: (sign * numerator) / divisor + 0, denominator: (sign * denominator) / divisor }
}

export const fractionValue = (value: Fraction) => value.numerator / value.denominator

export function fractionDifference(a: Fraction, b: Fraction) {
  return fraction(a.numerator * b.denominator - b.numerator * a.denominator, a.denominator * b.denominator)
}

export function fractionLabel(value: Fraction) {
  const { numerator, denominator } = value
  const proper = Math.abs(numerator) < denominator
  if (denominator === 1 || (proper && glyphDenominators.includes(denominator))) return numberLabel(fractionValue(value))
  return `${numerator < 0 ? minusSign : ''}${Math.abs(numerator)}/${denominator}`
}

export function fractionTex(value: Fraction) {
  const { numerator, denominator } = value
  if (denominator === 1) return String(numerator)
  return `${numerator < 0 ? '-' : ''}\\tfrac{${Math.abs(numerator)}}{${denominator}}`
}

export const termValue = (sequence: Sequence, n: number) => fractionValue(sequence.term(n))

export function firstTermAbove(sequence: Sequence, bound: number) {
  for (let n = sequence.start; n < sequence.start + searchLimit; n += 1) if (termValue(sequence, n) > bound + tolerance) return n
  return null
}

export function firstTermBelow(sequence: Sequence, bound: number) {
  for (let n = sequence.start; n < sequence.start + searchLimit; n += 1) if (termValue(sequence, n) < bound - tolerance) return n
  return null
}

export function firstTermEqual(sequence: Sequence, value: number, terms = 200) {
  for (let n = sequence.start; n < sequence.start + terms; n += 1) if (Math.abs(termValue(sequence, n) - value) < tolerance) return n
  return null
}

export function relationOf(current: number, next: number): Relation {
  if (next > current + tolerance) return 'less'
  if (next < current - tolerance) return 'greater'
  return 'equal'
}

export const relationSymbols: Record<Relation, string> = { less: '<', greater: '>', equal: '=' }

export const monotoneProperties: MonotoneProperty[] = ['increasing', 'decreasing', 'nonIncreasing', 'nonDecreasing']

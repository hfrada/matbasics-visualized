export type Fraction = {
  numerator: number
  denominator: number
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : greatestCommonDivisor(b, a % b)
}

export function fraction(numerator: number, denominator = 1): Fraction {
  const sign = denominator < 0 ? -1 : 1
  const divisor = greatestCommonDivisor(numerator, denominator) || 1
  return { numerator: (sign * numerator) / divisor || 0, denominator: Math.abs(denominator) / divisor }
}

export function add(x: Fraction, y: Fraction) {
  return fraction(x.numerator * y.denominator + y.numerator * x.denominator, x.denominator * y.denominator)
}

export function subtract(x: Fraction, y: Fraction) {
  return fraction(x.numerator * y.denominator - y.numerator * x.denominator, x.denominator * y.denominator)
}

export function multiply(x: Fraction, y: Fraction) {
  return fraction(x.numerator * y.numerator, x.denominator * y.denominator)
}

export function divide(x: Fraction, y: Fraction) {
  if (y.numerator === 0) return null
  return fraction(x.numerator * y.denominator, x.denominator * y.numerator)
}

export function fractionTex(value: Fraction) {
  if (value.denominator === 1) return String(value.numerator)
  const sign = value.numerator < 0 ? '-' : ''
  return `${sign}\\tfrac{${Math.abs(value.numerator)}}{${value.denominator}}`
}

export function fractionPlain(value: Fraction) {
  const sign = value.numerator < 0 ? '−' : ''
  const size = Math.abs(value.numerator)
  return value.denominator === 1 ? `${sign}${size}` : `${sign}${size}/${value.denominator}`
}

export function operandTex(value: Fraction) {
  return value.numerator < 0 ? `(${fractionTex(value)})` : fractionTex(value)
}

export function operandPlain(value: Fraction) {
  return value.numerator < 0 ? `(${fractionPlain(value)})` : fractionPlain(value)
}

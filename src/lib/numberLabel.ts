const minusSign = '−'
const denominators = [1, 2, 4, 8, 3]
const fractionGlyphs: Record<string, string> = {
  '1/2': '½',
  '1/4': '¼',
  '3/4': '¾',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
  '1/3': '⅓',
  '2/3': '⅔',
}

function splitNumber(value: number) {
  const magnitude = Math.abs(value)
  const denominator = denominators.find((candidate) => Math.abs(magnitude * candidate - Math.round(magnitude * candidate)) < 1e-6) ?? 4
  const units = Math.round(magnitude * denominator)
  const whole = Math.floor(units / denominator)
  const rest = units % denominator
  return { negative: value < 0 && units > 0, digits: whole === 0 && rest > 0 ? '' : String(whole), rest, denominator }
}

export function numberLabel(value: number) {
  const { negative, digits, rest, denominator } = splitNumber(value)
  return `${negative ? minusSign : ''}${digits}${rest ? fractionGlyphs[`${rest}/${denominator}`] : ''}`
}

export function numberTex(value: number) {
  const { negative, digits, rest, denominator } = splitNumber(value)
  return `${negative ? '-' : ''}${digits}${rest ? `\\tfrac{${rest}}{${denominator}}` : ''}`
}

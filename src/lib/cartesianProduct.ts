export type TextPiece = {
  text: string
  italic?: boolean
  subscript?: boolean
}

export type Member = {
  tex: string
  plain: string
  pieces: TextPiece[]
  value?: number
}

export type NamedSet = {
  name: string
  members: Member[]
}

const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉'

export function letterMember(base: string, index: number): Member {
  return {
    tex: `${base}_${index}`,
    plain: `${base}${[...`${index}`].map((digit) => subscriptDigits[Number(digit)]).join('')}`,
    pieces: [{ text: base, italic: true }, { text: `${index}`, subscript: true }],
  }
}

export function numberMember(value: number): Member {
  const text = `${value}`.replace('-', '−')
  return { tex: `${value}`, plain: text, pieces: [{ text }], value }
}

export function pairPosition(index: number, rowCount: number) {
  return { column: Math.floor(index / rowCount), row: index % rowCount }
}

export function pairTex(first: Member, second: Member) {
  return `(${first.tex},${second.tex})`
}

export function pairPlain(first: Member, second: Member) {
  return `(${first.plain}, ${second.plain})`
}

export function pairPieces(first: Member, second: Member, separator: string): TextPiece[] {
  return [{ text: '(' }, ...first.pieces, { text: separator }, ...second.pieces, { text: ')' }]
}

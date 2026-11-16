export type Connective = 'not' | 'and' | 'or' | 'implies' | 'iff'

export type Letter = { kind: 'letter'; name: string }

export type Negation = { kind: 'not'; of: LogicExpression }

export type Compound = { kind: Exclude<Connective, 'not'>; left: LogicExpression; right: LogicExpression }

export type FormedExpression = Negation | Compound

export type LogicExpression = Letter | FormedExpression

export type TruthAssignment = Record<string, boolean>

export const connectiveTex: Record<Connective, string> = {
  not: '\\neg',
  and: '\\wedge',
  or: '\\vee',
  implies: '\\Rightarrow',
  iff: '\\Leftrightarrow',
}

export const connectiveGlyph: Record<Connective, string> = {
  not: '¬',
  and: '∧',
  or: '∨',
  implies: '⇒',
  iff: '⇔',
}

export function letter(name: string): Letter {
  return { kind: 'letter', name }
}

export function negation(of: LogicExpression): Negation {
  return { kind: 'not', of }
}

export function conjunction(left: LogicExpression, right: LogicExpression): Compound {
  return { kind: 'and', left, right }
}

export function disjunction(left: LogicExpression, right: LogicExpression): Compound {
  return { kind: 'or', left, right }
}

export function implication(left: LogicExpression, right: LogicExpression): Compound {
  return { kind: 'implies', left, right }
}

export function biconditional(left: LogicExpression, right: LogicExpression): Compound {
  return { kind: 'iff', left, right }
}

export function partsOf(expression: LogicExpression): LogicExpression[] {
  if (expression.kind === 'letter') return []
  if (expression.kind === 'not') return [expression.of]
  return [expression.left, expression.right]
}

export function expressionTex(expression: LogicExpression, grouped = false): string {
  if (expression.kind === 'letter') return expression.name
  if (expression.kind === 'not') return `${connectiveTex.not} ${expressionTex(expression.of, true)}`
  const tex = `${expressionTex(expression.left, true)} ${connectiveTex[expression.kind]} ${expressionTex(expression.right, true)}`
  if (!grouped) return tex
  return tex.includes('(') ? `[${tex}]` : `(${tex})`
}

export function evaluate(expression: LogicExpression, values: TruthAssignment): boolean {
  if (expression.kind === 'letter') return values[expression.name]
  if (expression.kind === 'not') return !evaluate(expression.of, values)
  const left = evaluate(expression.left, values)
  const right = evaluate(expression.right, values)
  if (expression.kind === 'and') return left && right
  if (expression.kind === 'or') return left || right
  if (expression.kind === 'implies') return !left || right
  return left === right
}

export function buildOrder(expression: LogicExpression): FormedExpression[] {
  const order: FormedExpression[] = []
  const visit = (node: LogicExpression) => {
    partsOf(node).forEach(visit)
    if (node.kind !== 'letter' && !order.some((item) => expressionTex(item) === expressionTex(node))) order.push(node)
  }
  visit(expression)
  return order
}

export function heightOf(expression: LogicExpression): number {
  const parts = partsOf(expression)
  return parts.length ? 1 + Math.max(...parts.map(heightOf)) : 0
}

export function letterCountOf(expression: LogicExpression): number {
  const parts = partsOf(expression)
  return parts.length ? parts.reduce((sum, part) => sum + letterCountOf(part), 0) : 1
}

export function levelOrder(expression: LogicExpression): FormedExpression[] {
  const order = buildOrder(expression)
  const isNegatedLetter = (item: FormedExpression) => item.kind === 'not' && item.of.kind === 'letter'
  const negatedLetters = order.filter(isNegatedLetter).sort((a, b) => expressionTex(a).localeCompare(expressionTex(b)))
  const rest = order
    .filter((item) => !isNegatedLetter(item))
    .map((item, index) => ({ item, index }))
    .sort((a, b) => heightOf(a.item) - heightOf(b.item) || a.index - b.index)
    .map(({ item }) => item)
  return [...negatedLetters, ...rest]
}

export function connectivesOf(expression: LogicExpression): Connective[] {
  if (expression.kind === 'letter') return []
  if (expression.kind === 'not') return ['not', ...connectivesOf(expression.of)]
  return [...connectivesOf(expression.left), expression.kind, ...connectivesOf(expression.right)]
}

export function lettersOf(expressions: LogicExpression[]): string[] {
  const names = new Set<string>()
  const visit = (node: LogicExpression) => {
    if (node.kind === 'letter') names.add(node.name)
    partsOf(node).forEach(visit)
  }
  expressions.forEach(visit)
  return [...names].sort()
}

export function truthRows(letters: string[]): TruthAssignment[] {
  return Array.from({ length: 2 ** letters.length }, (_, index) =>
    Object.fromEntries(letters.map((name, position) => [name, ((index >> (letters.length - 1 - position)) & 1) === 0])),
  )
}

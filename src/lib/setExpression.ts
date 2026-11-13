export type NamedSet = { kind: 'set'; name: string; index: number }

export type CombinedSet =
  | { kind: 'union' | 'intersection'; left: SetExpression; right: SetExpression }
  | { kind: 'complement'; of: SetExpression }

export type SetExpression = NamedSet | CombinedSet

export function namedSet(name: string, index: number): NamedSet {
  return { kind: 'set', name, index }
}

export function union(left: SetExpression, right: SetExpression): CombinedSet {
  return { kind: 'union', left, right }
}

export function intersection(left: SetExpression, right: SetExpression): CombinedSet {
  return { kind: 'intersection', left, right }
}

export function complement(of: SetExpression): CombinedSet {
  return { kind: 'complement', of }
}

function isBinary(expression: SetExpression) {
  return expression.kind === 'union' || expression.kind === 'intersection'
}

function groupedTex(expression: SetExpression) {
  const tex = expressionTex(expression)
  return isBinary(expression) ? `(${tex})` : tex
}

export function expressionTex(expression: SetExpression): string {
  if (expression.kind === 'set') return expression.name
  if (expression.kind === 'complement') return `${groupedTex(expression.of)}^C`
  const operator = expression.kind === 'union' ? '\\cup' : '\\cap'
  return `${groupedTex(expression.left)} ${operator} ${groupedTex(expression.right)}`
}

export function contains(expression: SetExpression, memberships: boolean[]): boolean {
  if (expression.kind === 'set') return memberships[expression.index]
  if (expression.kind === 'complement') return !contains(expression.of, memberships)
  const left = contains(expression.left, memberships)
  const right = contains(expression.right, memberships)
  return expression.kind === 'union' ? left || right : left && right
}

export function buildOrder(expression: SetExpression): CombinedSet[] {
  if (expression.kind === 'set') return []
  if (expression.kind === 'complement') return [...buildOrder(expression.of), expression]
  return [...buildOrder(expression.left), ...buildOrder(expression.right), expression]
}

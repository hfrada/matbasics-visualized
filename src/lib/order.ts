import type { IndexPair, RelationMatrix } from './relationProperties'

const indices = (matrix: RelationMatrix) => matrix.map((_, index) => index)
const below = (matrix: RelationMatrix, a: number, b: number) => a !== b && matrix[a][b]

export function hasseLevels(matrix: RelationMatrix): number[] {
  const levels: (number | undefined)[] = []
  const level = (b: number): number => {
    const known = levels[b]
    if (known !== undefined) return known
    const under = indices(matrix).filter((a) => below(matrix, a, b))
    const value = under.length === 0 ? 0 : 1 + Math.max(...under.map(level))
    levels[b] = value
    return value
  }
  return indices(matrix).map(level)
}

export function isCover(matrix: RelationMatrix, a: number, b: number) {
  return below(matrix, a, b) && !indices(matrix).some((c) => below(matrix, a, c) && below(matrix, c, b))
}

export function strictPairs(matrix: RelationMatrix): IndexPair[] {
  return indices(matrix).flatMap((a) => indices(matrix).filter((b) => below(matrix, a, b)).map((b): IndexPair => [a, b]))
}

export function coverPath(matrix: RelationMatrix, a: number, b: number): number[] {
  if (a === b) return [a]
  for (const c of indices(matrix)) {
    if (isCover(matrix, a, c) && (c === b || below(matrix, c, b))) return [a, ...coverPath(matrix, c, b)]
  }
  return [a, b]
}

export function incomparablePair(matrix: RelationMatrix): IndexPair | null {
  for (const a of indices(matrix)) {
    for (const b of indices(matrix)) if (a < b && !matrix[a][b] && !matrix[b][a]) return [a, b]
  }
  return null
}

export const minimalMembers = (matrix: RelationMatrix) => indices(matrix).filter((b) => !indices(matrix).some((a) => below(matrix, a, b)))
export const maximalMembers = (matrix: RelationMatrix) => indices(matrix).filter((a) => !indices(matrix).some((b) => below(matrix, a, b)))
export const leastMember = (matrix: RelationMatrix) => indices(matrix).find((a) => matrix[a].every(Boolean)) ?? null
export const greatestMember = (matrix: RelationMatrix) => indices(matrix).find((b) => matrix.every((row) => row[b])) ?? null
export const downSet = (matrix: RelationMatrix, b: number) => indices(matrix).filter((a) => below(matrix, a, b))
export const upSet = (matrix: RelationMatrix, a: number) => indices(matrix).filter((b) => below(matrix, a, b))

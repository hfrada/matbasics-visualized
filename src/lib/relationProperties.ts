export type RelationMatrix = boolean[][]
export type PropertyKey = 'reflexive' | 'symmetric' | 'antisymmetric' | 'transitive'
export type IndexPair = [number, number]

export type PropertyCase = {
  premises: IndexPair[]
  need: IndexPair
  wantIn: boolean
  holds: boolean
}

export type PropertyCheck = {
  holds: boolean
  cases: PropertyCase[]
  failure: PropertyCase | null
}

export const propertyKeys: PropertyKey[] = ['reflexive', 'symmetric', 'antisymmetric', 'transitive']

export function relationMatrix(size: number, holds: (i: number, j: number) => boolean): RelationMatrix {
  return Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => holds(i, j)))
}

export function relationPairs(matrix: RelationMatrix): IndexPair[] {
  return matrix.flatMap((row, i) => row.flatMap((inR, j) => (inR ? [[i, j] as IndexPair] : [])))
}

function caseOf(matrix: RelationMatrix, premises: IndexPair[], need: IndexPair, wantIn: boolean): PropertyCase {
  return { premises, need, wantIn, holds: matrix[need[0]][need[1]] === wantIn }
}

export function propertyCases(matrix: RelationMatrix, key: PropertyKey): PropertyCase[] {
  const size = matrix.length
  const indices = Array.from({ length: size }, (_, index) => index)
  if (key === 'reflexive') return indices.map((a) => caseOf(matrix, [], [a, a], true))
  if (key === 'transitive') {
    return indices.flatMap((a) =>
      indices.flatMap((b) =>
        a === b || !matrix[a][b] ? [] : indices.filter((c) => c !== b && matrix[b][c]).map((c) => caseOf(matrix, [[a, b], [b, c]], [a, c], true)),
      ),
    )
  }
  return indices.flatMap((a) =>
    indices
      .filter((b) => b > a && (matrix[a][b] || matrix[b][a]))
      .map((b) => {
        const premise: IndexPair = matrix[a][b] ? [a, b] : [b, a]
        return caseOf(matrix, [premise], [premise[1], premise[0]], key === 'symmetric')
      }),
  )
}

export function checkProperty(matrix: RelationMatrix, key: PropertyKey): PropertyCheck {
  const all = propertyCases(matrix, key)
  const failAt = all.findIndex((entry) => !entry.holds)
  return {
    holds: failAt === -1,
    cases: failAt === -1 ? all : all.slice(0, failAt + 1),
    failure: failAt === -1 ? null : all[failAt],
  }
}

export function equivalenceClasses(matrix: RelationMatrix): number[][] {
  const classes: number[][] = []
  matrix.forEach((row, a) => {
    if (classes.some((members) => members.includes(a))) return
    classes.push(row.flatMap((inR, x) => (inR ? [x] : [])))
  })
  return classes
}

export type SectionKey = 'setsAndNumbers' | 'logic' | 'realsAndRelations' | 'functionsAndProofs'
export type TopicKey =
  | 'writingSets'
  | 'subsetsAndComplement'
  | 'powerSet'
  | 'setOperations'
  | 'setOperationProperties'
  | 'cartesianProduct'
  | 'operationLimits'

export type Topic = {
  key: TopicKey
  slug: string
}

export type Section = {
  key: SectionKey
  slug: string
  topics: Topic[]
}

export const sections: Section[] = [
  {
    key: 'setsAndNumbers',
    slug: 'sets-and-numbers',
    topics: [
      { key: 'writingSets', slug: 'writing-sets' },
      { key: 'subsetsAndComplement', slug: 'subsets-and-complement' },
      { key: 'powerSet', slug: 'power-set' },
      { key: 'setOperations', slug: 'set-operations' },
      { key: 'setOperationProperties', slug: 'set-operation-properties' },
      { key: 'cartesianProduct', slug: 'cartesian-product' },
      { key: 'operationLimits', slug: 'limits-of-operations' },
    ],
  },
  { key: 'logic', slug: 'logic', topics: [] },
  { key: 'realsAndRelations', slug: 'reals-and-relations', topics: [] },
  { key: 'functionsAndProofs', slug: 'functions-and-proofs', topics: [] },
]

export function sectionPath(section: Section) {
  return `/${section.slug}`
}

export function topicPath(section: Section, topic: Topic) {
  return `/${section.slug}/${topic.slug}`
}

export function locateTopic(key: TopicKey) {
  for (const section of sections) {
    const index = section.topics.findIndex((topic) => topic.key === key)
    if (index !== -1) return { section, topic: section.topics[index], index }
  }
  throw new Error(`Unknown topic: ${key}`)
}

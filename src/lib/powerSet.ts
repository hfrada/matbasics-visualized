export function leafMembers(members: string[], leaf: number) {
  return members.filter((_, index) => (leaf >> (members.length - 1 - index)) & 1)
}

export function leafText(items: string[]) {
  return items.length > 0 ? `{${items.join(', ')}}` : '∅'
}

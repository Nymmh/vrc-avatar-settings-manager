import { Database } from 'better-sqlite3'

export function getNextDuplicateNumber(db: Database, base: string): number {
  const existing = db
    .prepare(`SELECT name FROM avatars WHERE name = ? OR name LIKE ? OR name LIKE ?`)
    .all(base, `${base} (%)`, `${base}(%)`) as Array<{ name: string }>

  if (existing.length === 0) return 2

  const existingNumbers = new Set<number>()
  const regex = /\((\d+)\)$/

  for (let i = 0; i < existing.length; i++) {
    const name = existing[i].name

    if (name === base) {
      existingNumbers.add(1)
      continue
    }

    const match = name.match(regex)
    if (match) existingNumbers.add(parseInt(match[1], 10))
  }

  let nextNum = 2
  const maxNum = 1000

  while (existingNumbers.has(nextNum) && nextNum < maxNum) {
    nextNum++
  }

  if (nextNum >= maxNum) {
    throw new Error('Max duplicate number exceeded')
  }

  return nextNum
}

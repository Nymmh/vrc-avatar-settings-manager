import Database from 'better-sqlite3'

export function getAvatarName(db: Database, avatarId: string): string | null {
  const result = db
    .prepare('SELECT name FROM avatarStorage WHERE avatarId = ? LIMIT 1')
    .get(avatarId) as { name: string } | undefined

  return result?.name || null
}

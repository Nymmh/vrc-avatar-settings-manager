import { Database } from 'better-sqlite3'

export function checkIfExistByNameAndAvatarId(
  db: Database,
  name: string,
  avatarId: string
): string | undefined {
  return db
    .prepare('SELECT id FROM avatars WHERE name = ? AND avatarId = ? LIMIT 1')
    .get(name, avatarId)?.id
}

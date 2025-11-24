import { Database } from 'better-sqlite3'

export function checkIfExistById(db: Database, id: number): string | undefined {
  return db.prepare('SELECT id FROM avatars WHERE id = ? LIMIT 1').get(id)?.id
}

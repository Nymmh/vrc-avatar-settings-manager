import { Database } from 'better-sqlite3'

export function checkIfExist(db: Database, name: string): string | undefined {
  return db.prepare('SELECT name FROM avatars WHERE name = ? LIMIT 1').get(name)?.name
}

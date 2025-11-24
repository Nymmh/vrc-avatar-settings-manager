import { Database } from 'better-sqlite3'

export function checkIfExist(db: Database, uqid: string): string | undefined {
  return db.prepare('SELECT id FROM avatars WHERE uqid = ? LIMIT 1').get(uqid)?.id
}

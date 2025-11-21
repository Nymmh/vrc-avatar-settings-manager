import { Database } from 'better-sqlite3'

export async function checkIfExist(db: Database, name: string): Promise<boolean> {
  return await db.prepare('SELECT * FROM avatars WHERE name = ?').get(name)
}

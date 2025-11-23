import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function getAllSaved(log: Logger, db: Database): getAllSavedInterface[] | null {
  try {
    const q = db.prepare('SELECT id,avatarId,name,avatarName,nsfw,fromFile FROM avatars')
    return q.all() as getAllSavedInterface[]
  } catch (e) {
    log.error('Error getting all saved configs:', e)
    return null
  }
}

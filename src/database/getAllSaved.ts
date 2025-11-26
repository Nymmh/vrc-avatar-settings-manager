import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function getAllSaved(
  log: Logger,
  db: Database,
  uqid?: string | undefined
): avatarDBInterface[] | null {
  try {
    if (uqid) {
      const q = db.prepare(
        'SELECT id,uqid,avatarId,name,avatarName,nsfw,fromFile,isPreset FROM avatars WHERE uqid = ? LIMIT 1'
      )
      return q.all(uqid) as avatarDBInterface[]
    } else {
      const q = db.prepare(
        'SELECT id,uqid,avatarId,name,avatarName,nsfw,fromFile,isPreset FROM avatars'
      )
      return q.all() as avatarDBInterface[]
    }
  } catch (e) {
    log.error('Error getting all saved configs:', e)
    return null
  }
}

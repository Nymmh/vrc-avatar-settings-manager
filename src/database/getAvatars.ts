import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function getAvatars(log: Logger, avatarDB: Database): getAllAvatarsInterface[] | null {
  try {
    const q = avatarDB.prepare('SELECT avatarId, name FROM avatarStorage').all()

    return q
  } catch (e) {
    log.info('Error getting loaded avatars:', e)
    return null
  }
}

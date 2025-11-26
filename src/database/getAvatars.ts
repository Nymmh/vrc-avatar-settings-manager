import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function getAvatars(
  log: Logger,
  avatarDB: Database,
  mainWindow: BrowserWindow
): getAllAvatarsInterface[] | null {
  try {
    const q = avatarDB.prepare('SELECT avatarId, name FROM avatarStorage').all()

    return q
  } catch (e) {
    log.error('Error getting loaded avatars:', e)
    return null
  }
}

import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'

export interface SavedConfigName {
  id: number
  name: string
}

export function getSavedNamesForAvatar(log: Logger, db: Database, avatarId: string): SavedConfigName[] {
  try {
    log.info(`Fetching saved names for avatarId: ${avatarId}`)
    return db.prepare('SELECT id,name FROM avatars WHERE avatarId = ?').all(avatarId) as SavedConfigName[]
  } catch (e) {
    log.error('Error getting saved names:', e)
    return []
  }
}

export function getNames(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  avatarId: string
): void {
  try {
    const names = getSavedNamesForAvatar(log, db, avatarId)

    mainWindow.webContents.send('savedNames', names)
  } catch (e) {
    log.error('Error getting saved names:', e)
  }
}

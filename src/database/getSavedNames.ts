import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'

export function getNames(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  avatarId: string
): void {
  try {
    const names = db
      .prepare('SELECT name FROM avatars WHERE avatarId = ?')
      .pluck()
      .all(avatarId) as string[]

    mainWindow.webContents.send('savedNames', names)
  } catch (e) {
    log.error('Error getting saved names:', e)
  }
}

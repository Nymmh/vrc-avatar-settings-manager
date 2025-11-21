import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'

export async function getNames(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  avatarId: string
): Promise<void> {
  try {
    const q = db.prepare('SELECT name FROM avatars WHERE avatarId = ?')
    const names = (await q.all(avatarId)).map((row) => row.name) as avatarDBInterface['name'][]

    mainWindow.webContents.send('savedNames', names)
  } catch (e) {
    log.error('Error getting saved names:', e)
    return
  }
}

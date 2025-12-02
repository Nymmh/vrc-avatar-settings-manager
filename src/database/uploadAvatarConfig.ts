import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { uploadAvatar } from './uploadAvatar'
import { BrowserWindow } from 'electron'

export async function uploadAvatarConfig(
  log: Logger,
  db: Database,
  loadedJson: exportAllConfigsInterface,
  mainWindow: BrowserWindow
): Promise<uploadAvatarConfigInterface> {
  return await uploadAvatar(log, db, loadedJson, mainWindow)
}

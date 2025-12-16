import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { syncAvatarNames } from './syncAvatarNames'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function updateAvatarData(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  avatarId: string,
  avatarName: string
): Promise<updateAvatarDataInterface> {
  try {
    if (!avatarId || !avatarName) {
      return { success: false, message: 'Avatar ID and name are required' }
    }

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Update Avatar',
      `Are you sure you want to update this avatar?`,
      mainWindow
    )

    if (userResponse.response !== 0) return { success: false, message: 'Update cancelled' }

    const q = db.prepare('UPDATE avatarStorage SET name = ? WHERE avatarId = ?')
    const result = q.run(avatarName, avatarId)

    if (result.changes === 0) {
      return { success: false, message: 'No avatar found with the provided ID' }
    }

    syncAvatarNames(log, db, avatarId)

    return { success: true }
  } catch (e) {
    log.info('Error updating avatar data:', e)
    return { success: false, message: 'Error updating avatar data' }
  }
}

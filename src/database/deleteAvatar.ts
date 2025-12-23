import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function deleteAvatar(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  avatarId: string
): Promise<deleteAvatarInterface> {
  try {
    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Confirm Delete',
      `Are you sure you want to delete this avatar? This action cannot be undone.`,
      mainWindow
    )

    if (userResponse.response !== 0) {
      log.info('User cancelled avatar deletion')
      return {
        success: false,
        message: 'User cancelled.'
      }
    }

    const deleteAvatar = db.prepare('DELETE FROM avatarStorage WHERE avatarId = ?').run(avatarId)
    db.prepare('DELETE FROM avatars WHERE avatarId = ?').run(avatarId)
    db.prepare('DELETE FROM presets WHERE avatarId = ?').run(avatarId)

    if (deleteAvatar.changes > 0) {
      log.info(`Deleted avatar`)
      return {
        success: true
      }
    } else {
      log.warn(`No avatar found`)
      return {
        success: false,
        message: 'No avatar found with the provided ID.'
      }
    }
  } catch {
    log.error(`Error deleting avatar`)
    return {
      success: false,
      message: 'Failed to delete avatar.'
    }
  }
}

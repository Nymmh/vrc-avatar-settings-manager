import { Logger } from 'electron-log'
import { Database } from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function deleteDatabase(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow
): Promise<boolean> {
  try {
    log.info('Deleting database...')

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      1,
      'Delete Database',
      `Are you sure you want to delete the database? This action cannot be undone.`,
      mainWindow
    )

    if (userResponse.response !== 0) {
      log.info('User cancelled database deletion')
      return false
    }

    const userResponse2 = await showDialogNoSound(
      ['Delete', 'Cancel'],
      1,
      'Confirm Delete Database',
      `This is your last chance to cancel. Deleting the database will remove all saved avatars and settings.`,
      mainWindow
    )

    if (userResponse2.response !== 0) {
      log.info('User cancelled database deletion at final confirmation')
      return false
    }

    db.prepare('DELETE FROM avatars').run()
    db.prepare('DELETE FROM avatarStorage').run()
    db.prepare('DELETE FROM presets').run()

    log.info('Database deleted successfully')
    return true
  } catch (e) {
    log.error('Error deleting database', e)
    return false
  }
}

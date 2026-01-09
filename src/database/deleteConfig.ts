import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function deleteConfig(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  id: number
): Promise<deleteConfigInterface> {
  try {
    log.info(`Deleting config`)
    if (!id || id <= 0) {
      log.error('Invalid ID')
      return { success: false, message: 'Invalid ID' }
    }

    const q = db.prepare('SELECT name, uqid FROM avatars WHERE id = ? LIMIT 1').get(id) as
      | { name: string; uqid: string }
      | undefined

    if (!q) {
      log.error('No saved config found with that ID')
      return { success: false, message: 'No saved config found with that ID' }
    }

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Confirm Delete',
      `Are you sure you want to delete this saved config ${q.name}? This action cannot be undone.`,
      mainWindow
    )

    if (userResponse.response !== 0) {
      log.info('Delete cancelled by user')
      return { success: false, message: 'Delete cancelled' }
    }

    const deleteResult = db.prepare('DELETE FROM avatars WHERE id = ?').run(id)

    if (deleteResult.changes === 0) {
      log.error('Failed to delete config')
      return { success: false, message: 'Failed to delete config' }
    }

    db.prepare('DELETE FROM presets WHERE forUqid = ?').run(q.uqid)

    log.info('Config deleted successfully')
    return { success: true, message: 'Config deleted successfully' }
  } catch (e) {
    log.error('Error deleting config:', e)
    return { success: false, message: 'Error deleting config' }
  }
}

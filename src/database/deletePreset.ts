import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { checkIfExist } from './checkIfExist'
import { showWarning } from '../services/showWarning'

export async function deletePreset(
  log: Logger,
  mainWindow: BrowserWindow,
  db: Database,
  id: number
): Promise<deletePresetInterface> {
  try {
    const existing = db
      .prepare(
        `
            SELECT forUqid,name FROM presets
            WHERE id = ?
            LIMIT 1
        `
      )
      .get(id) as { forUqid: string } | undefined

    if (!existing?.forUqid) {
      return { success: false, message: 'Preset not found' }
    }

    const userResponse = await showWarning(
      ['Yes', 'No'],
      0,
      'Confirm Delete',
      `Are you sure you want to delete this preset? This action cannot be undone.`,
      mainWindow
    )

    if (userResponse.response !== 0) return { success: false, message: 'Delete cancelled' }

    db.prepare(
      `UPDATE avatars
            SET isPreset = 0
            WHERE uqid = ?`
    ).run(existing.forUqid)

    db.prepare('DELETE FROM presets WHERE id = ?').run(id)

    return { success: true, message: 'Preset deleted successfully.' }
  } catch (e) {
    log.error('Error deleting preset:', e)
    return { success: false, message: 'Error deleting preset' }
  }
}

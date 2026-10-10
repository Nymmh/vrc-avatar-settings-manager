import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { syncAvatarNames } from './syncAvatarNames'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { generateNextPresetNumber } from './helpers/generateNextPresetNumber'

export async function updateAvatarData(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  avatarId: string,
  avatarName: string,
  updateId: string
): Promise<updateAvatarDataInterface> {
  try {
    log.info('Updating avatar data...')
    if (!avatarId || !avatarName || !updateId) {
      log.error('Avatar ID and name are required')
      return { success: false, message: 'Avatar ID and name are required' }
    }

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Update Avatar',
      `Are you sure you want to update this avatar?`,
      mainWindow
    )

    if (userResponse.response !== 0) {
      log.info('User cancelled avatar update')
      return { success: false, message: 'Update cancelled' }
    }

    const result = db.transaction(() => {
      const updated = db
        .prepare('UPDATE avatarStorage SET name = ? WHERE avatarId = ?')
        .run(avatarName, avatarId)
      if (updated.changes === 0) return updated

      if (updateId !== avatarId) {
        const avatarStorageExists = db
          .prepare('SELECT avatarId FROM avatarStorage WHERE avatarId = ? LIMIT 1')
          .get(updateId)
        if (!avatarStorageExists) {
          db.prepare('UPDATE avatarStorage SET avatarId = ? WHERE avatarId = ?').run(
            updateId,
            avatarId
          )

          db.prepare('UPDATE avatars SET avatarId = ? WHERE avatarId = ?').run(updateId, avatarId)

          db.prepare('UPDATE presets SET avatarId = ? WHERE avatarId = ?').run(updateId, avatarId)
        } else {
          db.prepare('UPDATE avatars SET avatarId = ? WHERE avatarId = ?').run(updateId, avatarId)

          const presetsToUpdate = db
            .prepare('SELECT id, unityParameter FROM presets WHERE avatarId = ?')
            .all(avatarId) as { id: number; unityParameter: number }[]

          for (const preset of presetsToUpdate) {
            const presetNumber = generateNextPresetNumber(db, avatarId)

            db.prepare('UPDATE presets SET avatarId = ?, unityParameter = ? WHERE id = ?').run(
              updateId,
              presetNumber,
              preset.id
            )
          }

          db.prepare('DELETE FROM avatarStorage WHERE avatarId = ?').run(avatarId)
        }
      }

      if (!syncAvatarNames(log, db, updateId)) throw new Error('Failed to sync avatar names')
      return updated
    })()

    if (result.changes === 0) {
      log.error('No avatar found with the provided ID')
      return { success: false, message: 'No avatar found with the provided ID' }
    }

    log.info('Avatar data updated successfully')

    return { success: true }
  } catch (e) {
    log.error('Error updating avatar data:', e)
    return { success: false, message: 'Error updating avatar data' }
  }
}
